import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MaterialsRepository } from './materials.repository';
import { CreateMaterialDto } from './dtos/create-material.dto';
import { Material } from './entities/material.model';
import { UpdateMaterialDto } from './dtos/update-material.dto';

@Injectable()
export class MaterialsService {
    constructor(private readonly materialsRepository: MaterialsRepository) {}

    async create(createMaterialDto: CreateMaterialDto): Promise<Material> {
        try {
            const { name, originalStock, unit, expiredDate, price } =
                createMaterialDto;
            if (!name || !originalStock || !unit || !expiredDate || !price) {
                throw new InternalServerErrorException('Invalid material data');
            }

            if (price < 0) {
                throw new InternalServerErrorException(
                    'Price cannot be negative',
                );
            }

            const foundMaterial =
                await this.materialsRepository.findByName(name);
            if (foundMaterial) {
                throw new InternalServerErrorException(
                    'Product with the same name already exists',
                );
            }
            const newMaterial =
                await this.materialsRepository.create(createMaterialDto);
            return newMaterial;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    public async findAll(): Promise<Material[]> {
        try {
            const products = await this.materialsRepository.findAll();
            return products;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    public async findById(id: string): Promise<Material> {
        const product = await this.materialsRepository.findById(id);
        if (!product) {
            throw new InternalServerErrorException('Product not found');
        }
        return product;
    }

    async update(
        id: string,
        updateMaterial: UpdateMaterialDto,
    ): Promise<UpdateMaterialDto> {
        const foundProduct = await this.materialsRepository.findById(id);
        if (!foundProduct) {
            throw new InternalServerErrorException('Product not found');
        }

        try {
            const updatedProduct = await this.materialsRepository.update(
                foundProduct,
                updateMaterial,
            );
            return updatedProduct;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async delete(id: string): Promise<void> {
        const foundProduct = await this.materialsRepository.findById(id);
        if (!foundProduct) {
            throw new InternalServerErrorException('Product not found');
        }
        try {
            await this.materialsRepository.delete(foundProduct);
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }
}
