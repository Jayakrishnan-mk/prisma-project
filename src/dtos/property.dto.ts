import { IsInt, IsOptional, IsString, IsNotEmpty, IsEnum, IsArray, IsNumber} from 'class-validator';
import { property_type } from '@prisma/client';
import { Json } from 'aws-sdk/clients/robomaker';

export class CreatePropertyDto {
  @IsOptional()
  @IsString()
  public propertyId: string;

  @IsString()
  @IsOptional()
  public nameOfWing: string;

  @IsEnum(property_type)
  public propertyType: property_type;

  @IsInt()
  @IsOptional()
  public floorNumber: any;

  @IsString()
  @IsOptional()
  public unitName: string;

  @IsInt()
  public bhk: number;

  @IsNumber()
  @IsOptional()
  public size: number;

  @IsNumber()
  public terrace: number;

  @IsNumber()
  public mezannineFloor: number;

  @IsOptional()
  @IsNumber()
  public flatArea: number;

  @IsOptional()
  @IsNumber()
  public gardenArea: number;

  @IsArray()
  @IsOptional()
  public document: Array<Json>;

  @IsOptional()
  @IsString()
  public projectId: string;
  
  @IsArray()
  @IsOptional()
  public ownerId: Array<string>;
}