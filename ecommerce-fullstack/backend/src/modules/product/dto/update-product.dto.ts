import { PartialType, OmitType } from '@nestjs/mapped-types'; // 如果你用了 Swagger，请从 @nestjs/swagger 导入
import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateProductDto, CreateProductSkuDto } from './create-product.dto';

// 1. 衍生出带 ID 的 Update SKU DTO
export class UpdateProductSkuDto extends PartialType(CreateProductSkuDto) {
  // 专门为编辑场景增加可选的 ID 字段
  @IsString()
  @IsOptional()
  id?: string; 
}

// 2. 衍生主 DTO
// 先排除掉原来严格的 skus，然后重新定义允许带 ID 的 skus
export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['skus'] as const)
) {
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateProductSkuDto) // 👈 关键点：这里替换为我们刚刚定义的 UpdateProductSkuDto
  skus?: UpdateProductSkuDto[];
}