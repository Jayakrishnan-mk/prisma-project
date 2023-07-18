import { IsInt, IsOptional, IsString, IsNotEmpty, IsEnum, IsArray, IsNumber, IsBoolean } from 'class-validator';
import { amount_type, category_type, payment_status, user_type } from '@prisma/client';

export class CreateTransactionDto {
  // @IsOptional()
  // @IsString()
  // public id: string;

  @IsOptional()
  @IsNumber()
  public amount: number;

  @IsEnum(amount_type)
  public amountType: amount_type;

  @IsString()
  public transactionNumber: string;

  @IsOptional()
  @IsString()
  public additionalInfo: string;

  @IsOptional()
  @IsString()
  public projectId: string;

  @IsEnum(user_type)
  public persona: user_type;

  @IsString()
  public personaId: string;

  @IsEnum(category_type)
  public category: category_type;

  @IsEnum(payment_status)
  public paymentStatus: payment_status;

  @IsOptional()
  @IsBoolean()
  public isPaymentOnline: boolean;

  @IsOptional()
  @IsString()
  public imageUrl: string;
}