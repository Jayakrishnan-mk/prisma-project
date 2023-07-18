import { IsEmail,  IsInt, IsOptional, IsString, IsNotEmpty, IsEnum, IsArray, IsBoolean } from 'class-validator';
import { owner_gender } from '@prisma/client';

export class CreateOwnerDto {
  @IsOptional()
  @IsString()
  public ownerId: string;

  @IsOptional()
  @IsString()
  public firstName: string;

  @IsString()
  @IsOptional()
  public middleName: string;

  @IsString()
  @IsOptional()
  public lastName: string;

  @IsInt()
  @IsNotEmpty()
  public mobile: number;

  @IsString()
  @IsOptional()
  public image: string;

  @IsOptional()
  @IsEnum(owner_gender)
  public gender: owner_gender;

  @IsOptional()
  public dateOfBirth: any;

  @IsOptional()
  @IsEmail()
  public emailId: string;

  @IsOptional()
  @IsBoolean()
  public verified: boolean;
  
  @IsArray()
  @IsOptional()
  public projectId: Array<string>;

  @IsArray()
  @IsOptional()
  public propertyId: Array<string>;

  @IsString()
  @IsOptional()
  public userId: string;
}