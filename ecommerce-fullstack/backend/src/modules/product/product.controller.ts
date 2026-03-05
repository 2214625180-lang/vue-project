import { Controller, Post, Body, Get, Param, UseGuards, Query, Patch, Delete } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { GetProductsDto } from './dto/get-products.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('admin/products')
export class AdminProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.createProduct(createProductDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateProductDto: Partial<CreateProductDto>) {
    return this.productService.updateProduct(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.productService.deleteProduct(id);
  }

  @Get('categories')
  @UseGuards(JwtAuthGuard)
  getAllCategories() {
    return this.productService.getAllCategories();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() query: GetProductsDto) {
    return this.productService.getProducts(query);
  }
}

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get(':spuId')
  findOne(@Param('spuId') spuId: string) {
    return this.productService.findOne(spuId);
  }
}
