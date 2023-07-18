import { NextFunction, Request, Response } from 'express';
import { owner } from '@prisma/client';
import { CreateOwnerDto } from '@dtos/owners.dto';
import ownerService from '@services/owners.service';

class OwnersController {
  public ownerService = new ownerService();

  public createOwner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ownerData: CreateOwnerDto = req.body;
      const createOwnerData: owner = await this.ownerService.createOwner(ownerData);

      res.status(201).json({ message: 'Owner Created Successfully...!', data: createOwnerData });
    } catch (error) {
      next(error);
    }
  };

  public getOwners = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const findAllOwnersData: owner[] = await this.ownerService.findAllOwner(req);

      res.status(200).json({ message: 'List of Owners...!', data: findAllOwnersData, });
    } catch (error) {
      next(error);
    }
  };

  public getOwnerById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ownerId = req.params.id;
      const findOneOwnerData = await this.ownerService.findOwnerById(ownerId);

      res.status(200).json({ message: 'Specific owner By ID...!', data: findOneOwnerData });
    } catch (error) {
      next(error);
    }
  };

  public getOwnerByMobile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {

      const mobileNumber = req.params.mobile;
      const mobile = Number(mobileNumber);

      const findOneOwnerData: owner = await this.ownerService.findOwnerByMobile(mobile);

      res.status(200).json({ message: 'Specific Owner By MOBILE...!', data: findOneOwnerData });
    } catch (error) {
      next(error);
    }
  };

  public updateOwner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ownerId = req.params.id;
      const ownerData: CreateOwnerDto = req.body;
      const updateOwnerData: owner = await this.ownerService.updateOwner(ownerId, ownerData);

      res.status(200).json({ message: 'Updated Owner By ID...!', data: updateOwnerData, });
    } catch (error) {
      next(error);
    }
  };

  public deleteOwner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ownerId = req.params.id;
      const deleteOwnerData: owner = await this.ownerService.deleteOwner(ownerId);

      res.status(200).json({ message: 'Deleted Owner By ID...!', data: deleteOwnerData });
    } catch (error) {
      next(error);
    }
  };
}

export default OwnersController;
