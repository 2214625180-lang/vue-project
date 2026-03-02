import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProductModule } from './modules/product/product.module';
import { UploadModule } from './modules/upload/upload.module';
import { CartModule } from './modules/cart/cart.module';
import { AddressModule } from './modules/address/address.module';
import { OrderModule } from './modules/order/order.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { RedisModule } from '@nestjs-modules/ioredis';
import { join } from 'path';

@Module({
  imports: [
    RedisModule.forRoot({
      type: 'single',
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    }),
    AuthModule,
    UserModule,
    ProductModule,
    UploadModule,
    CartModule,
    AddressModule,
    OrderModule,
    PaymentModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'public'), 
      serveRoot: '/', 
    }),
  ],
})
export class AppModule {}
