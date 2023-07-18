import { Router } from 'express';
import LawyerController from '@controllers/lawyer.controller';
import { Routes } from '@/interfaces/routes.interface';
import { CreateLawyerDto } from '@/dtos/lawyer.dto';
import validationMiddleware from '@/middlewares/validation.middleware';
import authMiddleware from '@/middlewares/auth.middleware';

class LawyerRoute implements Routes {
  public path = '/lawyer';
  public router = Router();
  public lawyerController = new LawyerController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, authMiddleware, validationMiddleware(CreateLawyerDto, 'body'), this.lawyerController.createLawyer);
    this.router.get(`${this.path}/getByUrl/:url`, this.lawyerController.getLawyerByUrl);
    this.router.get(`${this.path}/:id`, this.lawyerController.getLawyerById);  
    this.router.get(`${this.path}/getByName/:name`, this.lawyerController.getLawyerByName);  
    this.router.put(`${this.path}/:id`, authMiddleware, this.lawyerController.updateLawyer);
    this.router.delete(`${this.path}/:id`, authMiddleware, this.lawyerController.deleteLawyer);
    this.router.post(`${this.path}/search`, authMiddleware, this.lawyerController.searchLawyer);
    this.router.get(`${this.path}`, this.lawyerController.getLawyer);
  }
}

export default LawyerRoute;
