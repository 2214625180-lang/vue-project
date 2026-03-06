import { Controller, Post, Body, UseGuards, Get, Param, Query } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { GetMyOrdersDto } from './dto/get-my-orders.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('order')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('my-orders')
  async getMyOrders(@CurrentUser('id') userId: string, @Query() query: GetMyOrdersDto) {
    return this.orderService.getMyOrders(userId, query);
  }

  @Post()
  async createOrder(@CurrentUser() user: any, @Body() body: CreateOrderDto) {
    // If addressId is provided, use direct createOrder logic
    if (body.addressId) {
      return this.orderService.createOrder(user.userId, body);
    }
    // Fallback to auto-address logic
    return this.orderService.createOrderFromCart(user.userId, body.skuIds);
  }

  @Post('checkout')
  checkout(@CurrentUser() user: any, @Body() createOrderDto: CreateOrderDto) {
    return this.orderService.checkout(user.userId, createOrderDto);
  }

  @Get(':orderNo')
  findOne(@CurrentUser() user: any, @Param('orderNo') orderNo: string) {
    return this.orderService.findOne(user.userId, orderNo);
  }

  @Post('my-orders/:id/confirm')
  confirmReceipt(@CurrentUser() user: any, @Param('id') id: string) {
    return this.orderService.confirmReceipt(user.userId, id);
  }
}
