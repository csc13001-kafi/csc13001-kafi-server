import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { ProductsRepository } from './products.repository';
import { Product } from './entities/product.model';

@Injectable()
export class ProductsService {
    constructor(private readonly productsRepository: ProductsRepository) {}

    async create(createProductDto: CreateProductDto): Promise<Product> {
        try {
            const { name, price, onStock, categoryId, materials } =
                createProductDto;
            if (!name || !price || onStock === undefined || !categoryId) {
                throw new InternalServerErrorException('Invalid product data');
            }
            if (materials.length === 0) {
                throw new InternalServerErrorException(
                    'Product must have materials',
                );
            }
            if (price < 0) {
                throw new InternalServerErrorException(
                    'Price cannot be negative',
                );
            }
            const foundProduct = await this.productsRepository.findByName(name);
            if (foundProduct) {
                throw new InternalServerErrorException(
                    'Product with the same name already exists',
                );
            }
            const newProduct =
                await this.productsRepository.create(createProductDto);
            return newProduct;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    public async findAll(): Promise<
        {
            id: string;
            name: string;
            image: string;
            price: number;
            onStock: boolean;
            categoryId: string;
        }[]
    > {
        try {
            const products = await this.productsRepository.findAll();
            return products;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    public async findById(id: string): Promise<{
        id: string;
        name: string;
        image: string;
        price: number;
        onStock: boolean;
        categoryId: string;
    }> {
        const product = await this.productsRepository.findById(id);
        if (!product) {
            throw new InternalServerErrorException('Product not found');
        }
        return product;
    }

    async update(
        id: string,
        updateProductDto: UpdateProductDto,
    ): Promise<UpdateProductDto> {
        const foundProduct = await this.productsRepository.findById(id);
        if (!foundProduct) {
            throw new InternalServerErrorException('Product not found');
        }

        try {
            const updatedProduct = await this.productsRepository.update(
                foundProduct,
                updateProductDto,
            );
            return updatedProduct;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async delete(id: string): Promise<void> {
        const foundProduct = await this.productsRepository.findById(id);
        if (!foundProduct) {
            throw new InternalServerErrorException('Product not found');
        }
        try {
            await this.productsRepository.delete(foundProduct);
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }
}
