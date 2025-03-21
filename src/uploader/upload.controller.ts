import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    Body,
    BadRequestException,
    UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import type { Multer } from 'multer';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiConsumes,
    ApiBody,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
import { ATAuthGuard } from '../auth/guards/at-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('upload')
export class UploadController {
    constructor(private readonly uploadService: UploadService) {}

    @ApiOperation({ summary: 'Upload a file to storage' })
    @ApiBearerAuth('access-token')
    @Post()
    @ApiConsumes('multipart/form-data') // Important for file upload
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
                bucket: {
                    type: 'string',
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'File uploaded successfully',
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.MANAGER)
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @UploadedFile() file: Multer.File,
        @Body('bucket') bucket: string,
    ) {
        if (!file) {
            throw new BadRequestException('File is required');
        }
        if (!bucket) {
            throw new BadRequestException('Bucket name is required');
        }

        const fileUrl = await this.uploadService.uploadFile(file, bucket);
        return { url: fileUrl };
    }
}
