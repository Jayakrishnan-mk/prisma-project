import { compare, hash } from 'bcrypt';
import config from 'config';
import { sign } from 'jsonwebtoken';
import { PrismaClient, user } from '@prisma/client';
import { CreateUserDto } from '@dtos/users.dto';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, TokenData } from '@interfaces/auth.interface';
import { isEmpty } from '@utils/util';

class AuthService {
  public users = new PrismaClient().user;
  //public tokens = new PrismaClient().verificationTokens;
  // public async signup(userData: CreateUserDto): Promise<user> {
  //   if (isEmpty(userData)) throw new HttpException(400, "You're not userData");

  //   const findUser: user = await this.users.findUnique({ where: { emailId: userData.emailId } });
  //   if (findUser) throw new HttpException(400, `You're email ${userData.emailId} already exists`);

  //   const hashedPassword = await hash(userData.password, 10);
  //   const createUserData= await this.users.create({ data: { ...userData, password: hashedPassword } });

  //   return createUserData;
  // }
  // public async createEmailVerificationTokens(user:user){
  //   if(isEmpty(user)) throw new HttpException(500,"Invalid user data");
  //   const emailToken = this.tokens.create({data:{
  //     type:TokenType.EMAIL,
  //     userId:user.Userid
  //   }});
  //   return emailToken;
  // }
  // public async createPhoneVerificationTokens(user:user){
  //   if(isEmpty(user)) throw new HttpException(500,"Invalid user data");
  //   const phoneToken = this.tokens.create({data:{
  //     type:TokenType.PHONE,
  //     userId:user.Userid
  //   }});
  //   return phoneToken;
  // }
  // public async verifyPhoneToken(token:number){
  //   const verificationToken = await this.tokens.findUnique({
  //     where:{
  //       id:token,
  //     }
  //   });
  //   if(!verificationToken) throw new HttpException(424,"Invalid Token for phone");
  //   if(verificationToken.type!=TokenType.PHONE) throw new HttpException(424,"Invalid Token for phone");

  //   const user = await this.users.findUnique({where:{id:verificationToken.userId}});
  //   if(!user) throw new HttpException(500,"Some thing went wrong!");
    
  //   await this.users.update({where:{
  //     Userid:user.Userid
  //   },data:{
  //     phoneVerified:true
  //   }
    
  //   });

  // }
  // public async verifyEmailToken(token:number){
  //   const verificationToken = await this.tokens.findUnique({
  //     where:{
  //       id:token,
  //     }
  //   });
  //   if(!verificationToken) throw new HttpException(424,"Invalid Token for email");
  //   if(verificationToken.type!=TokenType.EMAIL) throw new HttpException(424,"Invalid Token for email");

  //   const user = await this.users.findUnique({where:{id:verificationToken.userId}});
  //   if(!user) throw new HttpException(500,"Some thing went wrong!");

  //   await this.users.update({where:{
  //     Userid:user.Userid
  //   },data:{
  //     emailVerified:true
  //   }
    
  //   });

  // }
  // public async login(userData: CreateUserDto): Promise<{ cookie: string; findUser: user }> {
  //   if (isEmpty(userData)) throw new HttpException(400, "You're not userData");

  //   const findUser: user = await this.users.findUnique({ where: { emailId: userData.emailId } });
  //   if (!findUser) throw new HttpException(400, `You're email ${userData.emailId} not found`);

  //   const isPasswordMatching: boolean = await compare(userData.password, findUser.password);
  //   if (!isPasswordMatching) throw new HttpException(400, "You're password not matching");

  //   // if(!findUser.emailVerified || !findUser.phoneVerified) throw new HttpException(410,`Email/Phone not verified!`)
    
  
    
  //   const tokenData = this.createToken(findUser);
  //   const cookie = this.createCookie(tokenData);

  //   return { cookie, findUser };
  // }

  public async logout(userData: user): Promise<user> {
    if (isEmpty(userData)) throw new HttpException(400, "You're not userData");

    const findUser: user = await this.users.findFirst({ where: { emailId: userData.emailId, password: userData.password } });
    if (!findUser) throw new HttpException(400, "You're not user");

    return findUser;
  }

  // public createToken(user: user): TokenData {
  //   const dataStoredInToken: DataStoredInToken = { id: user.Userid };
  //   const secretKey: string = config.get('secretKey');
  //   const expiresIn: number = 60 * 60;

  //   return { expiresIn, token: sign(dataStoredInToken, secretKey, { expiresIn }) };
  // }

  public createCookie(tokenData: TokenData): string {
    return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn};`;
  }
}

export default AuthService;
