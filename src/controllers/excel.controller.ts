/* eslint-disable prettier/prettier */
import { CreatePropertyDto } from '@/dtos/property.dto';
import { HttpException } from '@/exceptions/HttpException';
import ExcelService from '@/services/xls.service';
import { property } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';


class ExcelController {
  public excelService = new ExcelService();

  public getExcel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const propertyData  = req.body;
      const allExcelData = await this.excelService.addExcelFileDetails(propertyData);
      res.status(200).json({ data: allExcelData, message: 'Excel Data Recorded' });
    } catch (error) {
      next(error);
    }
  };


  public getExcelPropertyById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = req.params.id;
      const allPropertyData: property[] = await this.excelService.getExcelDataByProjectId(projectId);

      res.status(200).json({ message: 'excel url', data: allPropertyData });
    } catch (error) {
      next(error);
    }
  };

  public getVersionByProjectId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = req.params.id;
      const getVersionByProjectId = await this.excelService.getVersionsOfuploadedExcel(projectId);

      res.status(200).json({ message: 'versions sent', data: getVersionByProjectId });
    } catch (error) {
      next(error);
    }
  };


}

export default ExcelController;
