import { NextFunction, Request, Response } from 'express';
import LawyerService from '@/services/lawyer.service';
import { lawyer } from '@prisma/client';
import { CreateLawyerDto } from '@/dtos//lawyer.dto';

class LawyerController {
  public lawyerService = new LawyerService();

  public createLawyer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lawyerData: CreateLawyerDto = req.body;
      const createLawyerData: lawyer = await this.lawyerService.createLawyer(lawyerData);

      res.status(201).json({ message: 'Lawyer Created Successfully...!', data: createLawyerData });
    } catch (error) {
      next(error);
    }
  };

  public getLawyer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const findAllLawyersData: lawyer[] = await this.lawyerService.findAllLawyer(req);

      res.status(200).json({ message: 'List of Lawyers...!', data: findAllLawyersData });

    } catch (error) {
      next(error);
    }
  };

  public getLawyerById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lawyerId = req.params.id;
      const findOneLawyerData: lawyer = await this.lawyerService.findLawyerById(lawyerId);

      res.status(200).json({ message: 'Specific Lawyer By ID...!', data: findOneLawyerData });
    } catch (error) {
      next(error);
    }
  };

  public getLawyerByUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const drLawyerUrl = req.params.url;
      const findOneLawyerData: lawyer = await this.lawyerService.findLawyerByUrl(drLawyerUrl);

      res.status(200).json({ message: 'Specific Lawyer By URL...!', data: findOneLawyerData });
    } catch (error) {
      next(error);
    }
  };

  public getLawyerByName = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lawyerName = req.params.name;
      const findOneLawyerData: lawyer[] = await this.lawyerService.findLawyerByName(lawyerName);

      res.status(200).json({ message: 'Specific Lawyer By NAME...!', data: findOneLawyerData });
    } catch (error) {
      next(error);
    }
  };

  public updateLawyer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lawyerId = req.params.id;
      const lawyerData: CreateLawyerDto = req.body;
      const updateLawyerData: lawyer = await this.lawyerService.updateLawyer(lawyerId, lawyerData);

      res.status(200).json({ message: 'Updated Lawyer By ID...!', data: updateLawyerData, });
    } catch (error) {
      next(error);
    }
  };

  public deleteLawyer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lawyerId = req.params.id;
      const deleteLawyerData: lawyer = await this.lawyerService.deleteLawyer(lawyerId);

      res.status(200).json({ message: 'Deleted Lawyer By ID...!', data: deleteLawyerData });
    } catch (error) {
      next(error);
    }
  };

  public searchLawyer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const searchText = req.body.searchText;

      const searchLawyerData: lawyer[] = await this.lawyerService.searchLawyer(searchText);
      res.status(200).json({ message: 'Searched Lawyer By NAME...!', data: searchLawyerData });
    } catch (error) {
      next(error);
    }
  };
}

export default LawyerController;
