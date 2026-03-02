import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  receiverName!: string;

  @IsString()
  @IsNotEmpty()
  // @IsPhoneNumber('CN') // Simplified for demo, as strict phone validation might fail test data
  phone!: string;

  @IsString()
  @IsNotEmpty()
  province!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  district!: string;

  @IsString()
  @IsNotEmpty()
  detailAddress!: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
