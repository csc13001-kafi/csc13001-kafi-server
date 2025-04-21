import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import { CategoriesRepository } from './categories.repository';
import { ProductsRepository } from '../products/products.repository';
import type { Multer } from 'multer';
import { Category } from '../categories/entities/category.model';
import { UploadService } from '../uploader/upload.service';
@Injectable()
export class CategoriesService {
    constructor(
        private readonly categoriesRepository: CategoriesRepository,
        private readonly productsRepository: ProductsRepository,
        private readonly uploadService: UploadService,
    ) {}

    async create(
        createCategoryDto: CreateCategoryDto,
        file: Multer.File,
    ): Promise<Category> {
        try {
            const { name } = createCategoryDto;
            if (!name) {
                throw new InternalServerErrorException('Invalid category data');
            }

            if (!file) {
                throw new InternalServerErrorException('File is required');
            }

            const imageUrl = await this.uploadService.uploadFile(
                file,
                'categories',
            );
            createCategoryDto.image = imageUrl;

            const foundCategory =
                await this.categoriesRepository.findByName(name);
            if (foundCategory) {
                throw new InternalServerErrorException(
                    'Category with the same name already exists',
                );
            }
            const newCategory =
                await this.categoriesRepository.create(createCategoryDto);
            return newCategory;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    public async findAllWithProducts(): Promise<{
        categories: {
            id: string;
            name: string;
            image: string;
        }[];
        products: {
            id: string;
            name: string;
            image: string;
        }[];
    }> {
        try {
            const categories = await this.categoriesRepository.findAll();
            const products = await this.productsRepository.findAll();
            return {
                categories,
                products: products.map((product) => ({
                    categoryId: product.categoryId,
                    ...product,
                })),
            };
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    public async findAll(): Promise<
        {
            id: string;
            name: string;
            image: string;
        }[]
    > {
        try {
            const categories = await this.categoriesRepository.findAll();
            return categories;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    public async findById(id: string): Promise<{
        id: string;
        name: string;
        image: string;
    }> {
        try {
            const category = await this.categoriesRepository.findById(id);
            return category;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async update(
        id: string,
        updateCategoryDto: UpdateCategoryDto,
        file?: Multer.File,
    ): Promise<{
        id: string;
        name: string;
        image: string;
    }> {
        const category = await this.categoriesRepository.findById(id);
        if (!category) {
            throw new InternalServerErrorException('Category not found');
        }

        try {
            if (file) {
                const imageUrl = await this.uploadService.uploadFile(
                    file,
                    'categories',
                );
                updateCategoryDto.image = imageUrl;
            }
            const updatedCategory = await this.categoriesRepository.update(
                category,
                updateCategoryDto,
            );
            return updatedCategory;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async delete(id: string): Promise<void> {
        try {
            const category = await this.categoriesRepository.findById(id);
            if (!category) {
                throw new InternalServerErrorException('Category not found');
            }
            await this.categoriesRepository.delete(category);
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }
}
