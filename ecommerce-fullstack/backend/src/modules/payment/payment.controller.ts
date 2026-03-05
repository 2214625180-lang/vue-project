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
    // Updated to match the requested endpoint /api/payment/mock which might expect orderId or orderNo
    // The prompt asked for POST /api/payment/mock accepting orderId. 
    // But existing code uses orderNo. I'll stick to orderNo as it's more standard for payments.
    // However, I should probably alias it or ensure frontend sends orderNo.
    // The prompt says "Accept an orderId". Let's support both or check what frontend sends.
    // MyOrders.vue sends orderNo in goToPayment.
    // I will add a new endpoint /mock matching the prompt description more closely if needed, 
    // or just use this one and ensure frontend calls this.
    return this.paymentService.mockPay(user.userId, orderNo);
  }

  @Post('mock')
  @UseGuards(JwtAuthGuard)
  async mockPaymentSimple(@CurrentUser() user: any, @Body('orderId') orderId: string) {
     return this.paymentService.mockPaymentSimple(user.userId, orderId);
  }

  @Post('webhook')
  @HttpCode(200)
  // CRITICAL: No Auth Guard here!
  async webhook(@Body() payload: any) {
    return this.paymentService.handleWebhook(payload);
  }
}
