import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
// 🚨 1. 引入 multer 的本地硬盘存储引擎和路径工具
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      // 🚨 2. 启用绝对路径硬盘存储：无论 PM2 怎么跑，死死锚定 ECS 上的 uploads 文件夹
     // 后端：修改 storage 配置
storage: diskStorage({
  // 🚨 直接写死 ECS 服务器上的绝对物理路径，彻底断绝找错文件夹的可能！
  destination: '/root/vue-project/ecommerce-fullstack/backend/uploads',
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    callback(null, `${uniqueSuffix}${ext}`);
  },
}),
    }),
  )
  async uploadImage(
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    // 🚨 3. 返回可以直接被前端和 Nginx 识别的相对路径
    const fileUrl = `/api/uploads/${file.filename}`;
    return { fileUrl };
  }
}