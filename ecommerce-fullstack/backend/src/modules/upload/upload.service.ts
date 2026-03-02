import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  // --- S3 Configuration Placeholder ---
  // To enable S3/OSS upload:
  // 1. Install @aws-sdk/client-s3
  // 2. Add to .env:
  //    AWS_ACCESS_KEY_ID=your_key
  //    AWS_SECRET_ACCESS_KEY=your_secret
  //    AWS_REGION=us-east-1
  //    AWS_BUCKET_NAME=my-ecommerce-bucket
  // 3. Uncomment and implement s3.putObject logic below.

  async uploadImage(file: Express.Multer.File): Promise<string> {
    // Strategy Pattern: Switch between Local and S3 here based on config
    return this.uploadLocal(file);
  }

  private async uploadLocal(file: Express.Multer.File): Promise<string> {
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    
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
