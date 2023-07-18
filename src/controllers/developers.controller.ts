import { NextFunction, Request, Response } from 'express';
import DeveloperService from '@/services/developers.service';
import { developer } from '@prisma/client';
import { CreateDeveloperDto } from '@/dtos/developers.dto';


class DevelopersController {
  public developerService = new DeveloperService();

  public createDeveloper = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const developerData: CreateDeveloperDto = req.body;

      const createDeveloperData: developer = await this.developerService.createDeveloper(developerData);

      res.status(201).json({ message: 'Developer Created Successfully...!', data: createDeveloperData });
    } catch (error) {
      next(error);
    }
  };

  public getDevelopers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const findAllDevelopersData: developer[] = await this.developerService.findAllDeveloper(req);

      res.status(200).json({ message: 'List of Developers...!', data: findAllDevelopersData });

    } catch (error) {
      next(error);
    }
  };

  public getDeveloperById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const developerId = req.params.id;
      const findOneDeveloperData: developer = await this.developerService.findDeveloperById(developerId);

      res.status(200).json({ message: 'Specific Developer By ID...!', data: findOneDeveloperData });
    } catch (error) {
      next(error);
    }
  };

  public getDeveloperByUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const drDeveloperUrl = req.params.url;
      const findOneDeveloperData: developer = await this.developerService.findDeveloperByUrl(drDeveloperUrl);

      res.status(200).json({ message: 'Specific Developer By URL...!', data: findOneDeveloperData });
    } catch (error) {
      next(error);
    }
  };

  public getDeveloperByName = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const nameQuery = req.params.name;
      const findOneDeveloperData: developer[] = await this.developerService.findDeveloperByName(nameQuery);

      res.status(200).json({ message: 'Specific Developer By NAME...!', data: findOneDeveloperData });
    } catch (error) {
      next(error);
    }
  };

  public updateDeveloper = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const developerId = req.params.id;
      const developerData: CreateDeveloperDto = req.body;
      const updateDeveloperData: developer = await this.developerService.updateDeveloper(developerId, developerData);

      res.status(200).json({ message: 'Updated Developer By ID...!', data: updateDeveloperData });
    } catch (error) {
      next(error);
    }
  };

  public deleteDeveloper = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const developerId = req.params.id;
      const deleteDeveloperData: developer = await this.developerService.deleteDeveloper(developerId);

      res.status(200).json({ message: 'Deleted Developer By ID...!', data: deleteDeveloperData });
    } catch (error) {
      next(error);
    }
  };

  public searchDeveloper = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const searchText = req.body.searchText;

      const searchDeveloperData: developer[] = await this.developerService.searchDeveloper(searchText);
      res.status(200).json({ message: 'Searched Developer By Name...!', data: searchDeveloperData });
    } catch (error) {
      next(error);
    }
  };
}

export default DevelopersController;
