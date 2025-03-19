import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { Product } from './entities/product.model';
import { ProductMaterial } from './entities/product_material.model';

@Injectable()
export class ProductsRepository {
    constructor(
        @InjectModel(Product) private readonly productModel: typeof Product,
        @InjectModel(ProductMaterial)
        private readonly productMaterialModel: typeof ProductMaterial,
    ) {}

    async create(CreateDto: CreateProductDto): Promise<Product> {
        const { name, image, price, onStock, materials, categoryId } =
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

        if (materials) {
            for (const material of materials) {
                await this.productMaterialModel.create({
                    productId: product.id,
                    materialId: material,
                });
            }
        }

        return product;
    }

    async findAll(): Promise<Product[]> {
        try {
            const products = await this.productModel.findAll();
            return products.map((product) => product.dataValues as Product);
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

    async update(
        product: Product,
        updateProductDto: UpdateProductDto,
    ): Promise<Product> {
        try {
            await product.update({ ...product.get(), ...updateProductDto });
            return product;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async delete(product: Product): Promise<void> {
        try {
            await product.destroy();
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }
}
