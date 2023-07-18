import { NextFunction, Request, Response } from 'express';
import { project, stage_updates } from '@prisma/client';
import { CreateProjectDto } from '@dtos/projects.dto';
import { CreateStageDto } from '@/dtos/stages.dto';
import projectService from '@services/projects.service';
var moment = require('moment');
//googleapis
const { google } = require('googleapis');
const sheets = google.sheets('v4');
// spreadsheet id
const spreadsheetId = "1CBBsb8X_ZRfePEJKAAkNCCWNEYBCrabnuB9krZJWzEY";
const sourceSheetId = "444856550";
const sheetNameFormat = moment().format('DD MM YY hh:mm:ss');

const auth = new google.auth.GoogleAuth({
  keyFile: "./sheetkeys.json", //the key file
  //url to spreadsheets API
  scopes: "https://www.googleapis.com/auth/spreadsheets",
});

class ProjectsController {
  public projectService = new projectService();

  public createProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectData: CreateProjectDto = req.body;
      const createProjectData: project = await this.projectService.createProject(projectData);

      res.status(201).json({ message: 'Project Created Successfully...!', data: createProjectData });
    } catch (error) {
      next(error);
    }
  };

  public getProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const findAllProjectsData = await this.projectService.findAllProject(req);

      res.status(200).json({ message: 'List of Projects...!', data: findAllProjectsData, });
    } catch (error) {
      next(error);
    }
  };

  public getProjectById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = req.params.id;
      const findOneProjectData = await this.projectService.findProjectById(projectId);

      res.status(200).json({ message: 'Specific Project By ID...!', data: findOneProjectData });
    } catch (error) {
      next(error);
    }
  };

  public getPropertyData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const findOneProjectData: any = await this.projectService.findPropertyById(req);
      res.status(200).json({ message: 'Specific Property Data By Project ID...!', data: findOneProjectData });
    } catch (error) {
      next(error);
    }
  };


  public getProjectByName = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectName = req.params.name;
      const findOneProjectData: project[] = await this.projectService.findProjectByName(projectName);

      res.status(200).json({ message: 'Specific Project By NAME...!', data: findOneProjectData });
    } catch (error) {
      next(error);
    }
  };

  public getProjectByUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const drProjectUrl = req.params.url;
      const findOneProjectData: project = await this.projectService.findProjectByUrl(drProjectUrl);

      res.status(200).json({ message: 'Specific Project By URL...! ', data: findOneProjectData });
    } catch (error) {
      next(error);
    }
  };

  public updateProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = req.params.id;
      const projectData: CreateProjectDto = req.body;
      const updateProjectData = await this.projectService.updateProject(projectId, projectData);

      res.status(200).json({ message: 'Updated Project By ID...!', data: updateProjectData, });
    } catch (error) {
      next(error);
    }
  };

  public deleteProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = req.params.id;
      const deleteProjectData: project = await this.projectService.deleteProject(projectId);

      res.status(200).json({ message: 'Deleted Project By ID...!', data: deleteProjectData });
    } catch (error) {
      next(error);
    }
  };

  public calculateFSI = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let data = req.body
    const calculateFSI = await this.projectService.calculateFSI(data);
    res.status(200).json({ message: 'Calculated FSI...!', data: calculateFSI });
  }

  public addStage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stageData: CreateStageDto = req.body;
      const createStageData: stage_updates = await this.projectService.createStage(stageData);

      res.status(200).json({ message: 'Stage Added Successfully...!', data: createStageData });
    } catch (error) {
      next(error);
    }
  };

  public getAllLocality = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const getAllLocality = await this.projectService.getAllLocality();

      res.status(200).json({ message: 'success', data: getAllLocality });
    } catch (error) {
      next(error);
    }
  };

  public getProjectByBiddingStage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const findBiddingProject: stage_updates[] = await this.projectService.getBiddingProject();

      res.status(200).json({ message: 'List Of Project In Bidding Stage...!', data: findBiddingProject });
    } catch (error) {
      next(error);
    }
  };

  public projectsOfUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const findProjectOfUser = await this.projectService.findProjectOfSpecificUser(req.body);

      res.status(200).json({ message: 'Specific Users Of Project By ID...!', data: findProjectOfUser });
    } catch (error) {
      next(error);
    }
  };
}

export default ProjectsController;
