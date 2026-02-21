import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ConditionType, RewardType, PromoStatus } from '@prisma/client';

export class CreateConditionDto {
  @IsEnum(ConditionType)
  type: ConditionType;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;
}

export class CreateRewardDto {
  @IsEnum(RewardType)
  type: RewardType;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsNumber()
  @Min(0)
  value: number;
}

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  status?: PromoStatus;

  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateConditionDto)
  conditions: CreateConditionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRewardDto)
  rewards: CreateRewardDto[];
}
