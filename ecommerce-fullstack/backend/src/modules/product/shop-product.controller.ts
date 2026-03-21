import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { PrismaService } from '../../prisma.service';
import { ProductStatus } from '@prisma/client';

@Controller('shop/products')
export class ShopProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async getShopProducts(
    @Query('page') page = '1',
    @Query('limit') limit = '12',
    @Query('categoryId') categoryId?: string,
  ) {
    try {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 12);
      const skip = (pageNum - 1) * limitNum;
      const where = {
        status: ProductStatus.ON_SHELF,
        skus: {
          some: {},
        },
        ...(categoryId ? { categoryId } : {}),
      };

      // Optimized Payload: Select only necessary fields
      const products = await this.prisma.productSpu.findMany({
        where,
        select: {
          id: true,
          spuNo: true,
          name: true,
          categoryId: true,
          category: {
            select: {
              name: true,
            },
          },
          // We'll calculate min price from skus, but only selecting price field
          skus: {
            select: {
              id: true, // Need ID for add to cart
              price: true,
              coverImage: true, // Use SKU cover image if SPU doesn't have one, or logic
            },
            take: 1, // Optimization: Just grab one for image if needed, or all for price calc
            orderBy: {
              price: 'asc',
            },
          },
        },
        skip,
        take: limitNum,
        orderBy: {
          createdAt: 'desc',
        },
      });

      const total = await this.prisma.productSpu.count({
        where,
      });

      // Transform for frontend
      const items = products.map((p) => {
        const minPrice = p.skus.length > 0 ? Number(p.skus[0].price) : 0;
        const coverImage = p.skus.length > 0 ? p.skus[0].coverImage : ''; // Fallback logic
        const defaultSkuId = p.skus.length > 0 ? p.skus[0].id : null;
        return {
          id: p.id,
          spuNo: p.spuNo,
          name: p.name,
          price: minPrice,
          coverImage,
          categoryId: p.categoryId,
          category: p.category,
          defaultSkuId, // Pass this to frontend
        };
      });

      return {
        items,
        total,
        page: pageNum,
        limit: limitNum,
      };
    } catch (error) {
      console.error('Failed to get shop products:', error);
      throw error;
    }
  }

  @Get('categories')
  async getShopCategories() {
    const categories = await this.prisma.category.findMany({
      where: {
        products: {
          some: {
            status: ProductStatus.ON_SHELF,
            skus: {
              some: {},
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return categories;
  }

  @Get(':spuId')
  async getShopProductDetail(@Param('spuId') spuId: string) {
    // Rich Detail: Include everything needed for the product page
    return this.prisma.productSpu.findUnique({
      where: { id: spuId },
      include: {
        category: {
          select: { name: true },
        },
        skus: true, // Return all SKUs for client-side selection logic
      },
    });
  }
}
