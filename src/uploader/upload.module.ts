import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadService } from './upload.service';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadController } from './upload.controller';
import { AccessControlService } from 'src/ac/ac.service';

@Module({
    imports: [
        ConfigModule,
        MulterModule.register({
            storage: memoryStorage(),
        }),
    ],
    controllers: [UploadController],
    providers: [UploadService, AccessControlService],
    exports: [UploadService],
})
export class UploadModule {}
