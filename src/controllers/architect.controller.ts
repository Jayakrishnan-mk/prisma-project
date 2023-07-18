import { NextFunction, Request, Response } from 'express';
import ArchitectService from '@/services/architect.service';
import { architect } from '@prisma/client';
import { CreateArchitectDto } from '@/dtos/architect.dto';

class ArchitectController {
  public architectService = new ArchitectService();

  public createArchitect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const architectData: CreateArchitectDto = req.body;
      const createArchitectData: architect = await this.architectService.createArchitect(architectData);

      res.status(201).json({ message: 'Architect Created Successfully...!', data: createArchitectData });
    } catch (error) {
      next(error);
    }
  };

  public getArchitect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const findAllArchitectsData: architect[] = await this.architectService.findAllArchitect(req);

      res.status(200).json({ message: 'List of Architects...!', data: findAllArchitectsData });

    } catch (error) {
      next(error);
    }
  };

  public getArchitectById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const architectId = req.params.id;
      const findOneArchitectData: architect = await this.architectService.findArchitectById(architectId);

      res.status(200).json({ message: 'Specific Architect By ID...!', data: findOneArchitectData });
    } catch (error) {
      next(error);
    }
  };

  public getArchitectByUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const drArchitectUrl = req.params.url;
      const findOneArchitectData: architect = await this.architectService.findArchitectByUrl(drArchitectUrl);

      res.status(200).json({ message: 'Specific Architect By URL...!', data: findOneArchitectData });
    } catch (error) {
      next(error);
    }
  };

  public getArchitectByName = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const architectName = req.params.name;
      const findOneArchitectData: architect[] = await this.architectService.findArchitectByName(architectName);

      res.status(200).json({ message: 'Specific Architect By NAME...!', data: findOneArchitectData });
    } catch (error) {
      next(error);
    }
  };

  public updateArchitect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const architectId = req.params.id;
      const architectData: CreateArchitectDto = req.body;
      const updateArchitectData: architect = await this.architectService.updateArchitect(architectId, architectData);

      res.status(200).json({ message: 'Updated Architect By ID...!', data: updateArchitectData, });
    } catch (error) {
      next(error);
    }
  };

  public deleteArchitect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const architectId = req.params.id;
      const deleteArchitectData: architect = await this.architectService.deleteArchitect(architectId);

      res.status(200).json({ message: 'Deleted Architect By ID...!', data: deleteArchitectData });
    } catch (error) {
      next(error);
    }
  };

  public searchArchitect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const searchText = req.body.searchText;

      const searchArchitectData: architect[] = await this.architectService.searchArchitect(searchText);
      res.status(200).json({ message: 'Searched Architect By Name...!', data: searchArchitectData });
    } catch (error) {
      next(error);
    }
  };
}

export default ArchitectController;
