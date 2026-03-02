import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: any) {
    return this.cartService.getCart(user.userId);
  }

  @Post()
  addToCart(
    @CurrentUser() user: any,
    @Body() body: { skuId: string; quantity: number },
  ) {
    return this.cartService.addToCart(user.userId, body.skuId, body.quantity);
  }

  @Put(':skuId')
  updateQuantity(
    @CurrentUser() user: any,
    @Param('skuId') skuId: string,
    @Body() body: { quantity: number },
  ) {
    return this.cartService.updateQuantity(user.userId, skuId, body.quantity);
  }

  @Delete()
  removeFromCart(
    @CurrentUser() user: any,
    @Body() body: { skuIds: string[] },
  ) {
    return this.cartService.removeFromCart(user.userId, body.skuIds);
  }
}
