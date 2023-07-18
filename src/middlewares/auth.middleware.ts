import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, RequestWithUser } from '@interfaces/auth.interface';

const user = new PrismaClient().user;

const authMiddleware = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const Authorization = req.cookies['Authorization'] || (req.header('Authorization') ? req.header('Authorization').split('Bearer ')[1] : null);
    if (Authorization) {
      const secretKey: string = process.env.JWT_PWD;
      const verificationResponse: any = (await verify(Authorization, secretKey)) as DataStoredInToken;
      const mobile = verificationResponse.mobile;
      const emailId = verificationResponse.emailId;

      let findUser;

      if (emailId) {
        findUser = await user.findFirst({ where: { emailId } });
      }
      else {
        findUser = await user.findUnique({ where: { mobile } });
      }

      if (findUser) {
        req.user = findUser;
        next();
      } else {
        next(new HttpException(401, 'Wrong authentication token!'));
      }
    } else {
      next(new HttpException(404, 'Authentication token missing!'));
    }
  } catch (error) {
    next(new HttpException(401, 'Wrong authentication token'));
  }
};

export default authMiddleware;
