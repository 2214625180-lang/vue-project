import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { GetProductsDto } from './dto/get-products.dto';
import { ProductStatus, Prisma } from '@prisma/client';
import { UpdateProductDto } from './dto/update-product.dto';
import { NotFoundException } from '@nestjs/common';
@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}
  async createProduct(createProductDto: CreateProductDto) {
    const { skus, ...spuData } = createProductDto;
    let categoryId = spuData.categoryId;
    if (!categoryId) {
      // Find first available category or create a default one
      const defaultCategory = await this.prisma.category.findFirst();
      if (defaultCategory) {
        categoryId = defaultCategory.id;
      } else {
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

  async updateProduct(id: string, updateProductDto: UpdateProductDto) {
    const { skus, ...spuData } = updateProductDto;
    let categoryId = spuData.categoryId;
    let skusUpdateOperations = {};
    if (skus && skus.length > 0) {
      // 1. 带有 ID 的是旧规格，需要被更新
      const skusWithId = skus.filter((s) => s.id);
      // 2. 没有 ID 的是新加的规格，需要被创建
      const skusWithoutId = skus.filter((s) => !s.id);
      // 3. 提取出所有前端保留的有效旧 ID
      const incomingSkuIds = skusWithId.map((s) => s.id);

      skusUpdateOperations = {
        skus: {
          // 🔪 动作 A：清理被用户删掉的规格
          // 逻辑：把数据库里属于当前 SPU，但不在 incomingSkuIds 列表里的 SKU 删掉
          deleteMany: {
            id: {
              notIn: incomingSkuIds.length > 0 ? incomingSkuIds : [''], // 防空数组查全表
            },
          },

          // 🆕 动作 B：创建全新增加的规格
          create: skusWithoutId.map((sku) => ({
            ...sku,
            specs: sku.specs as any,
          })),

          // ♻️ 动作 C：精准更新保留下来的旧规格（只改价格、库存等，绝对不改 ID）
          update: skusWithId.map(({ id: skuId, ...skuData }) => ({
            where: { id: skuId },
            data: {
              ...skuData,
              specs: skuData.specs as any,
            },
          })),
        },
      };
    } else if (skus && skus.length === 0) {
      skusUpdateOperations = {
        skus: {
          deleteMany: {},
        },
      };
    }

    const productSpu = await this.prisma.productSpu.update({
      where: { id },
      data: {
        ...spuData,
        ...(categoryId && { categoryId }),
        ...skusUpdateOperations,
      },
      include: {
        skus: true,
      },
    });

    return productSpu;
  }

  async deleteProduct(id: string) {
    // 检查存在性
    const product = await this.prisma.productSpu.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return this.prisma.productSpu.update({
      where: { id },
      data: { status: ProductStatus.OFF_SHELF }, 
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

  async getProducts(params: GetProductsDto, isAdminContext = false) {
    const { page = 1, limit = 10, keyword, categoryId, status } = params; 
    const skip = (page - 1) * limit;

    const where: Prisma.ProductSpuWhereInput = {
      ...(categoryId && { categoryId }),
      ...(keyword && {
        OR: [
          { name: { contains: keyword, mode: 'insensitive' } },
          { spuNo: { contains: keyword, mode: 'insensitive' } },
        ],
      }),
    };

    // 🔒 核心业务防御逻辑
    if (isAdminContext) {
      // B端：如果后台传了 status 就按 status 查，没传就查全部（包括下架的）
      if (status) where.status = status; 
      where.status = ProductStatus.ON_SHELF;
    } else {
      where.status = ProductStatus.ON_SHELF;
    }
    const [total, items] = await this.prisma.$transaction([
      this.prisma.productSpu.count({ where }),
      this.prisma.productSpu.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { category: true, skus: true },
      }),
    ]);

    return { items, total, page, limit };
  }
  async getAllCategories() {
    return this.prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
