import { IsArray, IsNotEmpty, IsString, ArrayMinSize } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  addressId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  skuIds!: string[];
}
