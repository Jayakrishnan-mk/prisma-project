import { Router } from 'express';
import UsersController from '@controllers/users.controller';
import { CreateUserDto } from '@dtos/users.dto';
import { Routes } from '@interfaces/routes.interface';
import validationMiddleware from '@middlewares/validation.middleware';
import authMiddleware from '@/middlewares/auth.middleware';

class UsersRoute implements Routes {
  public path = '/users';
  public pathRazorPay = '/payment'
  public router = Router();
  public usersController = new UsersController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, validationMiddleware(CreateUserDto, 'body'), this.usersController.createUser);
    this.router.get(`${this.path}/:id`, this.usersController.getUserById);
    this.router.put(`${this.path}/:id`, this.usersController.updateUser);
    this.router.delete(`${this.path}/:id`, this.usersController.deleteUser);
    this.router.post(`${this.path}/login/google`, this.usersController.loginUserWithGoogle);
    this.router.post(`${this.path}/login`, this.usersController.loginUser);
    this.router.post(`${this.path}/adminLogin`, this.usersController.adminLogin);
    this.router.get(`${this.path}/verifyotpinlogin/:mobile/:otp`, this.usersController.verifyotpinlogin);
    this.router.get(`${this.path}`, this.usersController.getUsers);

    //razorPay
    this.router.post(`${this.pathRazorPay}/webhook`, this.usersController.webhook);
    this.router.post(`${this.pathRazorPay}/createOrder`, this.usersController.createOrder);
    this.router.post(`${this.pathRazorPay}/capturePaymentStatus`, this.usersController.capturePaymentStatus);
  }
}

export default UsersRoute;
