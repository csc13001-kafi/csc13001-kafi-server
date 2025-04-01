import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Category } from './entities/category.model';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';
@Injectable()
export class CategoriesRepository {
    constructor(
        @InjectModel(Category) private readonly categoryModel: typeof Category,
    ) {}

    async create(CreateDto: CreateCategoryDto): Promise<Category> {
        const { name, image } = CreateDto;

        const category = await this.categoryModel.create({
            name: name,
            image: image,
        });

        if (!category) {
            throw new InternalServerErrorException(
                'Error occurs when creating product',
            );
        }
        return category;
    }

    async findAll(): Promise<Category[]> {
        try {
            const categories = await this.categoryModel.findAll();
            return categories.map(
                (category) => category.dataValues as Category,
            );
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async findByName(name: string): Promise<Category> {
        try {
            const project = await this.categoryModel.findOne<Category>({
                where: { name: name },
            });
            return project?.dataValues as Category;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async findById(id: string): Promise<Category> {
        try {
            const category = await this.categoryModel.findByPk(id);
            return category;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async update(
        category: Category,
        updateCategoryDto: UpdateCategoryDto,
    ): Promise<Category> {
        try {
            await category.update({ ...category.get(), ...updateCategoryDto });
            return category;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async delete(category: Category): Promise<void> {
        try {
            await category.destroy();
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }
}
