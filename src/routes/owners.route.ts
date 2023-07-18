import { Router } from 'express';
import OwnersController from '@controllers/owner.controller';
import { CreateOwnerDto } from '@dtos/owners.dto';
import { Routes } from '@interfaces/routes.interface';
import validationMiddleware from '@middlewares/validation.middleware';
import authMiddleware from '@/middlewares/auth.middleware';

class OwnersRoute implements Routes {
  public path = '/owner';
  public router = Router();
  public ownersController = new OwnersController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, authMiddleware, validationMiddleware(CreateOwnerDto, 'body'), this.ownersController.createOwner);
    this.router.get(`${this.path}/getByMobile/:mobile`, this.ownersController.getOwnerByMobile);
    this.router.get(`${this.path}/:id`, this.ownersController.getOwnerById);
    this.router.get(`${this.path}`, this.ownersController.getOwners);
    this.router.put(`${this.path}/:id`, authMiddleware, this.ownersController.updateOwner);
    this.router.delete(`${this.path}/:id`, authMiddleware, this.ownersController.deleteOwner);
  }
}

export default OwnersRoute;
