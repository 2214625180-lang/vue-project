import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { CartService } from '../../cart/cart.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { InventoryShortageException } from './exceptions/inventory-shortage.exception';
import { OrderStatus, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private cartService: CartService,
  ) {}

  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    const { addressId, skuIds } = createOrderDto;

    // 1. Fetch User Address
    const address = await this.prisma.userAddress.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) {
      throw new NotFoundException('Shipping address not found');
    }

    // 2. Fetch Cart Items from Redis
    // We get ALL cart items first, then filter by selected skuIds
    // Optimization: CartService.getCart is heavy, in production consider getting specific items
    // But since Redis HGETALL is fast and cart is small, filtering in memory is fine.
    const cartItems = await this.cartService.getCart(userId);
    const selectedItems = cartItems.filter((item) => skuIds.includes(item.id));

    if (selectedItems.length === 0) {
      throw new BadRequestException('No items selected for checkout');
    }

    // 3. Re-verify Price and Stock from DB (Source of Truth)
    // Cart items already have some data from DB, but we should fetch fresh data to be safe
    // Or we trust getCart's recent fetch. Let's trust getCart for basic info but use DB for price/stock critical path.
    // Actually, to prevent race conditions, we rely on the atomic update for stock.
    // Price must be current.
    
    // Let's fetch the SKUs again to get current price and ensure existence
    const dbSkus = await this.prisma.productSku.findMany({
      where: { id: { in: skuIds } },
      include: { spu: { select: { name: true } } },
    });

    if (dbSkus.length !== skuIds.length) {
      throw new BadRequestException('Some items are no longer available');
    }

    // Map for easy access
    const skuMap = new Map(dbSkus.map(s => [s.id, s]));
    
    // Calculate Total Amount
    let totalAmount = new Prisma.Decimal(0);
    const orderItemsData: any[] = [];

    for (const item of selectedItems) {
      const dbSku = skuMap.get(item.id);
      if (!dbSku) continue; // Should not happen

      // Use DB price
      const lineTotal = dbSku.price.mul(item.quantity);
      totalAmount = totalAmount.add(lineTotal);

      orderItemsData.push({
        skuId: item.id,
        spuName: dbSku.spu.name,
        skuSpecs: item.specs,
        price: dbSku.price,
        quantity: item.quantity,
      });
    }

    // 4. Transaction: Inventory Deduction & Order Creation
    return this.prisma.$transaction(async (prisma) => {
      // a. Atomic Inventory Deduction
      for (const item of selectedItems) {
        const result = await prisma.productSku.updateMany({
          where: {
            id: item.id,
            stock: { gte: item.quantity }, // Optimistic Lock: Stock must be sufficient
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        if (result.count === 0) {
          throw new InventoryShortageException(item.id);
        }
      }

      // b. Create Order
      const orderNo = this.generateOrderNo();
      const order = await prisma.order.create({
        data: {
          orderNo,
          userId,
          totalAmount,
          status: OrderStatus.PENDING,
          addressSnapshot: address as any, // Snapshot the full address object
          items: {
            create: orderItemsData,
          },
        },
      });

      return order;
    });

    // 5. Post-Transaction: Clear Cart (Non-blocking or awaited)
    // Only remove purchased items
    // This runs only if transaction succeeds (no exception thrown)
    // Note: We are returning inside the transaction block, so we need to refactor slightly 
    // or run this after the transaction call resolves.
  }
  
  // Wrapper to handle cart clearing after transaction
  async checkout(userId: string, createOrderDto: CreateOrderDto) {
    const order = await this.createOrder(userId, createOrderDto);
    
    // 5. Clear Cart
    try {
      await this.cartService.removeFromCart(userId, createOrderDto.skuIds);
    } catch (e) {
      // Log error but don't fail the request, order is already created
      console.error('Failed to clear cart after order', e);
    }

    return { orderNo: order.orderNo };
  }

  private generateOrderNo(): string {
    // Simple order no generation: Timestamp + Random
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${timestamp}${random}`;
  }
}
