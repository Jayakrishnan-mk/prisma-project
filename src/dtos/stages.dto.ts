import { project_stages } from '@prisma/client';
import { Json } from 'aws-sdk/clients/robomaker';
import { IsInt, IsOptional, IsString, IsNotEmpty, IsEnum, IsArray, IsNumber, IsJSON, isJSON } from 'class-validator';

export class CreateStageDto {
  @IsOptional()
  @IsString()
  public stageId: string;

  @IsString()
  public projectId: string;

  @IsEnum(project_stages)
  public projectStages: project_stages;

  @IsArray()
  @IsOptional()
  public document: Array<Json>;

}