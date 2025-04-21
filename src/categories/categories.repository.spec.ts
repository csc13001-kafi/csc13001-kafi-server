import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesRepository } from './categories.repository';
import { Category } from './entities/category.model';
import { getModelToken } from '@nestjs/sequelize';
import { InternalServerErrorException } from '@nestjs/common';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';

describe('CategoriesRepository', () => {
    let repository: CategoriesRepository;

    // Mock Category model
    const mockCategoryModel = {
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        findByPk: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
        count: jest.fn(),
    };

    // Mock category data
    const mockCategory = {
        id: '1',
        name: 'Coffee',
        image: 'coffee.jpg',
        update: jest.fn(),
        destroy: jest.fn(),
        get: jest.fn(),
        dataValues: {
            id: '1',
            name: 'Coffee',
            image: 'coffee.jpg',
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CategoriesRepository,
                {
                    provide: getModelToken(Category),
                    useValue: mockCategoryModel,
                },
            ],
        }).compile();

        repository = module.get<CategoriesRepository>(CategoriesRepository);

        // Reset all mocks
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    describe('create', () => {
        it('should create a category successfully', async () => {
            const createDto: CreateCategoryDto = {
                name: 'Coffee',
                image: 'coffee.jpg',
            };

            mockCategoryModel.create.mockResolvedValue(mockCategory);

            const result = await repository.create(createDto);

            expect(mockCategoryModel.create).toHaveBeenCalledWith({
                name: createDto.name,
                image: createDto.image,
            });
            expect(result).toEqual(mockCategory);
        });

        it('should throw InternalServerErrorException if creation fails', async () => {
            const createDto: CreateCategoryDto = {
                name: 'Coffee',
                image: 'coffee.jpg',
            };

            mockCategoryModel.create.mockResolvedValue(null);

            await expect(repository.create(createDto)).rejects.toThrow(
                InternalServerErrorException,
            );
            expect(mockCategoryModel.create).toHaveBeenCalled();
        });
    });

    describe('findAll', () => {
        it('should return all categories', async () => {
            const categories = [mockCategory];
            mockCategoryModel.findAll.mockResolvedValue(categories);

            const result = await repository.findAll();

            expect(mockCategoryModel.findAll).toHaveBeenCalled();
            expect(result).toEqual(categories.map((c) => c.dataValues));
        });

        it('should throw InternalServerErrorException on error', async () => {
            mockCategoryModel.findAll.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(repository.findAll()).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    describe('findByName', () => {
        it('should find a category by name', async () => {
            mockCategoryModel.findOne.mockResolvedValue(mockCategory);

            const result = await repository.findByName('Coffee');

            expect(mockCategoryModel.findOne).toHaveBeenCalledWith({
                where: { name: 'Coffee' },
            });
            expect(result).toEqual(mockCategory.dataValues);
        });

        it('should return undefined if category not found', async () => {
            mockCategoryModel.findOne.mockResolvedValue(null);

            const result = await repository.findByName('Non-existent Category');

            expect(result).toBeUndefined();
        });

        it('should throw InternalServerErrorException on error', async () => {
            mockCategoryModel.findOne.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(repository.findByName('Coffee')).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    describe('findById', () => {
        it('should find a category by id', async () => {
            mockCategoryModel.findByPk.mockResolvedValue(mockCategory);

            const result = await repository.findById('1');

            expect(mockCategoryModel.findByPk).toHaveBeenCalledWith('1');
            expect(result).toEqual(mockCategory);
        });

        it('should throw InternalServerErrorException on error', async () => {
            mockCategoryModel.findByPk.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(repository.findById('1')).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    describe('update', () => {
        it('should update a category', async () => {
            const updateDto: UpdateCategoryDto = { name: 'Updated Coffee' };
            mockCategory.get.mockReturnValue(mockCategory.dataValues);

            await repository.update(mockCategory as any, updateDto);

            expect(mockCategory.update).toHaveBeenCalledWith({
                ...mockCategory.dataValues,
                ...updateDto,
            });
        });

        it('should throw InternalServerErrorException on error', async () => {
            const updateDto: UpdateCategoryDto = { name: 'Updated Coffee' };
            mockCategory.get.mockReturnValue(mockCategory.dataValues);
            mockCategory.update.mockRejectedValue(new Error('Database error'));

            await expect(
                repository.update(mockCategory as any, updateDto),
            ).rejects.toThrow(InternalServerErrorException);
        });
    });

    describe('delete', () => {
        it('should delete a category', async () => {
            await repository.delete(mockCategory as any);

            expect(mockCategory.destroy).toHaveBeenCalled();
        });

        it('should throw InternalServerErrorException on error', async () => {
            mockCategory.destroy.mockRejectedValue(new Error('Database error'));

            await expect(
                repository.delete(mockCategory as any),
            ).rejects.toThrow(InternalServerErrorException);
        });
    });

    describe('countCategories', () => {
        it('should count categories', async () => {
            mockCategoryModel.count.mockResolvedValue(10);

            const result = await repository.countCategories();

            expect(mockCategoryModel.count).toHaveBeenCalled();
            expect(result).toEqual(10);
        });
    });
});
