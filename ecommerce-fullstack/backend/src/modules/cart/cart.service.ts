import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { PrismaService } from '../../prisma.service'; // 请确保路径正确
import { ProductSku } from '@prisma/client';

// 扩展接口，加入 addedAt 方便内部排序
export interface CartItem extends ProductSku {
  quantity: number;
  spuName: string;
  spuId: string;
  addedAt?: number; 
}

@Injectable()
export class CartService {
  // 🚀 注入终极防并发杀器：Lua 脚本
  private static readonly ADD_TO_CART_SCRIPT = `
    local cart_key = KEYS[1]
    local sku_id = ARGV[1]
    local add_qty = tonumber(ARGV[2])
    local added_at = tonumber(ARGV[3])
    
    local existing_json = redis.call('HGET', cart_key, sku_id)
    local new_qty = add_qty
    
    if existing_json then
        local existing_data = cjson.decode(existing_json)
        if existing_data and existing_data["quantity"] then
             new_qty = existing_data["quantity"] + add_qty
        end
    end
    
    local new_data = {
        quantity = new_qty,
        addedAt = added_at
    }
    local new_json = cjson.encode(new_data)
    
    redis.call('HSET', cart_key, sku_id, new_json)
    return new_qty
  `;

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly prisma: PrismaService,
  ) {}

  private getCartKey(userId: string): string {
    return `cart:${userId}`;
  }

  // 🛡️ 改造1：使用 Lua 脚本保证加购的绝对原子性
  async addToCart(userId: string, skuId: string, quantity: number) {
    const key = this.getCartKey(userId);
    const addedAt = Date.now();

    const finalQuantity = await this.redis.eval(
      CartService.ADD_TO_CART_SCRIPT,
      1,
      key,
      skuId,
      quantity,
      addedAt
    );

    return { skuId, quantity: Number(finalQuantity) };
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

  // ⚡ 改造2：一次遍历完成缝合与排序准备
  async getCart(userId: string): Promise<CartItem[]> {
    const key = this.getCartKey(userId);
    const cartData = await this.redis.hgetall(key);
    
    if (!cartData || Object.keys(cartData).length === 0) {
      return [];
    }

    const skuIds = Object.keys(cartData);
    
    const skus = await this.prisma.productSku.findMany({
      where: { id: { in: skuIds } },
      include: {
        spu: { select: { name: true, id: true } }
      }
    });

    const items: CartItem[] = [];
    const skuMap = new Map(skus.map(s => [s.id, s]));

    for (const [skuId, jsonVal] of Object.entries(cartData)) {
      const sku = skuMap.get(skuId);
      if (sku) {
        // ✨ 亮点：在这里直接把 addedAt 解构出来，不再写第二次循环
        const { quantity, addedAt } = JSON.parse(jsonVal);
        const { spu, ...skuData } = sku;
        items.push({
          ...skuData,
          spuName: spu.name,
          spuId: spu.id,
          quantity,
          addedAt: addedAt || 0, // 赋兜底值防崩
        });
      } else {
        // 异步静默清理脏数据
        this.redis.hdel(key, skuId).catch(() => {});
      }
    }

    // 🚀 直接利用自身属性进行内存级排序 (时间戳倒序)
    items.sort((a, b) => b.addedAt! - a.addedAt!);

    return items;
  }
}