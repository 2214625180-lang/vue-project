import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductStatus } from '@prisma/client';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async createProduct(createProductDto: CreateProductDto) {
    const { skus, ...spuData } = createProductDto;

    return this.prisma.$transaction(async (prisma) => {
      const productSpu = await prisma.productSpu.create({
        data: {
          ...spuData,
          status: spuData.status || ProductStatus.OFF_SHELF,
          skus: {
            create: skus.map((sku) => ({
              ...sku,
              specs: sku.specs as any, // Cast JSON object for Prisma
            })),
          },
        },
        include: {
          skus: true,
        },
      });

      return productSpu;
    });
  }

  async findOne(spuId: string) {
    return this.prisma.productSpu.findUnique({
      where: { id: spuId },
      include: {
        skus: true,
        category: true,
      },
    });
  }
}
