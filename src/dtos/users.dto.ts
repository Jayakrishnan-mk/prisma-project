import { IsBoolean, IsEmail, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsOptional()
  @IsString()
  public userId: string;

  @IsOptional()
  @IsEmail()
  public emailId: string;

  @IsOptional()
  @IsString()
  public password: string;

  @IsInt()
  public mobile: number;

  @IsOptional()
  @IsBoolean()
  public isMobileVerified: boolean;
}