import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { Product } from './entities/product.model';
import { ProductMaterial } from './entities/product_material.model';
import { Material } from '../materials/entities/material.model';
@Injectable()
export class ProductsRepository {
    constructor(
        @InjectModel(Product) private readonly productModel: typeof Product,
        @InjectModel(ProductMaterial)
        private readonly productMaterialModel: typeof ProductMaterial,
        @InjectModel(Material) private readonly materialModel: typeof Material,
    ) {}

    async create(CreateDto: CreateProductDto): Promise<Product> {
        const { name, image, price, onStock, materials, categoryId, quantity } =
            CreateDto;

        const product = await this.productModel.create({
            name: name,
            image: image,
            price: price,
            onStock: onStock,
            categoryId: categoryId,
        });

        if (!product) {
            throw new InternalServerErrorException(
                'Error occurs when creating product',
            );
        }

        if (materials && materials.length > 0) {
            const sizeMaterials = materials.length;
            for (let i = 0; i < sizeMaterials; i++) {
                const material = materials[i];
                const materialQuantity = quantity[i];
                await this.productMaterialModel.create({
                    productId: product.id,
                    materialId: material,
                    quantity: materialQuantity,
                });
            }
        }

        return product;
    }

    async findAllMaterialsOfProduct(productId: string): Promise<
        {
            materialId: string;
            productId: string;
            quantity: number;
            material?: any;
        }[]
    > {
        const productMaterials = await this.productMaterialModel.findAll({
            where: { productId },
            include: [
                {
                    model: this.materialModel,
                    attributes: ['id', 'name', 'currentStock', 'unit'],
                },
            ],
        });
        if (!productMaterials || productMaterials.length === 0) {
            return [];
        }

        // Return the product materials with their associated material details
        return productMaterials.map((pm) => {
            const result: any = {
                materialId: pm.dataValues.materialId,
                productId: pm.dataValues.productId,
                quantity: pm.dataValues.quantity,
            };

            // Add material details if available
            if (pm.dataValues.Material) {
                result.material = pm.dataValues.Material.dataValues;
            }

            return result;
        });
    }

    async findAll(): Promise<Product[]> {
        try {
            const products = await this.productModel.findAll();
            return products.map((product) => product.dataValues as Product);
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async findAllExtended(): Promise<any[]> {
        try {
            const products = await this.productModel.findAll();
            const productWithMaterials =
                await this.productMaterialModel.findAll();
            const productsWithMaterials = products.map((product) => {
                const productData = product.dataValues as Product;
                const materials = productWithMaterials.map(
                    (productMaterial) => {
                        const value = productMaterial.dataValues;
                        if (value.productId !== productData.id) return null;

                        return {
                            materialId: value.materialId,
                            quantity: value.quantity,
                        };
                    },
                );
                const newMaterials = materials.filter((material) => material);
                return { ...productData, newMaterials };
            });
            return productsWithMaterials;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async findByName(name: string): Promise<Product> {
        try {
            const project = await this.productModel.findOne<Product>({
                where: { name: name },
            });
            return project?.dataValues as Product;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async findById(id: string): Promise<Product> {
        try {
            const product = await this.productModel.findByPk(id);
            return product;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    private cleanDefaultValues(
        dto: UpdateProductDto,
    ): Partial<UpdateProductDto> {
        const cleaned: Partial<UpdateProductDto> = {};
        for (const key in dto) {
            const value = dto[key];
            // Skip empty strings.
            if (value === '' || value === null || value === undefined) {
                continue;
            }
            if (key === 'price' && value === 0) {
                continue;
            }
            if (key === 'onStock' && value === -1) {
                continue;
            }
            if (key === 'quantity') {
                if (Array.isArray(value)) {
                    if (value.every((v) => v === 0)) {
                        continue;
                    }
                } else if (value === 0) {
                    continue;
                }
            }

            cleaned[key] = value;
        }
        return cleaned;
    }

    private async updateProductMaterials(
        productId: string,
        materials: string[],
        quantities: number[],
    ): Promise<void> {
        if (materials.length !== quantities.length) {
            throw new BadRequestException(
                'Materials and quantities array length must match',
            );
        }
        for (let i = 0; i < materials.length; i++) {
            const materialId = materials[i];
            const quantity = quantities[i];

            try {
                const productMaterial = await this.productMaterialModel.findOne(
                    {
                        where: { materialId: materialId },
                    },
                );

                console.log(productMaterial, quantity);
                if (productMaterial) {
                    await this.productMaterialModel.update(
                        { quantity },
                        { where: { productId, materialId } },
                    );
                }
            } catch (error: any) {
                console.log(error.message);
                throw new InternalServerErrorException(
                    (error as Error).message,
                );
            }
        }
    }

    async update(
        product: Product,
        updateProductDto: UpdateProductDto,
    ): Promise<Product> {
        try {
            const cleanedDto = this.cleanDefaultValues(updateProductDto);
            await product.update({ ...product.get(), ...cleanedDto });
            if (
                cleanedDto.materials.length > 0 &&
                cleanedDto.quantity.length > 0
            ) {
                console.log(updateProductDto, cleanedDto);
                await this.updateProductMaterials(
                    product.id,
                    cleanedDto.materials,
                    cleanedDto.quantity,
                );
            }

            return product;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async delete(product: Product): Promise<void> {
        try {
            await this.productMaterialModel.destroy({
                where: { productId: product.id },
            });

            await product.destroy();
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async countProducts(): Promise<number> {
        const count = await this.productModel.count();
        return count;
    }
}
