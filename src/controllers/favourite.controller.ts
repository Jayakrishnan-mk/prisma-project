import { NextFunction, Request, Response } from 'express';
import { favourite } from '@prisma/client';
import { CreateFavouriteDto } from '@dtos/favourite.dto';
import FavouriteService from '@services/favourite.service';

class FavouriteController {
  public favouriteService = new FavouriteService();

  public addFavourite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const favouriteData: CreateFavouriteDto = req.body;
      const createFavouriteData: favourite = await this.favouriteService.createFavourite(favouriteData);

      res.status(201).json({ message: 'Added to Favourite Successfully...!', data: createFavouriteData });
    } catch (error) {
      next(error);
    }
  };

  public getfavouriteByDevId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const developerId = req.params.id;
      const findFavouriteByDevId: favourite = await this.favouriteService.findFavouriteByDevId(developerId);

      res.status(200).json({ message: 'List of Favourite projects by developer...!', data: findFavouriteByDevId, });
    } catch (error) {
      next(error);
    }
  };
}

export default FavouriteController;
