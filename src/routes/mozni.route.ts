import { Router } from 'express';
import { Routes } from '@/interfaces/routes.interface';
import MozniController from '@/controllers/mozni .controller';
import { CreateMozniDto } from '@/dtos/mozni.dto';
import validationMiddleware from '@/middlewares/validation.middleware';
import authMiddleware from '@/middlewares/auth.middleware';

class MozniRoute implements Routes {
  public path = '/mozni';
  public router = Router();
  public mozniController = new MozniController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, authMiddleware, validationMiddleware(CreateMozniDto, 'body'), this.mozniController.createMozni);
    this.router.get(`${this.path}/:id`, this.mozniController.getMozniById);  
    this.router.get(`${this.path}/getByName/:name`, this.mozniController.getMozniByName);  
    this.router.put(`${this.path}/:id`, authMiddleware, this.mozniController.updateMozni);
    this.router.delete(`${this.path}/:id`, authMiddleware, this.mozniController.deleteMozni);
    this.router.post(`${this.path}/search`, authMiddleware, this.mozniController.searchMozni);
    this.router.get(`${this.path}`, this.mozniController.getMozni);
  }
}

export default MozniRoute;
