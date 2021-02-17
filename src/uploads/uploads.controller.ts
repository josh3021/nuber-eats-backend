import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as AWS from 'aws-sdk';

@Controller('uploads')
export class UploadsController {
  @Post('')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    AWS.config.update({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      region: process.env.AWS_REGION,
    });
    try {
      // const objectName = uuidv5(
      //   `[${Date.now()}]${file.originalname}`,
      //   uuidv5.URL,
      // );
      const objectName = `[${Date.now()}]${file.originalname}`;
      await new AWS.S3()
        .putObject({
          Body: file.buffer,
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: objectName,
          ACL: 'public-read',
        })
        .promise();
      return {
        url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${objectName}`,
      };
    } catch (error) {
      console.error(error);
      return null;
    }
  }
}
