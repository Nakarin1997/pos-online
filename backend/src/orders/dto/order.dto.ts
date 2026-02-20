import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsString()
  productId!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @IsEnum(['CASH', 'CREDIT_CARD', 'TRANSFER', 'PROMPTPAY'])
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  userId!: string;
}
