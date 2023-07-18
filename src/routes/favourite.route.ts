import { Router } from 'express';
import FavouriteController from '@controllers/favourite.controller';
import { CreateFavouriteDto } from '@dtos/favourite.dto';
import { Routes } from '@interfaces/routes.interface';
import validationMiddleware from '@middlewares/validation.middleware';
import authMiddleware from '@/middlewares/auth.middleware';

class FavouriteRoute implements Routes {
  public path = '/favourite';
  public router = Router();
  public favouriteController = new FavouriteController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, authMiddleware, validationMiddleware(CreateFavouriteDto, 'body'), this.favouriteController.addFavourite);
    this.router.get(`${this.path}/:id`, this.favouriteController.getfavouriteByDevId);
  }
}

export default FavouriteRoute;
