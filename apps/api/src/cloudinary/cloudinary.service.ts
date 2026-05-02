import { Injectable } from '@nestjs/common';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { resource_type: 'auto' },
        (error, result) => {
          // 如果有错误，直接 reject 原始错误对象
          if (error) {
            return reject(new Error(error instanceof Error ? error.message : String(error)));
          }
          // 如果没有错误，Cloudinary SDK 会保证 result 有值
          // 我们使用类型断言告诉 TypeScript 这是成功的响应
          resolve(result);
        },
      );
      upload.end(file.buffer);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    return cloudinary.uploader.destroy(publicId);
  }
}
