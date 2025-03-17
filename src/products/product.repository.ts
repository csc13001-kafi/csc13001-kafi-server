import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.model';

@Injectable()
export class ProductsRepository {
    constructor(
        @InjectModel(Product) private readonly productModel: typeof Product,
    ) {}

    async create(CreateDto: CreateProductDto): Promise<Product> {
        const { name, image, price, onStock } = CreateDto;

        const product = await this.productModel.create({
            name: name,
            image: image,
            price: price,
            onStock: onStock,
        });

        if (!product) {
            throw new InternalServerErrorException(
                'Error occurs when creating product',
            );
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
