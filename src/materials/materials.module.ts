import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Material } from './entities/material.model';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';
import { MaterialsRepository } from './materials.repository';
import { AccessControlService } from '../ac/ac.service';

@Module({
    imports: [SequelizeModule.forFeature([Material])],
    controllers: [MaterialsController],
    providers: [MaterialsService, MaterialsRepository, AccessControlService],
    exports: [MaterialsService, MaterialsRepository, AccessControlService],
})
export class MaterialsModule {}
