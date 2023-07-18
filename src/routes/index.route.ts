import { Router } from 'express';
import IndexController from '@controllers/index.controller';
import { Routes } from '@interfaces/routes.interface';
import { uploadFileToPrivateBucket, uploadFileToPublicBucket } from '@/middlewares/s3.middleware';

class IndexRoute implements Routes {
  public path = '/';
  public router = Router();
  public indexController = new IndexController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, (req, res) => {
      res.send("HEALTH OK")
    });
    this.router.post(`${this.path}getSignedDownloadUrl`, this.indexController.getSignedDownloadUrl);
    this.router.post(`${this.path}uploads`, uploadFileToPublicBucket.array('images', 10), this.indexController.uploadImages);
    this.router.post(`${this.path}uploads/private`, uploadFileToPrivateBucket.array('images'), this.indexController.uploadImages);
  }
}

export default IndexRoute;
