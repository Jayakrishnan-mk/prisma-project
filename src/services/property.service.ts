import { PrismaClient, property } from '@prisma/client';
import { CreatePropertyDto } from '@dtos/property.dto';
import { HttpException } from '@exceptions/HttpException';
import { isEmpty } from '@utils/util';
import { Request } from 'express';
const property = new PrismaClient().property;

class PropertyService {

  public async createProperty(propertyData: CreatePropertyDto): Promise<property> {
    try {
      const createPropertyData: property = await property.create({ data: { ...propertyData } });
      return createPropertyData;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async findAllProperty(req: any): Promise<property[]> {
    try {
      let skip = (parseInt(req.query.pageNumber) - 1) * parseInt(req.query.pageSize);
      let take = parseInt(req.query.pageSize);

      const obj = {
        skip, take, where: { isDeleted: false },
        include: {
          project: true,
          owner: true,
        }
      }

      const count = await property.count({
        where:
          { isDeleted: false }
      });

      if (!req.query.pageSize && !req.query.pageNumber) {
        delete obj.skip;
        delete obj.take;
      }

      const allProperty: property[] = await property.findMany(obj);
      let data: any = {};
      data.count = count;
      data.allProperty = allProperty;
      return data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async findPropertyById(propertyId: string): Promise<property> {
    try {
      const findProperty: property = await property.findUnique({
        where:
          { propertyId },
        include: {
          project: true,
          owner: true
        }
      });
      if (!findProperty) throw new HttpException(400, "This Property ID doesn't exist...!");

      return findProperty;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async updateProperty(propertyId: string, propertyData: CreatePropertyDto): Promise<property> {
    try {
      if (isEmpty(propertyData)) throw new HttpException(400, "Property data cannot be empty...!");

      const findProperty: property = await property.findUnique({ where: { propertyId: propertyId } });
      if (!findProperty) throw new HttpException(400, "This property ID doesn't exist...!");

      const updatePropertyData = await property.update({ where: { propertyId }, data: { ...propertyData } });
      return updatePropertyData;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async deleteProperty(propertyId: string): Promise<property> {
    try {
      if (isEmpty(propertyId)) throw new HttpException(400, "Property data cannot be empty...!");

      const deletePropertyData: property = await property.update({
        where: { propertyId },
        data: { isDeleted: true }
      });
      if (!deletePropertyData) throw new HttpException(400, "Property data doesn't exist...!");

      return deletePropertyData;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async uploadPropertyDocs(propertyId: string, uploadDocs: any): Promise<property> {
    try {
      const uploadPropertyDocs: property = await property.update({
        where: { propertyId },
        data: {
          uploadDocuments: uploadDocs
        }
    });
      return uploadPropertyDocs;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

}
export default PropertyService;