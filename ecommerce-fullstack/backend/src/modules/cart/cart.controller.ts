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
  async addToCart(
    @CurrentUser() user: any,
    @Body() body: { skuId: string; quantity: number },
  ) {
    console.log('Cart request received. User:', user, 'Body:', body);
    try {
      if (!user || !user.userId) {
        throw new Error('User ID missing from JWT payload');
      }
      if (!body.skuId || !body.quantity) {
        throw new Error('Missing skuId or quantity in body');
      }
      return await this.cartService.addToCart(user.userId, body.skuId, body.quantity);
    } catch (error) {
      console.error('Error in addToCart controller:', error);
      throw error;
    }
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
