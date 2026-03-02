import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { HttpService } from '@nestjs/axios';
import { OrderStatus } from '@prisma/client';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  // In a real app, this should be an env var or config
  private readonly MOCK_WEBHOOK_URL = 'http://localhost:3000/api/payment/webhook';
  private readonly MOCK_SECRET_SIGN = 'mock_secret_sign';

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  async mockPay(userId: string, orderNo: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNo },
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    if (order.userId !== userId) {
      throw new BadRequestException('Unauthorized access to order');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order is not in PENDING state');
    }

    // Simulate async payment processing delay
    // In production, this call would be initiated by the Payment Gateway (Stripe/Alipay)
    // Here we simulate the gateway calling our webhook after a delay
    setTimeout(async () => {
      try {
        this.logger.log(`Simulating async webhook for order: ${orderNo}`);
        await firstValueFrom(
          this.httpService.post(this.MOCK_WEBHOOK_URL, {
            orderNo,
            status: 'SUCCESS',
            sign: this.MOCK_SECRET_SIGN,
          }),
        );
      } catch (error) {
        this.logger.error(`Failed to trigger mock webhook for order ${orderNo}`, error);
      }
    }, 2000); // 2 seconds delay

    return { message: 'Payment initiated. Waiting for confirmation.' };
  }

  async handleWebhook(payload: { orderNo: string; status: string; sign: string }) {
    const { orderNo, status, sign } = payload;

    // 1. Verify Signature
    if (sign !== this.MOCK_SECRET_SIGN) {
      this.logger.warn(`Invalid signature for order ${orderNo}`);
      throw new BadRequestException('Invalid signature');
    }

    if (status !== 'SUCCESS') {
      this.logger.log(`Payment failed for order ${orderNo}`);
      return 'success'; // Still return success to gateway to acknowledge receipt
    }

    // 2. Idempotent Processing with Transaction
    return this.prisma.$transaction(async (prisma) => {
      // Fetch order with lock (if supported by DB/Prisma, otherwise standard check)
      // Prisma doesn't support SELECT FOR UPDATE directly in findUnique easily without raw query
      // For simplicity here, we rely on the check below inside transaction
      const order = await prisma.order.findUnique({
        where: { orderNo },
      });

      if (!order) {
        // Order might not exist? Return success to stop retries if logic dictates
        return 'success';
      }

      // Idempotency Check
      if (order.status !== OrderStatus.PENDING) {
        this.logger.log(`Order ${orderNo} already processed. Status: ${order.status}`);
        return 'success';
      }

      // 3. Update Status
      await prisma.order.update({
        where: { orderNo },
        data: {
          status: OrderStatus.PAID,
          // paidAt: new Date(), // Add this field to schema if needed, skipping for strict schema adherence or update schema
        },
      });

      this.logger.log(`Order ${orderNo} successfully paid.`);
      return 'success';
    });
  }
}
