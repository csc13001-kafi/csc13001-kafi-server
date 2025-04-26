import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MaterialsRepository } from './materials.repository';
import { CreateMaterialDto } from './dtos/create-material.dto';
import { Material } from './entities/material.model';
import { UpdateMaterialDto } from './dtos/update-material.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Product } from '../products/entities/product.model';
import { ProductMaterial } from '../products/entities/product_material.model';

@Injectable()
export class MaterialsService {
    constructor(
        private readonly materialsRepository: MaterialsRepository,
        @InjectModel(Product) private readonly productModel: typeof Product,
        @InjectModel(ProductMaterial)
        private readonly productMaterialModel: typeof ProductMaterial,
    ) {}

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

    async updateStock(
        id: string,
        updateMaterialDto: UpdateMaterialDto,
    ): Promise<Material> {
        try {
            const material = await this.materialsRepository.findById(id);
            if (!material) {
                throw new InternalServerErrorException('Material not found');
            }

            const updatedMaterial = await this.materialsRepository.update(
                material,
                { currentStock: updateMaterialDto.currentStock },
            );

            const productMaterials = await this.productMaterialModel.findAll({
                where: { materialId: id },
            });

            const productIds = productMaterials.map(
                (pm) => pm.dataValues.productId,
            );

            if (updateMaterialDto.currentStock <= 0) {
                for (const productId of productIds) {
                    await this.productModel.update(
                        { onStock: false },
                        { where: { id: productId } },
                    );
                }
            } else {
                for (const productId of productIds) {
                    const productMaterialRels =
                        await this.productMaterialModel.findAll({
                            where: { productId },
                            include: [
                                {
                                    model: Material,
                                    attributes: ['id', 'currentStock'],
                                },
                            ],
                        });

                    const allMaterialsInStock = productMaterialRels.every(
                        (pm) =>
                            pm.dataValues.Material?.dataValues.currentStock > 0,
                    );

                    // Update product availability
                    if (allMaterialsInStock) {
                        await this.productModel.update(
                            { onStock: true },
                            { where: { id: productId } },
                        );
                    }
                }
            }

            return updatedMaterial;
        } catch (error) {
            throw new InternalServerErrorException(
                `Failed to update material stock: ${error.message}`,
            );
        }
    }
}
