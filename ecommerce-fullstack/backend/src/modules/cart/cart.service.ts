import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { PrismaService } from '../../../prisma.service';
import { ProductSku } from '@prisma/client';

export interface CartItem extends ProductSku {
  quantity: number;
  spuName: string;
  spuId: string;
}

@Injectable()
export class CartService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly prisma: PrismaService,
  ) {}

  private getCartKey(userId: string): string {
    return `cart:${userId}`;
  }

  async addToCart(userId: string, skuId: string, quantity: number) {
    const key = this.getCartKey(userId);
    // Check if item exists to increment
    const existing = await this.redis.hget(key, skuId);
    let newQuantity = quantity;
    
    if (existing) {
      const data = JSON.parse(existing);
      newQuantity += data.quantity;
    }

    const value = JSON.stringify({
      quantity: newQuantity,
      addedAt: Date.now(),
    });

    await this.redis.hset(key, skuId, value);
    return { skuId, quantity: newQuantity };
  }

  async updateQuantity(userId: string, skuId: string, quantity: number) {
    const key = this.getCartKey(userId);
    if (quantity <= 0) {
      return this.removeFromCart(userId, [skuId]);
    }

    const value = JSON.stringify({
      quantity,
      addedAt: Date.now(),
    });

    await this.redis.hset(key, skuId, value);
    return { skuId, quantity };
  }

  async removeFromCart(userId: string, skuIds: string[]) {
    const key = this.getCartKey(userId);
    if (skuIds.length > 0) {
      await this.redis.hdel(key, ...skuIds);
    }
    return { success: true };
  }

  async getCart(userId: string): Promise<CartItem[]> {
    const key = this.getCartKey(userId);
    const cartData = await this.redis.hgetall(key);
    
    if (!cartData || Object.keys(cartData).length === 0) {
      return [];
    }

    const skuIds = Object.keys(cartData);
    
    // Fetch real-time product data
    const skus = await this.prisma.productSku.findMany({
      where: {
        id: { in: skuIds },
      },
      include: {
        spu: {
          select: {
            name: true,
            id: true,
          }
        }
      }
    });

    // Map and filter
    const items: CartItem[] = [];
    
    // Use a map for O(1) lookup of sku data
    const skuMap = new Map(skus.map(s => [s.id, s]));

    for (const [skuId, jsonVal] of Object.entries(cartData)) {
      const sku = skuMap.get(skuId);
      if (sku) {
        const { quantity } = JSON.parse(jsonVal);
        items.push({
          ...sku,
          spuName: sku.spu.name,
          spuId: sku.spu.id,
          quantity,
        });
      } else {
        // SKU no longer exists in DB, clean up Redis asynchronously
        this.redis.hdel(key, skuId);
      }
    }

    return items;
  }
}
