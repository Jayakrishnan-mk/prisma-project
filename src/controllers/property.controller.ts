import { NextFunction, Request, Response } from 'express';
import { property } from '@prisma/client';
import { CreatePropertyDto } from '@dtos/property.dto';
import propertyService from '@services/property.service';

class PropertyController {
  public propertyService = new propertyService();

  public createProperty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const propertyData: CreatePropertyDto = req.body;
      const createPropertyData: property = await this.propertyService.createProperty(propertyData);

      res.status(201).json({ message: 'Property Created Successfully...!', data: createPropertyData });
    } catch (error) {
      next(error);
    }
  };

  public getProperty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const findAllPropertyData: property[] = await this.propertyService.findAllProperty(req);

      res.status(200).json({ message: 'List of Properties...!', data: findAllPropertyData, });
    } catch (error) {
      next(error);
    }
  };

  public getPropertyById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const propertyId = req.params.id;
      const findOnePropertyData: property = await this.propertyService.findPropertyById(propertyId);

      res.status(200).json({ message: 'Specific property By ID...!', data: findOnePropertyData });
    } catch (error) {
      next(error);
    }
  };

  public updateProperty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const propertyId = req.params.id;
      const propertyData: CreatePropertyDto = req.body;
      const updatePropertyData: property = await this.propertyService.updateProperty(propertyId, propertyData);

      res.status(200).json({ message: 'Updated Property By ID...!', data: updatePropertyData, });
    } catch (error) {
      next(error);
    }
  };

  public deleteProperty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const propertyId = req.params.id;
      const deletePropertyData: property = await this.propertyService.deleteProperty(propertyId);

      res.status(200).json({ message: 'Deleted Property By ID...!', data: deletePropertyData });
    } catch (error) {
      next(error);
    }
  };

  public uploadDocs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const propertyId = req.params.id;
      const uploadDocs = req.body.uploadDocuments;
      const uploadPropertyDocs: property = await this.propertyService.uploadPropertyDocs(propertyId, uploadDocs);

      res.status(200).json({ message: 'Property Documents Uploaded Successfully...!', data: uploadPropertyDocs });
    } catch (error) {
      console.log(error);
      return error;
    }
  }
}

export default PropertyController;
