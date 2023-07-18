import { NextFunction, Request, Response } from 'express';
import { transaction } from '@prisma/client';
import { CreateTransactionDto } from '@dtos/transaction.dto';
import TransactionService from '@services/transaction.service';

class TransactionController {
  public transactionService = new TransactionService();

  public createTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const transactionData: CreateTransactionDto = req.body;
      const createTransactionData: transaction = await this.transactionService.createTransaction(transactionData);

      res.status(201).json({ message: 'Transaction Created Successfully...!', data: createTransactionData });
    } catch (error) {
      next(error);
    }
  };

  public getTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const findAllTransactionData: transaction[] = await this.transactionService.findAllTransaction(req);

      res.status(200).json({ message: 'List Of Transactions Sent Successfully...!', data: findAllTransactionData });

    } catch (error) {
      next(error);
    }
  };

  public getTransactionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      const findOneTransactionData: transaction = await this.transactionService.findTransactionById(id);

      res.status(200).json({ message: 'Specific Transaction By ID...!', data: findOneTransactionData });
    } catch (error) {
      next(error);
    }
  };

  public updateTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      const transactionData: CreateTransactionDto = req.body;
      const updateTransactionData: transaction = await this.transactionService.updateTransaction(id, transactionData);

      res.status(200).json({ message: 'Updated Transaction By ID...!', data: updateTransactionData });
    } catch (error) {
      next(error);
    }
  };

  public deleteTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      const deleteTransactionData: transaction = await this.transactionService.deleteTransaction(id);

      res.status(200).json({ message: 'Deleted Transaction Data By ID...!', data: deleteTransactionData });
    } catch (error) {
      next(error);
    }
  };

  public returnBidTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const biddingData = req.body;
      const createBiddingData: transaction = await this.transactionService.returnBiddingData(biddingData);

      res.status(200).json({ message: 'Bidding Return successfully...!', data: createBiddingData });

    } catch (error) {
      next(error);
    }
  }

  public getReturnBidDevelopers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = req.query.projectId as string;
      const developerData = await this.transactionService.getReturnBidDevelopers(projectId);

      res.status(200).json({ message: `Sent Developers List To Return Bid For Project-Id ${projectId}`, data: developerData });
    } catch (error) {
      next(error);
    }
  }

  public approveTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const transactionId = req.body.transactionId as string;
      await this.transactionService.approveTransaction(transactionId);

      res.status(200).json({ message: `Transaction ID ${transactionId} approved successfully` });

    } catch (error) {
      next(error);
    }
  }
  
  public getBidTotal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = req.query.projectId as string;
      const bidTotalData = await this.transactionService.getBidTotal(projectId);

      res.status(200).json({ 
        message: `Bid total for project-id ${projectId} sent successfully`,
        data: bidTotalData 
      });

    } catch (error) {
      next(error);
    }    
  }
}

export default TransactionController;
