import { Router } from 'express';
import PropertyController from '@controllers/property.controller';
import { CreatePropertyDto } from '@dtos/property.dto';
import { Routes } from '@interfaces/routes.interface';
import validationMiddleware from '@middlewares/validation.middleware';
import authMiddleware from '@/middlewares/auth.middleware';

class PropertyRoute implements Routes {
  public path = '/property';
  public router = Router();
  public propertyController = new PropertyController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, authMiddleware, validationMiddleware(CreatePropertyDto, 'body'), this.propertyController.createProperty);
    this.router.get(`${this.path}/:id`, this.propertyController.getPropertyById);
    this.router.get(`${this.path}`, this.propertyController.getProperty);
    this.router.put(`${this.path}/:id`, authMiddleware, this.propertyController.updateProperty);
    this.router.delete(`${this.path}/:id`, authMiddleware, this.propertyController.deleteProperty);
    this.router.post(`${this.path}/uploadPropertyDocs/:id`, authMiddleware, this.propertyController.uploadDocs);
  }
}

export default PropertyRoute;
