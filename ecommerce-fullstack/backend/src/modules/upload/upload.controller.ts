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
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (req, file, callback) => {
          // 自动重命名图片：时间戳 + 随机数 + 原后缀 (防止中文名或重名导致报错)
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