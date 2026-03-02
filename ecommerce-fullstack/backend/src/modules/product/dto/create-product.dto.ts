import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum ProductStatus {
  ON_SHELF = 'ON_SHELF',
  OFF_SHELF = 'OFF_SHELF',
}

export class CreateProductSkuDto {
  @IsString()
  @IsNotEmpty()
  skuNo!: string;

  @IsNumber()
  @IsNotEmpty()
  price!: number;

  @IsNumber()
  @IsNotEmpty()
  stock!: number;

  @IsObject()
  @IsNotEmpty()
  specs!: Record<string, any>;

  @IsString()
  @IsOptional()
  coverImage?: string;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  spuNo!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductSkuDto)
  skus!: CreateProductSkuDto[];
}
