import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('admin/products') // Assuming admin routes for creation
export class AdminProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(JwtAuthGuard) // Protect admin route
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.createProduct(createProductDto);
  }
}

@Controller('products') // Public routes for fetching
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get(':spuId')
  findOne(@Param('spuId') spuId: string) {
    return this.productService.findOne(spuId);
  }
}
