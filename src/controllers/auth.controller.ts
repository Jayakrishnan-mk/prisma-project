import { NextFunction, Request, Response } from 'express';
import { user } from '@prisma/client';
import { CreateUserDto } from '@dtos/users.dto';
import { RequestWithUser } from '@interfaces/auth.interface';
import AuthService from '@services/auth.service';
// import VerifyService from '@services/verification.service';
class AuthController {
  public authService = new AuthService();
  // public signUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  //   const baseUrl= `${req.protocol}://${req.get('host')}`;
  //   // const verifyService = new VerifyService(baseUrl)
  //   try {
  //     const userData: CreateUserDto = req.body;
      // const signUpUserData: user = await this.authService.signup(userData);
      // const emailToken = await this.authService.createEmailVerificationTokens(signUpUserData);
      // const phoneToken = await this.authService.createPhoneVerificationTokens(signUpUserData);
      
  //     await verifyService.sendEmailToken(emailToken);
  //     await verifyService.sendPhoneToken(phoneToken);
  //     res.status(201).json({ data: signUpUserData, message: 'signup' });
  //   } catch (error) {
  //     next(error);
  //   }
  // };
  // public verifyPhone = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  //   const token=Number(req.params.token);
  //   try {
  //     await this.authService.verifyPhoneToken(token);
  //     res.sendStatus(200);
  //   } catch (error) {
  //    next(error); 
  //   }
  // }
  // public verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  //   const token=Number(req.params.token);
  //   try {
  //     await this.authService.verifyEmailToken(token);
  //     res.sendStatus(200);
  //   } catch (error) {
  //    next(error); 
  //   }
  // }

  // public logIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  //   try {
  //     const userData: CreateUserDto = req.body;
  //     const { cookie, findUser } = await this.authService.login(userData);

  //     res.setHeader('Set-Cookie', [cookie]);
  //     res.status(200).json({ data: findUser, message: 'login' });
  //   } catch (error) {
  //     next(error);
  //   }
  // };
  
  public logOut = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: user = req.user;
      const logOutUserData: user = await this.authService.logout(userData);

      res.setHeader('Set-Cookie', ['Authorization=; Max-age=0']);
      res.status(200).json({ data: logOutUserData, message: 'logout' });
    } catch (error) {
      next(error);
    }
  };
}

export default AuthController;
