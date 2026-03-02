import { Controller, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('mock-pay')
  @UseGuards(JwtAuthGuard)
  mockPay(@CurrentUser() user: any, @Body('orderNo') orderNo: string) {
    return this.paymentService.mockPay(user.userId, orderNo);
  }

  @Post('webhook')
  @HttpCode(200)
  // CRITICAL: No Auth Guard here!
  async webhook(@Body() payload: any) {
    return this.paymentService.handleWebhook(payload);
  }
}
