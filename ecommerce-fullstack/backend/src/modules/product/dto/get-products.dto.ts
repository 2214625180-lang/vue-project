import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus } from '@prisma/client';

export class GetProductsDto {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page: number = 1;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit: number = 10;

  @IsString()
  @IsOptional()
  keyword?: string;

  @IsString()
  @IsOptional()
  categoryId?: string; // Prisma uses UUID strings for IDs

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;
}
