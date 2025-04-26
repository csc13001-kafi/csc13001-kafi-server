import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Material } from './entities/material.model';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';
import { MaterialsRepository } from './materials.repository';
import { AccessControlService } from '../ac/ac.service';
import { Product } from '../products/entities/product.model';
import { ProductMaterial } from '../products/entities/product_material.model';

@Module({
    imports: [SequelizeModule.forFeature([Material, Product, ProductMaterial])],
    controllers: [MaterialsController],
    providers: [MaterialsService, MaterialsRepository, AccessControlService],
    exports: [MaterialsService, MaterialsRepository, AccessControlService],
})
export class MaterialsModule {}
