import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductsRepository } from './products.repository';
import { AccessControlService } from 'src/ac/ac.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Product } from './entities/product.model';
import { ProductMaterial } from './entities/product_material.model';

@Module({
    imports: [SequelizeModule.forFeature([Product, ProductMaterial])],
    controllers: [ProductsController],
    providers: [ProductsService, ProductsRepository, AccessControlService],
    exports: [ProductsService, ProductsRepository, AccessControlService],
})
export class ProductsModule {}
