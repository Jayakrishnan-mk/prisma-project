import { user_type } from '@prisma/client';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateFavouriteDto {
  @IsOptional()
  @IsString()
  public favouriteId: string;

  @IsArray()
  @IsOptional()
  public projectId: Array<string>;

  @IsOptional()
  @IsEnum(user_type)
  public userType: user_type;

  @IsString()
  public developerId: string;

}