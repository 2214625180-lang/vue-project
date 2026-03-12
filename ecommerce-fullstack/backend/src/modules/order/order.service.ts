import { InjectQueue } from '@nestjs/bull';
import { 
  BadRequestException, 
  Injectable, 
  NotFoundException, 
  InternalServerErrorException,
  Logger // 👈 新增：用于打印定时任务日志
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { Queue } from 'bull';
import { Cron, CronExpression } from '@nestjs/schedule'; // 👈 新增：定时任务装饰器
import { PrismaService } from '../../prisma.service';
import { CartService } from '../cart/cart.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { InventoryShortageException } from './exceptions/inventory-shortage.exception';

@Injectable()
export class OrderService {
  // 👈 新增：初始化日志记录器
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    @InjectQueue('order-timeout') private readonly orderQueue: Queue,
  ) {}

  async checkout(userId: string, createOrderDto: CreateOrderDto) {
    return this.createOrder(userId, createOrderDto);
  }

  async createOrderFromCart(userId: string, skuIds: string[]) {
    if (!skuIds || skuIds.length === 0) {
      throw new BadRequestException('No cart items selected');
    }
    
    // For this simplified flow, we'll try to find any existing address for the user
    const address = await this.prisma.userAddress.findFirst({
      where: { userId },
      orderBy: { isDefault: 'desc' }, // Prefer default address
    });

    if (!address) {
       return this.createOrder(userId, {
         addressId: 'mock-address-id', 
         skuIds
       }, true); // Pass a flag to indicate mock address usage
    }

    return this.createOrder(userId, {
      addressId: address.id,
      skuIds
    });
  }

  async createOrder(userId: string, createOrderDto: CreateOrderDto, useMockAddress = false) {
    const { addressId, skuIds } = createOrderDto;
    const orderNo = this.generateOrderNo();

    let address;
    if (useMockAddress) {
      address = {
        receiverName: 'Demo User',
        phone: '13800138000',
        province: 'Beijing',
        city: 'Beijing',
        district: 'Chaoyang',
        detailAddress: 'Sanlitun SOHO',
      };
    } else {
      address = await this.prisma.userAddress.findFirst({
        where: { id: addressId, userId },
      });
      if (!address) {
        throw new BadRequestException('Address not found');
      }
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

    const createdOrder = await this.prisma.$transaction(async (tx) => {
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
          skuSpecs: sku.specs ?? {},
          price: sku.price,
          quantity: quantityBySkuId.get(sku.id) ?? 0,
        })),
      });

      return order; 
    });

    await this.cartService.removeFromCart(userId, skuIds);
    await this.orderQueue.add(
      'check-timeout',
      { orderNo },
      {
        delay: 60 * 1000,
      },
    );

    return { orderNo, orderId: createdOrder.id };
  }
  
  async getMyOrders(userId: string, dto: any) {
    try {
      const page = Number(dto.page) || 1;
      const limit = Number(dto.limit) || 10;
      const skip = (page - 1) * limit;

      const where: any = { userId };
      
      if (dto.status && String(dto.status).toUpperCase() !== 'ALL') {
        where.status = String(dto.status).toUpperCase();
      }

      const [total, items] = await this.prisma.$transaction([
        this.prisma.order.count({ where }),
        this.prisma.order.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { 
            items: { 
              include: {
                sku: { include: { spu: true } }
              }
            }
          },
        }),
      ]);

      const mappedItems = items.map((order: any) => {
        const { items: rawItems, ...rest } = order;
        return {
          ...rest,
          items: (rawItems || []).map((item: any) => ({
            ...item,
            image: item.sku?.coverImage || item.sku?.spu?.mainImage || null,
            product: item.sku?.spu || null
          }))
        };
      });

      return { items: mappedItems, total, page, limit };
      
    } catch (error) {
      console.error('❌ [获取订单彻底崩溃] 请看这里抓真凶:', error);
      throw new InternalServerErrorException('获取订单失败');
    }
  }

  async findOne(userId: string, orderNo: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNo },
      include: { 
        items: {
          include: {
            sku: {
              include: {
                spu: true
              }
            }
          }
        }
      },
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
      },
    });
  }

  private generateOrderNo() {
    return `${Date.now()}${Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0')}`;
  }
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async autoConfirmReceipt() {
    this.logger.log('🚀 [系统任务] 开始执行自动确认收货...');

    // 计算时间基准线（15天前）
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - 15);

    try {
      const result = await this.prisma.order.updateMany({
        where: {
          status: OrderStatus.SHIPPED,
          updatedAt: {
            lte: targetDate, 
          },
        },
        data: {
          status: OrderStatus.COMPLETED,
        },
      });

      this.logger.log(`✅ [系统任务] 自动确认收货完成，本次共处理 ${result.count} 个长尾订单。`);
    } catch (error) {
      this.logger.error('❌ [系统任务] 自动确认收货执行失败:', error);
    }
  }
}