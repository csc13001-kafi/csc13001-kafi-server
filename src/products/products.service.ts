import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { ProductsRepository } from './products.repository';
import { Product } from './entities/product.model';
import { UploadService } from '../uploader/upload.service';
import type { Multer } from 'multer';

@Injectable()
export class ProductsService {
    constructor(
        private readonly productsRepository: ProductsRepository,
        private readonly uploadService: UploadService,
    ) {}

    async create(
        createProductDto: CreateProductDto,
        file: Multer.File,
    ): Promise<Product> {
        try {
            const { name, price, onStock, categoryId, materials, quantity } =
                createProductDto;
            if (!name || !price || onStock === undefined || !categoryId) {
                throw new InternalServerErrorException('Invalid product data');
            }

            if (!materials || materials.length === 0) {
                throw new InternalServerErrorException(
                    'Product must have materials',
                );
            }

            if (!quantity || quantity.length === 0) {
                throw new InternalServerErrorException(
                    'Product must have quantity for each material',
                );
            }

            if (materials.length !== quantity.length) {
                throw new InternalServerErrorException(
                    'Materials and quantity must have the same length',
                );
            }

            if (!file) {
                throw new InternalServerErrorException(
                    'Product image file is required',
                );
            }

            const imageUrl = await this.uploadService.uploadFile(
                file,
                'products',
            );

            createProductDto.image = imageUrl;

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

    public async findAllExtended(): Promise<
        {
            id: string;
            name: string;
            image: string;
            price: number;
            onStock: boolean;
            categoryId: string;
            materials: string[];
            quantity: number[];
        }[]
    > {
        try {
            const products = await this.productsRepository.findAllExtended();
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
        file?: Multer.File,
    ): Promise<Product> {
        const foundProduct = await this.productsRepository.findById(id);
        if (!foundProduct) {
            throw new InternalServerErrorException('Product not found');
        }

        const { name, price, onStock, categoryId, materials, quantity } =
            updateProductDto;
        if (
            !name &&
            !price &&
            onStock === undefined &&
            !categoryId &&
            !file &&
            !materials &&
            !quantity
        ) {
            throw new InternalServerErrorException('Invalid product data');
        }

        try {
            if (file) {
                const imageUrl = await this.uploadService.uploadFile(
                    file,
                    'products',
                );
                updateProductDto.image = imageUrl;
            }

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
