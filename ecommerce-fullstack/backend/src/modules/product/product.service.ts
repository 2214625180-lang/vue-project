import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { GetProductsDto } from './dto/get-products.dto';
import { ProductStatus, Prisma } from '@prisma/client';

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

  async getProducts(params: GetProductsDto) {
    const { page = 1, limit = 10, keyword, categoryId, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductSpuWhereInput = {
      ...(status && { status }),
      ...(categoryId && { categoryId }),
      ...(keyword && {
        OR: [
          { name: { contains: keyword, mode: 'insensitive' } },
          { spuNo: { contains: keyword, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, items] = await Promise.all([
      this.prisma.productSpu.count({ where }),
      this.prisma.productSpu.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
    };
  }
}
