import { Controller, Get, Post, Body, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IsEnum, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma.service';

class AdminGetOrdersDto {
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  orderNo?: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}

class ShipOrderDto {
  @IsString()
  @IsNotEmpty()
  trackingNumber!: string;

  @IsString()
  @IsNotEmpty()
  courierCompany!: string;
}

@Controller('admin/orders')
// @UseGuards(JwtAuthGuard) // In real app, add AdminGuard
export class AdminOrderController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(@Query() query: AdminGetOrdersDto) {
    const { page = 1, limit = 10, orderNo, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (orderNo) {
      where.orderNo = { contains: orderNo };
    }
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
        include: {
          items: true,
          user: {
            select: { email: true, id: true }
          }
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
    };
  }

  @Post(':id/ship')
  async shipOrder(@Param('id') id: string, @Body() dto: ShipOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    // STATE GUARD
    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException('Only PAID orders can be shipped');
    }

    return this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.SHIPPED,
        trackingNumber: dto.trackingNumber,
        courierCompany: dto.courierCompany,
        // shippedAt: new Date(), // If you add shippedAt to schema later
      },
    });
  }
}
