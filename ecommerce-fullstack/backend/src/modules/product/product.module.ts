import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController, AdminProductController } from './product.controller';
import { PrismaService } from '../../../prisma.service';

@Module({
  controllers: [ProductController, AdminProductController],
  providers: [ProductService, PrismaService],
  exports: [ProductService],
})
export class ProductModule {}
