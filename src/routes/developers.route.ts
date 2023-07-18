import { Router } from 'express';
import DevelopersController from '@controllers/developers.controller';
import { Routes } from '@/interfaces/routes.interface';
import { CreateDeveloperDto } from '@/dtos/developers.dto';
import validationMiddleware from '@/middlewares/validation.middleware';
import authMiddleware from '@/middlewares/auth.middleware';

class DevelopersRoute implements Routes {
  public path = '/developer';
  public router = Router();
  public developersController = new DevelopersController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, authMiddleware, validationMiddleware(CreateDeveloperDto, 'body'), this.developersController.createDeveloper);
    this.router.get(`${this.path}/getByUrl/:url`, this.developersController.getDeveloperByUrl);
    this.router.get(`${this.path}/:id`, this.developersController.getDeveloperById);  
    this.router.get(`${this.path}/getByName/:name`, this.developersController.getDeveloperByName);  
    this.router.put(`${this.path}/:id`, this.developersController.updateDeveloper);
    this.router.delete(`${this.path}/:id`, authMiddleware, this.developersController.deleteDeveloper);
    // this.router.post(`${this.path}/login/google`, this.usersController.loginUserWithGoogle);
    this.router.post(`${this.path}/search`, authMiddleware, this.developersController.searchDeveloper);
    this.router.get(`${this.path}`, this.developersController.getDevelopers);
  }
}

export default DevelopersRoute;
