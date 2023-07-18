import { Router } from 'express';
import { Routes } from '@/interfaces/routes.interface';
import { uploadFileToPrivateBucket, uploadFileToPublicBucket } from '@/middlewares/s3.middleware';
import ExcelController from '@/controllers/excel.controller';
import authMiddleware from '@/middlewares/auth.middleware';

class ExcelsRoute implements Routes {
    public path = '/excel';
    public router = Router();
    public excelsController = new ExcelController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(`${this.path}`, this.excelsController.getExcel);//authMiddleware,
        this.router.get(`${this.path}/:id`, this.excelsController.getExcelPropertyById);
        this.router.get(`${this.path}/getVersionByProjectId/:id` , authMiddleware ,this.excelsController.getVersionByProjectId);
    }
}

export default ExcelsRoute;
