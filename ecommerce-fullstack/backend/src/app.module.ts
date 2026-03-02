import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProductModule } from './modules/product/product.module';
import { UploadModule } from './modules/upload/upload.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    AuthModule,
    UserModule,
    ProductModule,
    UploadModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'public'), // Adjust based on build structure
      serveRoot: '/', 
    }),
  ],
})
export class AppModule {}
