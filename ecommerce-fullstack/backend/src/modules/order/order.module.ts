import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { AdminOrderController } from './admin-order.controller';
import { PrismaService } from '../../prisma.service';
import { CartModule } from '../cart/cart.module';
import { OrderProcessor } from './order.processor';

@Module({
  imports: [
    CartModule,
    BullModule.registerQueue({ name: 'order-timeout' }),
  ],
  controllers: [OrderController, AdminOrderController],
  providers: [OrderService, PrismaService, OrderProcessor],
})
export class OrderModule {}
