import { NextFunction, Request, Response } from 'express';
import { user, otp } from '@prisma/client';
import { CreateUserDto } from '@dtos/users.dto';
import userService from '@services/users.service';
import { HttpException } from '@/exceptions/HttpException';

class UsersController {
  public userService = new userService();

  public createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {

      const userData: CreateUserDto = req.body;
      const createUserData: user = await this.userService.createUser(userData);

      res.status(201).json({ message: 'User Created Successfully...!', data: createUserData });
    } catch (error) {
      next(error);
    }
  };

  public getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const findAllUsersData: user[] = await this.userService.findAllUser(req);

      res.status(200).json({ message: 'List of Users...!', data: findAllUsersData, });
    } catch (error) {
      next(error);
    }
  };

  public getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const Userid = req.params.id;
      const findOneUserData: user = await this.userService.findUserById(Userid);

      res.status(200).json({ message: 'Specific User By ID...!', data: findOneUserData });
    } catch (error) {
      next(error);
    }
  };

  public updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const Userid = req.params.id;
      const userData: CreateUserDto = req.body;
      const updateUserData: user = await this.userService.updateUser(Userid, userData);

      res.status(200).json({ message: 'Updated User By ID...!', data: updateUserData, });
    } catch (error) {
      next(error);
    }
  };

  public deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const Userid = req.params.id;
      const deleteUserData: user = await this.userService.deleteUser(Userid);

      res.status(200).json({ message: 'Deleted User By ID...!', data: deleteUserData });
    } catch (error) {
      next(error);
    }
  };

  public adminLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const emailId = req.body.emailId;
      const password = req.body.password;
      const loginUserData: user = await this.userService.adminLogin(emailId, password);

      res.status(200).json({ message: 'ADMIN logged in successfully...!', data: loginUserData });
    } catch (error) {
      next(error);
    }
  };

  public loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let loginUserData;

      if (req.body.mobile) {
        loginUserData = await this.userService.loginUser(req.body);
      }
      else if (req.body.email) {
        loginUserData = await this.userService.loginUser(req.body);
      }
      else {
        throw new HttpException(400, 'Invalid Credentials...!')
      }

      // res.status(200).json({ message: 'User Loggedin Successfully.', data: loginUserData });
      res.status(200).json({ data: loginUserData });

    } catch (error) {
      next(error);
    }
  };

  public verifyotpinlogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const mobile = Number(req.params.mobile);
      const receivedotp = req.params.otp;
      const verifyotpinloginData: otp = await this.userService.verifyotpinloginData(mobile, receivedotp);

      res.status(200).json({ message: 'User Verified...!', data: verifyotpinloginData });
    } catch (error) {
      next(error);
    }
  };

  public loginUserWithGoogle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const mobile = req.body.mobile;
      // const loginUserData: user = await this.userService.loginUser(mobile);

      // res.status(200).json({ message: 'User Loggedin', data: loginUserData });
    } catch (error) {
      next(error);
    }
  };

  public webhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const webhook: any = await this.userService.webhook(req); //goes to controller logic
      res.status(200).json({ data: webhook, message: 'created 😁' });
    } catch (error) {
      next(error);
    }
  };

  public createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const createOrder = await this.userService.createOrder(req); //goes to controller logic
      res.status(200).json({ data: createOrder, message: 'created 😁' });
    } catch (error) {
      next(error);
    }
  };

  public capturePaymentStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const capturePaymentStatus = await this.userService.capturePaymentStatus(req); //goes to controller logic
      res.status(200).json({ data: capturePaymentStatus, message: 'created 😁' });
    } catch (error) {
      next(error);
    }
  };

}

export default UsersController;
