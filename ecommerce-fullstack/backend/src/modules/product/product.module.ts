import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController, AdminProductController } from './product.controller';
import { ShopProductController } from './shop-product.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [
    ProductController,
    AdminProductController,
    ShopProductController,
  ],
  providers: [ProductService, PrismaService],
  exports: [ProductService],
})
export class ProductModule {}
