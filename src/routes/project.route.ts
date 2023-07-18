import { Router } from 'express';
import ProjectsController from '@controllers/project.controller';
// import TestController from '@controllers/test.controller';
import { CreateProjectDto } from '@dtos/projects.dto';
import { CreateStageDto } from '@/dtos/stages.dto';
import { Routes } from '@interfaces/routes.interface';
import validationMiddleware from '@middlewares/validation.middleware';
import authMiddleware from '@/middlewares/auth.middleware';

class ProjectsRoute implements Routes {
  public path = '/project';
  public path1 = '/calculateFSI';
  public path2 = '/filter';
  public router = Router();
  public projectsController = new ProjectsController();
  // public testController = new TestController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, validationMiddleware(CreateProjectDto, 'body'), this.projectsController.createProject);
    this.router.post(`${this.path}/specificUserProjects`, authMiddleware, this.projectsController.projectsOfUser);
    this.router.get(`${this.path}/getByName/:name`, this.projectsController.getProjectByName);
    this.router.get(`${this.path}/getByUrl/:url`, this.projectsController.getProjectByUrl);
    this.router.get(`${this.path}/getByBiddingStage`, this.projectsController.getProjectByBiddingStage);

    // this.router.get(`${this.path}/test`, this.testController.testOwner);
    
    this.router.get(`${this.path}/propertyData`, this.projectsController.getPropertyData);
    this.router.get(`${this.path}/:id`, this.projectsController.getProjectById);
    this.router.put(`${this.path}/:id`, authMiddleware, this.projectsController.updateProject);
    this.router.delete(`${this.path}/:id`, authMiddleware, this.projectsController.deleteProject);
    this.router.get(`${this.path}`, this.projectsController.getProjects);
    this.router.post(`${this.path1}`, this.projectsController.calculateFSI);
    this.router.post(`${this.path}/addStage`, authMiddleware, validationMiddleware(CreateStageDto, 'body'), this.projectsController.addStage);

    this.router.get(`${this.path2}/getAllLocality` ,this.projectsController.getAllLocality);
    
  }
}

export default ProjectsRoute;
