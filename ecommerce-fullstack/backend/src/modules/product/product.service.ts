import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { GetProductsDto } from './dto/get-products.dto';
import { ProductStatus, Prisma } from '@prisma/client';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async createProduct(createProductDto: CreateProductDto) {
    const { skus, ...spuData } = createProductDto;

    // Handle optional categoryId
    let categoryId = spuData.categoryId;
    if (!categoryId) {
      // Find first available category or create a default one
      const defaultCategory = await this.prisma.category.findFirst();
      if (defaultCategory) {
        categoryId = defaultCategory.id;
      } else {
        // Create a default category if none exists
        const newCategory = await this.prisma.category.create({
          data: {
            name: '默认分类',
          },
        });
        categoryId = newCategory.id;
      }
    }

    return this.prisma.$transaction(async (prisma) => {
      const productSpu = await prisma.productSpu.create({
        data: {
          ...spuData,
          categoryId, // Use the resolved categoryId
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

  async updateProduct(id: string, updateProductDto: Partial<CreateProductDto>) {
    const { skus, ...spuData } = updateProductDto;

    // Handle optional categoryId
    let categoryId = spuData.categoryId;
    if (categoryId) {
       // Optional: validate category exists
    }

    return this.prisma.$transaction(async (prisma) => {
      const productSpu = await prisma.productSpu.update({
        where: { id },
        data: {
          ...spuData,
          // Only update categoryId if provided
          ...(categoryId && { categoryId }),
          // If skus are provided, we might need a strategy (replace all, update existing, etc.)
          // For simplicity here, if skus are provided, we delete old ones and create new ones (Full Replace Strategy)
          // OR we can just ignore SKU updates here for now if the frontend doesn't support complex SKU editing yet.
          // Let's implement full replace for SKUs if provided to keep it consistent with create.
          ...(skus && {
            skus: {
              deleteMany: {},
              create: skus.map((sku) => ({
                ...sku,
                specs: sku.specs as any,
              })),
            },
          }),
        },
        include: {
          skus: true,
        },
      });
      return productSpu;
    });
  }

  async deleteProduct(id: string) {
    // First check if product exists
    const product = await this.prisma.productSpu.findUnique({ where: { id } });
    if (!product) {
      throw new Error('Product not found');
    }

    // Try to delete SKUs first
    await this.prisma.productSku.deleteMany({ where: { spuId: id } });
    
    return this.prisma.productSpu.delete({
      where: { id },
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

  async getAllCategories() {
    return this.prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
