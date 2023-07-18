import { Router } from 'express';
import ArchitectController from '@controllers/architect.controller';
import { Routes } from '@/interfaces/routes.interface';
import { CreateArchitectDto } from '@/dtos/architect.dto';
import validationMiddleware from '@/middlewares/validation.middleware';
import authMiddleware from '@/middlewares/auth.middleware';

class ArchitectRoute implements Routes {
  public path = '/architect';
  public router = Router();
  public architectController = new ArchitectController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, authMiddleware, validationMiddleware(CreateArchitectDto, 'body'), this.architectController.createArchitect);
    this.router.get(`${this.path}/getByUrl/:url`, this.architectController.getArchitectByUrl);
    this.router.get(`${this.path}/:id`, this.architectController.getArchitectById);  
    this.router.get(`${this.path}/getByName/:name`, this.architectController.getArchitectByName);  
    this.router.put(`${this.path}/:id`, authMiddleware, this.architectController.updateArchitect);
    this.router.delete(`${this.path}/:id`, authMiddleware, this.architectController.deleteArchitect);
    this.router.post(`${this.path}/search`, authMiddleware, this.architectController.searchArchitect);
    this.router.get(`${this.path}`, this.architectController.getArchitect);
  }
}

export default ArchitectRoute;
