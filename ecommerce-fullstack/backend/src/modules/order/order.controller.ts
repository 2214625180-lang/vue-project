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
  getMyOrders(@CurrentUser() user: any, @Query() query: GetMyOrdersDto) {
    return this.orderService.getMyOrders(user.userId, query);
  }

  @Post('checkout')
  checkout(@CurrentUser() user: any, @Body() createOrderDto: CreateOrderDto) {
    return this.orderService.checkout(user.userId, createOrderDto);
  }

  @Get(':orderNo')
  findOne(@CurrentUser() user: any, @Param('orderNo') orderNo: string) {
    // In real app, implement findOne in OrderService
    return this.orderService.findOne(user.userId, orderNo);
  }
}
