import { Prisma, PrismaClient, category_type, property, transaction, amount_type,
payment_status, user_type, developer, transaction_approval_status } from '@prisma/client';
import { CreateTransactionDto } from '@dtos/transaction.dto';
import { HttpException } from '@exceptions/HttpException';
import { isEmpty } from '@utils/util';

const transaction = new PrismaClient().transaction;
const general_settings = new PrismaClient().general_settings;
const stage_updates = new PrismaClient().stage_updates;
const project = new PrismaClient().project;

class TransactionService {

  public async createTransaction(transactionData: CreateTransactionDto): Promise<transaction> {
    try {
      const findTransactionNumber: transaction = await transaction.findFirst({ where: { transactionNumber: transactionData.transactionNumber } });
      if (findTransactionNumber) throw new HttpException(400, `Your transaction number ${transactionData.transactionNumber} already exist...!`);

      if (!transactionData.personaId) {
        throw new HttpException(400, "Please provide persona-id!");
      }

      if (transactionData.category === category_type.BIDDING) {
        if (!transactionData.projectId) {
          throw new HttpException(400, "Please provide project-id...!");
        }
        if (!transactionData.amount) {
          throw new HttpException(400, "Please provide transaction amount...!");
        }

        const checkBid = await transaction.findFirst({
          where: {
            projectId: transactionData.projectId,
            personaId: transactionData.personaId,
            category: category_type.BIDDING,
            approvalStatus: {
              in: [transaction_approval_status.APPROVED, transaction_approval_status.PENDING]
            }
          }
        });

        if (checkBid) {
          throw new HttpException(400, "Cannot bid on this project! Approved or Pending transaction is already present in DB!");
        }

      } else if (transactionData.category === category_type.SUBSCRIPTION) {
        if (transactionData.isPaymentOnline == null) {
          throw new HttpException(400, "Please provide isPaymentOnline boolean for subscription...!");
        }
      }

      let subscriptionEndDate: Date;
      if (transactionData.category === category_type.SUBSCRIPTION &&
        transactionData.amountType === amount_type.CREDIT) {
        const subscriptionData = await transaction.findFirst({
          where: {
            category: category_type.SUBSCRIPTION,
            amountType: amount_type.CREDIT,
            persona: transactionData.persona,
            personaId: transactionData.personaId,
            subscriptionEndDate: {
              gt: new Date()
            }
          }
        });

        if (subscriptionData) {
          subscriptionEndDate = new Date(subscriptionData.subscriptionEndDate);
          subscriptionEndDate.setFullYear(subscriptionData.subscriptionEndDate.getFullYear() + 1);
        } else {
          subscriptionEndDate = new Date();
          subscriptionEndDate.setFullYear(new Date().getFullYear() + 1);
        }

        const settingsData = await general_settings.findFirst();
        transactionData.amount = settingsData.subscriptionAmount;
      }

      const createTransactionData: transaction = await transaction.create({
        data: { ...transactionData, subscriptionEndDate }
      });

      return createTransactionData;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async findAllTransaction(req: any): Promise<transaction[]> {
    try {
      let skip = (parseInt(req.query.pageNumber) - 1) * parseInt(req.query.pageSize);
      let take = parseInt(req.query.pageSize);
      let whereObj: any = {};

      if (req.query.personaId) {
        whereObj.personaId = req.query.personaId;
      }
      if ([category_type.BIDDING, category_type.SUBSCRIPTION].includes(req.query.category)) {
        whereObj.category = req.query.category;
      }

      const approvalStatusArray = [transaction_approval_status.APPROVED, transaction_approval_status.NOT_APPROVED, transaction_approval_status.PENDING];
      if (approvalStatusArray.includes(req.query.approvalStatus)) {
        whereObj.approvalStatus = req.query.approvalStatus;
      }

      const obj = {
        skip,
        take,
        where: whereObj,
        include: {
          project: {
            include: {
              address: true
            }
          },
          developer: true,
          lawyer: true,
          architect: true
        },
        orderBy: {
          createdAt: Prisma.SortOrder.desc
        }
      }

      if (!req.query.pageSize || !req.query.pageNumber) {
        delete obj.skip;
        delete obj.take;
      }
   
      const allTransaction = await transaction.findMany(obj);
      
      for (let transaction of allTransaction) {
        const stage = await stage_updates.findFirst({
          where: { projectId: transaction.project?.projectId },
          orderBy: {
            createdAt: Prisma.SortOrder.desc
          }
        });
        (transaction as any).projectStage = stage.projectStages;
      }

      const count = await transaction.count({
        where: whereObj
      });

      let data: any = {};
      data.count = count;
      data.transactions = allTransaction;
      return data;
      
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async findTransactionById(id: string): Promise<transaction> {
    try {
      const findTransaction: transaction = await transaction.findUnique({
        where:
          { id },
        // include: {
        //   project: true,
        // }
      });
      if (!findTransaction) throw new HttpException(400, "This Transaction ID doesn't exist...!");

      return findTransaction;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async updateTransaction(id: string, transactionData: CreateTransactionDto): Promise<transaction> {
    try {
      if (isEmpty(transactionData)) throw new HttpException(400, "Transaction Data cannot be empty...!");

      const findTransaction: transaction = await transaction.findUnique({ where: { id } });
      if (!findTransaction) throw new HttpException(400, "This Transaction ID doesn't exist...!");

      const updateTransactionData = await transaction.update({ where: { id }, data: { ...transactionData } });
      return updateTransactionData;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async deleteTransaction(id: string): Promise<transaction> {
    try {
      if (isEmpty(id)) throw new HttpException(400, "Transaction data cannot be empty...!");

      const deleteTransactionData: transaction = await transaction.update({
        where: { id },
        //data: { isDeleted: true }
        data: {}
      });
      if (!deleteTransactionData) throw new HttpException(400, "Transaction data doesn't exist...!");

      return deleteTransactionData;

    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async returnBiddingData(transactionData): Promise<transaction> {
    try {
      if (isEmpty(transactionData.personaId)) throw new HttpException(400, "PersonaId cannot be empty...!");
      if (isEmpty(transactionData.projectId)) throw new HttpException(400, "ProjectId cannot be empty...!");
      if (isEmpty(transactionData.transactionNumber)) throw new HttpException(400, "TransactionNumber cannot be empty...!");

      const findTransactionNumber: transaction = await transaction.findFirst({ where: { transactionNumber: transactionData.transactionNumber } });
      if (findTransactionNumber) throw new HttpException(400, `Your transaction number ${transactionData.transactionNumber} already exist...!`);

      const biddingData: transaction = await transaction.findFirst({
        where: {
          personaId: transactionData.personaId,
          projectId: transactionData.projectId,
          amountType: amount_type.CREDIT,
          category: category_type.BIDDING
        },
        orderBy: {
          createdAt: Prisma.SortOrder.desc
        }
      });

      if (!biddingData) {
        throw new HttpException(400,"Transaction Data not found...!");
      }

      delete biddingData.id;

      const newBiddingData: transaction = await transaction.create({
        data: {
          persona: biddingData.persona,
          personaId: biddingData.personaId,
          projectId: biddingData.projectId,
          transactionNumber: transactionData.transactionNumber,
          category: category_type.BIDDING,
          amount: biddingData.amount,
          amountType: amount_type.DEBIT,
          additionalInfo: transactionData.additionalInfo,
          paymentStatus: payment_status.SUCCESS
        }
      });

      return newBiddingData;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async getReturnBidDevelopers(projectId: string): Promise<any> {
    try {
      if (isEmpty(projectId)) throw new HttpException(400, "Please provide project-id...!");

      const bidReturnedDeveloperIds = await transaction.findMany({
        where: {
          projectId,
          persona: user_type.developer,
          category: category_type.BIDDING,
          amountType: amount_type.DEBIT
        },
        select: {
          personaId: true
        }
      });

      let developerIds = [];
      for (let element of bidReturnedDeveloperIds) {
        developerIds.push(element.personaId);
      }

      const result = await transaction.findMany({
        where: {
          projectId,
          persona: user_type.developer,
          category: category_type.BIDDING,
          approvalStatus: transaction_approval_status.APPROVED,
          personaId: {
            notIn: developerIds
          }
        },
        include: {
          developer: true
        }
      });

      let final_data: developer[] = [];
      for (let element of result) {
        final_data.push(element.developer);
      }

      return final_data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async approveTransaction(transactionId: string): Promise<any> {
    try {
      if (isEmpty(transactionId)) throw new HttpException(400, "Please provide transaction-id!");

      const transactionData = await transaction.findFirst({
        where: { id: transactionId }
      });

      if (!transactionData) {
        throw new HttpException(400, "Transaction does not exist!");
      }
      
      await transaction.update({
        where: { id: transactionId },
        data: { approvalStatus: transaction_approval_status.APPROVED }
      });

      return;

    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async getBidTotal(projectId: string): Promise<any> {
    try {
      if (isEmpty(projectId)) throw new HttpException(400, "Please provide project-id!");

      const projectData = await project.findFirst({
        where: { projectId }
      });

      if (!projectData) {
        throw new HttpException(400, "Project does not exist!");
      }
      if (!projectData.bankName || !projectData.biddingAmount) {
        throw new HttpException(400, "Project bank name or bidding amount is empty!");
      }

      const bankName = projectData.bankName;
      const biddingAmount = projectData.biddingAmount;
      const gstAmount = parseFloat((biddingAmount * 0.18).toFixed(2)) ;
      const totalBidAmount = biddingAmount + gstAmount;

      return { bankName, biddingAmount, gstAmount, totalBidAmount };

    } catch (error) {
      console.log(error);
      throw error;
    }
  }

}
export default TransactionService;