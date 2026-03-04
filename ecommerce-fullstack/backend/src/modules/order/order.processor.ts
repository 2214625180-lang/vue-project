import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma.service';

interface CheckTimeoutJobData {
  orderNo: string;
}

@Injectable()
@Processor('order-timeout')
export class OrderProcessor {
  private readonly logger = new Logger(OrderProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  @Process('check-timeout')
  async handleOrderTimeout(job: Job<CheckTimeoutJobData>) {
    const { orderNo } = job.data;

    const order = await this.prisma.order.findUnique({
      where: { orderNo },
      include: { items: true },
    });
    if (!order) {
      return;
    }
    if (order.status !== OrderStatus.PENDING) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: {
          id: order.id,
          status: OrderStatus.PENDING,
        },
        data: {
          status: OrderStatus.CANCELLED,
        },
      });
      if (updated.count === 0) {
        return;
      }

      for (const item of order.items) {
        await tx.productSku.update({
          where: { id: item.skuId },
          data: {
            stock: { increment: item.quantity },
          },
        });
      }
    });

    this.logger.log(`Order ${orderNo} cancelled by timeout`);
  }
}
