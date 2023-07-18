import { Router } from 'express';
import MembersController from '@controllers/members.controller';
import { Routes } from '@/interfaces/routes.interface';
import { CreateMemberDto } from '@/dtos/members.dto';
import validationMiddleware from '@/middlewares/validation.middleware';
import authMiddleware from '@/middlewares/auth.middleware';

class MembersRoute implements Routes {
    public path = '/member';
    public router = Router();
    public membersController = new MembersController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(`${this.path}`, authMiddleware, validationMiddleware(CreateMemberDto, 'body'), this.membersController.createMember);
        this.router.get(`${this.path}/:id`, this.membersController.getMemberById);
        this.router.put(`${this.path}/:id`, authMiddleware, this.membersController.updateMember);
        this.router.delete(`${this.path}/:id`, authMiddleware, this.membersController.deleteMember);
        this.router.get(`${this.path}`, this.membersController.getMembers);
    }
}

export default MembersRoute;
