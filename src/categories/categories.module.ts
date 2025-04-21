import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Category } from './entities/category.model';
import { CategoriesRepository } from './categories.repository';
import { ProductsModule } from '../products/products.module';
import { UploadService } from '../uploader/upload.service';
@Module({
    imports: [SequelizeModule.forFeature([Category]), ProductsModule],
    controllers: [CategoriesController],
    providers: [CategoriesService, CategoriesRepository, UploadService],
    exports: [CategoriesService, CategoriesRepository],
})
export class CategoriesModule {}
