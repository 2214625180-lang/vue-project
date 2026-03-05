import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { dest: './uploads' })) // Save to local uploads folder
  async uploadImage(
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    // Return local URL
    // In production, you would upload to OSS/S3 here
    // For local dev, we just return the path to ServeStatic
    const url = `http://localhost:3000/uploads/${file.filename}`;
    return { url };
  }
}
