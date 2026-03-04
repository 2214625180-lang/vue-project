import { InjectQueue } from '@nestjs/bull';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { Queue } from 'bull';
import { PrismaService } from '../../prisma.service';
import { CartService } from '../cart/cart.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { GetMyOrdersDto } from './dto/get-my-orders.dto';
import { InventoryShortageException } from './exceptions/inventory-shortage.exception';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    @InjectQueue('order-timeout') private readonly orderQueue: Queue,
  ) {}

  async checkout(userId: string, createOrderDto: CreateOrderDto) {
    return this.createOrder(userId, createOrderDto);
  }

  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    const { addressId, skuIds } = createOrderDto;
    const orderNo = this.generateOrderNo();

    const address = await this.prisma.userAddress.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) {
      throw new BadRequestException('Address not found');
    }

    const cartItems = await this.cartService.getCart(userId);
    const selectedItems = cartItems.filter((item) => skuIds.includes(item.id));
    if (selectedItems.length === 0) {
      throw new BadRequestException('No valid cart items selected');
    }

    const quantityBySkuId = new Map(selectedItems.map((item) => [item.id, item.quantity]));
    const dbSkus = await this.prisma.productSku.findMany({
      where: { id: { in: skuIds } },
      include: { spu: { select: { name: true } } },
    });
    if (dbSkus.length !== selectedItems.length) {
      throw new BadRequestException('Some products are unavailable');
    }

    const totalAmount = dbSkus.reduce((sum, sku) => {
      const quantity = quantityBySkuId.get(sku.id) ?? 0;
      return sum + Number(sku.price) * quantity;
    }, 0);

    await this.prisma.$transaction(async (tx) => {
      for (const sku of dbSkus) {
        const quantity = quantityBySkuId.get(sku.id) ?? 0;
        const result = await tx.productSku.updateMany({
          where: {
            id: sku.id,
            stock: { gte: quantity },
          },
          data: {
            stock: { decrement: quantity },
          },
        });
        if (result.count === 0) {
          throw new InventoryShortageException(sku.id);
        }
      }

      const order = await tx.order.create({
        data: {
          orderNo,
          userId,
          totalAmount,
          status: OrderStatus.PENDING,
          addressSnapshot: {
            receiverName: address.receiverName,
            phone: address.phone,
            province: address.province,
            city: address.city,
            district: address.district,
            detailAddress: address.detailAddress,
          },
        },
      });

      await tx.orderItem.createMany({
        data: dbSkus.map((sku) => ({
          orderId: order.id,
          skuId: sku.id,
          spuName: sku.spu.name,
          skuSpecs: sku.specs,
          price: sku.price,
          quantity: quantityBySkuId.get(sku.id) ?? 0,
        })),
      });
    });

    await this.cartService.removeFromCart(userId, skuIds);
    await this.orderQueue.add(
      'check-timeout',
      { orderNo },
      {
        // 1 minute delay for testing
        delay: 60 * 1000,
      },
    );

    return { orderNo };
  }

  async getMyOrders(userId: string, dto: GetMyOrdersDto) {
    const { page = 1, limit = 10, status } = dto;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = { userId };
    if (status) {
      where.status = status;
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(userId: string, orderNo: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNo },
      include: { items: true },
    });
    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async confirmReceipt(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new BadRequestException('Unauthorized access to order');
    }

    if (order.status !== OrderStatus.SHIPPED) {
      throw new BadRequestException('Order status must be SHIPPED to confirm receipt');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.COMPLETED,
        // completedAt: new Date(), // If you add completedAt to schema later
      },
    });
  }

  private generateOrderNo() {
    return `${Date.now()}${Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0')}`;
  }
}
