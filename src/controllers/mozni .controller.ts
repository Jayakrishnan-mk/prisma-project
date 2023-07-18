import { NextFunction, Request, Response } from 'express';
import MozniService from "@/services/mozni.service";
import { CreateMozniDto } from '@/dtos/mozni.dto';
import { mozni } from "@prisma/client"

class MozniController {
    public mozniService = new MozniService();

    public createMozni = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const mozniData: CreateMozniDto = req.body;
            const createMozniData: mozni = await this.mozniService.createMozni(mozniData);

            res.status(201).json({ message: 'Mozni Created Successfully...!', data: createMozniData });
        } catch (error) {
            next(error);
        }
    };

    public getMozni = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const findAllMoznisData: mozni[] = await this.mozniService.findAllMozni(req);

            res.status(200).json({ message: 'List of Moznis...!', data: findAllMoznisData });

        } catch (error) {
            next(error);
        }
    };

    public getMozniById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const mozniId = req.params.id;
            const findOneMozniData: mozni = await this.mozniService.findMozniById(mozniId);

            res.status(200).json({ message: 'Specific Mozni By ID...!', data: findOneMozniData });
        } catch (error) {
            next(error);
        }
    };

    public getMozniByName = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const mozniName = req.params.name;
            const findOneMozniData: mozni[] = await this.mozniService.findMozniByName(mozniName);

            res.status(200).json({ message: 'Specific Mozni By NAME...!', data: findOneMozniData });
        } catch (error) {
            next(error);
        }
    };

    public updateMozni = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const mozniId = req.params.id;
            const mozniData: CreateMozniDto = req.body;
            const updateMozniData: mozni = await this.mozniService.updateMozni(mozniId, mozniData);

            res.status(200).json({ message: 'Updated Mozni By ID...!', data: updateMozniData });
        } catch (error) {
            next(error);
        }
    };

    public deleteMozni = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const mozniId = req.params.id;
            const deleteMozniData: mozni = await this.mozniService.deleteMozni(mozniId);

            res.status(200).json({ message: 'Deleted Mozni By ID...!', data: deleteMozniData });
        } catch (error) {
            next(error);
        }
    };

    public searchMozni = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const searchText = req.body.searchText;

            const searchMozniData: mozni[] = await this.mozniService.searchMozni(searchText);
            res.status(200).json({ message: 'Searched Mozni By NAME...!', data: searchMozniData });
        } catch (error) {
            next(error);
        }
    };
}

export default MozniController;
