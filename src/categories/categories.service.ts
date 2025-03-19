import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import { CategoriesRepository } from './categories.repository';
import { ProductsRepository } from 'src/products/products.repository';

@Injectable()
export class CategoriesService {
    constructor(
        private readonly categoriesRepository: CategoriesRepository,
        private readonly productsRepository: ProductsRepository,
    ) {}

    async create(createCategoryDto: CreateCategoryDto) {
        try {
            const { name, image } = createCategoryDto;
            if (!name || !image) {
                throw new Error('Invalid category data');
            }
            const foundCategory =
                await this.categoriesRepository.findByName(name);
            if (foundCategory) {
                throw new Error('Category with the same name already exists');
            }
            const newCategory =
                await this.categoriesRepository.create(createCategoryDto);
            return newCategory;
        } catch (error: any) {
            throw new Error((error as Error).message);
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
            throw new Error((error as Error).message);
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
            throw new Error((error as Error).message);
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
            throw new Error((error as Error).message);
        }
    }

    async update(
        id: string,
        updateCategoryDto: UpdateCategoryDto,
    ): Promise<{
        id: string;
        name: string;
        image: string;
    }> {
        try {
            const category = await this.categoriesRepository.findById(id);
            if (!category) {
                throw new Error('Category not found');
            }
            const updatedCategory = await this.categoriesRepository.update(
                category,
                updateCategoryDto,
            );
            return updatedCategory;
        } catch (error: any) {
            throw new Error((error as Error).message);
        }
    }

    async delete(id: string): Promise<void> {
        try {
            const category = await this.categoriesRepository.findById(id);
            if (!category) {
                throw new Error('Category not found');
            }
            await this.categoriesRepository.delete(category);
        } catch (error: any) {
            throw new Error((error as Error).message);
        }
    }
}
