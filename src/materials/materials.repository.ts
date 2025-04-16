import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Material } from './entities/material.model';
import { CreateMaterialDto } from './dtos/create-material.dto';
import { UpdateMaterialDto } from './dtos/update-material.dto';

@Injectable()
export class MaterialsRepository {
    constructor(
        @InjectModel(Material) private readonly materialModel: typeof Material,
    ) {}

    async create(CreateDto: CreateMaterialDto): Promise<Material> {
        const { name, originalStock, unit, expiredDate, price } = CreateDto;

        const material = await this.materialModel.create({
            name: name,
            orginalStock: originalStock,
            currentStock: originalStock,
            unit: unit,
            expiredDate: expiredDate,
            price: price,
        });

        if (!material) {
            throw new InternalServerErrorException(
                'Error occurs when creating material',
            );
        }
        return material;
    }

    async findAll(): Promise<Material[]> {
        try {
            const materials = await this.materialModel.findAll();
            return materials.map((material) => material.dataValues as Material);
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async findByName(name: string): Promise<Material> {
        try {
            const project = await this.materialModel.findOne<Material>({
                where: { name: name },
            });
            return project?.dataValues as Material;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async findById(id: string): Promise<Material> {
        try {
            const material = await this.materialModel.findByPk(id);
            return material;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async update(
        material: Material,
        updateMaterialDto: UpdateMaterialDto,
    ): Promise<Material> {
        try {
            await material.update({ ...material.get(), ...updateMaterialDto });
            return material;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async delete(material: Material): Promise<void> {
        try {
            await material.destroy();
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async findLowestStock(limit: number = 3): Promise<Material[]> {
        try {
            const materials = await this.materialModel.findAll({
                order: [['currentStock', 'ASC']],
                limit: limit,
            });

            return materials.map((material) => material.dataValues as Material);
        } catch (error: any) {
            throw new InternalServerErrorException(
                `Failed to get materials with lowest stock: ${(error as Error).message}`,
            );
        }
    }
}
