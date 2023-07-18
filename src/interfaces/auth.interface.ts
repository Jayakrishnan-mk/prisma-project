import { Request } from 'express';
import { user } from '@prisma/client';

export interface DataStoredInToken {
  id: String;
}

export interface TokenData {
  token: string;
  expiresIn: number;
}

export interface RequestWithUser extends Request {
  user: user;
}
