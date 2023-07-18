import { PrismaClient, owner, stage_updates, Prisma } from '@prisma/client';
import { CreateOwnerDto } from '@dtos/owners.dto';
import { HttpException } from '@exceptions/HttpException';
import { isEmpty, mobileValidation, passwordGenerator } from '@utils/util';
import { Request } from 'express';

const owner = new PrismaClient().owner;
const user = new PrismaClient().user;
const project = new PrismaClient().project;
const property = new PrismaClient().property;
const stage_updates = new PrismaClient().stage_updates;

class OwnerService {

  public async createOwner(ownerData: CreateOwnerDto): Promise<owner> {
    try {
      const mobileNumber = ownerData.mobile.toString();

      if (mobileNumber.length !== 10) {
        throw new HttpException(400, "Mobile number is not valid...!");
      }

      const mobile = Number(mobileNumber)
      const findOwner: owner = await owner.findFirst({ where: { mobile } });
      if (findOwner) throw new HttpException(400, `Your mobile number ${ownerData.mobile} already exist...!`);

      let uniqueProjectIds, uniquePropertyIds, createOwnerData
      if (ownerData.projectId) {
        uniqueProjectIds = Array.from(new Set(ownerData.projectId));
      }
      if (ownerData.propertyId) {
        uniquePropertyIds = Array.from(new Set(ownerData.propertyId));
      }

      try {
        createOwnerData = await owner.create({
          data: {
            ...ownerData,
            projectId: uniqueProjectIds ? uniqueProjectIds : [],
            propertyId: uniquePropertyIds ? uniquePropertyIds : []
          }
        });
      } catch (err) {
        console.log(err)
        return err
      }

      if (uniqueProjectIds) {
        await project.updateMany({
          where: {
            projectId: {
              in: uniqueProjectIds
            }
          },
          data: {
            ownerId: {
              push: createOwnerData.ownerId
            }
          }
        });
      }

      if (uniquePropertyIds) {
        await property.updateMany({
          where: {
            propertyId: {
              in: uniquePropertyIds
            }
          },
          data: {
            ownerId: {
              push: createOwnerData.ownerId
            }
          }
        });
      }
      //////////////////////////////////////////////////
      let password = await passwordGenerator();

      const mobileExists = await user.findFirst({
        where: { mobile }
      })

      if (mobileExists) {
        await user.update({
          where: { mobile },
          data: {
            ownerId: createOwnerData.ownerId
          }
        })
      }
      else {
        await user.create({
          data: {
            emailId: createOwnerData.emailId,
            password,
            mobile: createOwnerData.mobile,
            ownerId: createOwnerData.ownerId
          }
        })
      }
      //////////////////////////////////////////////////
      return createOwnerData;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async findAllOwner(req: any): Promise<owner[]> {
    try {
      let skip = (parseInt(req.query.pageNumber) - 1) * parseInt(req.query.pageSize);
      let take = parseInt(req.query.pageSize);
      let sortBy = req.query.sortBy;
      let order = req.query.order;

      if (order && !sortBy) {
        throw new HttpException(400, "Provide sortBy with order...!")
      }

      if (!order) {
        order = 'asc';
      }

      const count = await owner.count({
        where:
          { isDeleted: false }
      });

      let allOwner;

      if (!sortBy) {
        allOwner = (await owner.findMany({
          include: {
            project: {
              include: {
                address: true
              }
            },
            property: {
              include: {
                project: true
              }
            },
            propertyrole: true
          },
        })).sort(
          (owner1: any, owner2: any): any => {
            return (new Date(owner2["updatedAt"]) as any) - (new Date(owner1["updatedAt"]) as any)
          })

        let requiredData = allOwner.filter(owner => !owner.isDeleted);

        let actualData;

        if (skip && take) {
          actualData = requiredData.slice(skip, skip + take);
        }
        else if (skip == 0 && take) {
          actualData = requiredData.slice(skip, skip + take);
        }
        else if (skip == 0 && !take) {
          throw new HttpException(400, "Provide page size with page number...!");
        }
        else if (skip && !take) {
          throw new HttpException(400, "Provide page size with page number...!");
        }
        else if (!skip && take) {
          skip = 0;
          actualData = requiredData.slice(skip, skip + take);
        }
        else {
          actualData = requiredData;
        }

        let data: any = {};
        data.count = count;
        data.allOwner = actualData;
        return data;

      }
      else {
        allOwner = (await owner.findMany({
          include: {
            project: {
              include: {
                address: true
              }
            },
            property: {
              include: {
                project: true
              }
            },
            propertyrole: true
          },
        })).sort(
          (owner1: any, owner2: any): any => {
            if (sortBy == "firstName") {
              if (order == 'asc') {
                return owner1[sortBy].toLowerCase().localeCompare(owner2[sortBy].toLowerCase());
              }
              else {
                return owner2[sortBy].toLowerCase().localeCompare(owner1[sortBy].toLowerCase());
              }
            }
          }
        )

        let requiredData = allOwner.filter(owner => !owner.isDeleted);

        let actualData;

        if (skip && take) {
          actualData = requiredData.slice(skip, skip + take);
        }
        else if (skip == 0 && take) {
          actualData = requiredData.slice(skip, skip + take);
        }
        else if (skip == 0 && !take) {
          throw new HttpException(400, "Provide page size with page number...!");
        }
        else if (skip && !take) {
          throw new HttpException(400, "Provide page size with page number...!");
        }
        else if (!skip && take) {
          skip = 0;
          actualData = requiredData.slice(skip, skip + take);
        }
        else {
          actualData = requiredData;
        }

        let data: any = {};
        data.count = count;
        data.allOwner = actualData;
        return data;
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async findOwnerById(ownerId: string): Promise<any> {
    try {
      let stageArray = [];

      const findOwner = await owner.findFirst({
        where:
          { ownerId: ownerId },
        include: {
          project: {
            include: {
              address: true
            }
          },
          property: {
            include: {
              project: true
            }
          },
          propertyrole: true
        }
      });

      if (findOwner.project)

        stageArray = findOwner.project;
      for (let element of stageArray) {
        const findStage: stage_updates = await stage_updates.findFirst({
          where: {
            projectId: element.projectId
          },
          orderBy: {
            createdAt: Prisma.SortOrder.desc
          }
        });
        element.projectStages = findStage.projectStages;
      }

      if (!findOwner) throw new HttpException(400, "This Owner ID doesn't exist...!");
      return findOwner;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async findOwnerByMobile(mobile: number): Promise<owner> {
    try {
      const findOwner: owner = await owner.findUnique({
        where:
          { mobile },
        include: {
          project: {
            include: {
              address: true
            }
          },
          property: {
            include: {
              project: true
            }
          },
          propertyrole: true
        }
      });
      if (!findOwner) throw new HttpException(400, "This Owner number doesn't exist...!");

      return findOwner;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async updateOwner(ownerId: string, ownerData: CreateOwnerDto): Promise<owner> {
    try {
      if (isEmpty(ownerData)) throw new HttpException(400, "Owner data cannot be empty...!");

      const findOwner: owner = await owner.findUnique({ where: { ownerId: ownerId } });
      if (!findOwner) throw new HttpException(400, "This owner ID doesn't exist...!");

      await mobileValidation(ownerData, findOwner);

      const uniqueProjectIds: Array<string> = Array.from(new Set(ownerData.projectId));
      const uniquePropertyIds: Array<string> = Array.from(new Set(ownerData.propertyId));

      const updateOwnerData = await owner.update({
        where: { ownerId },
        data: {
          ...ownerData,
          projectId: uniqueProjectIds,
          propertyId: uniquePropertyIds
        }
      });

      await project.updateMany({
        where: {
          projectId: {
            in: uniqueProjectIds
          }
        },
        data: {
          ownerId: {
            push: ownerId
          }
        }
      });

      await property.updateMany({
        where: {
          propertyId: {
            in: uniquePropertyIds
          }
        },
        data: {
          ownerId: {
            push: ownerId
          }
        }
      });

      return updateOwnerData;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async deleteOwner(ownerId: string): Promise<owner> {
    try {
      if (isEmpty(ownerId)) throw new HttpException(400, "Owner data cannot be empty...!");

      const deleteOwnerData: owner = await owner.update({
        where: { ownerId: ownerId },
        data: { isDeleted: true }
      });
      if (!deleteOwnerData) throw new HttpException(400, "Owner data doesn't exist...!");

      return deleteOwnerData;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}

export default OwnerService;
