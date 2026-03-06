import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
// 🚨 1. 新增下面这两个导入（用来开启静态文件服务）
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

import { AppModule } from './src/app.module';
import { TransformInterceptor } from './src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './src/common/filters/http-exception.filter';

async function bootstrap() {
  // 🚨 2. 在 create 后面加上泛型 <NestExpressApplication>
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.setGlobalPrefix('api');
  app.enableCors(); // Enable CORS for frontend

  // 🚨 3. 核心修改：把硬盘上的 uploads 文件夹暴露出去，并挂载到 /api/uploads/ 路径下
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/api/uploads/',
  });

  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  
  await app.listen(3000);
}
bootstrap();
