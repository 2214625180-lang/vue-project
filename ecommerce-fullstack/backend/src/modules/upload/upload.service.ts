import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  async uploadImage(file: Express.Multer.File): Promise<string> {
    // Strategy Pattern: Switch between Local and S3 here based on config
    return this.uploadLocal(file);
  }

  private async uploadLocal(file: Express.Multer.File): Promise<string> {
   const uploadDir = path.join(process.cwd(), 'uploads');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
    const filePath = path.join(uploadDir, filename);

    await fs.promises.writeFile(filePath, file.buffer);
    
    this.logger.log(`File uploaded locally: ${filePath}`);
    
    // In production, this should be a full URL domain (e.g., process.env.API_URL)
    return `/uploads/${filename}`;
  }
}
