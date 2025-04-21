import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import { BadRequestException } from '@nestjs/common';
import type { Multer } from 'multer';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AccessControlService } from '../ac/ac.service';
import { Reflector } from '@nestjs/core';

describe('CategoriesController', () => {
    let controller: CategoriesController;
    let service: CategoriesService;
    let accessControlService: AccessControlService;

    // Mock CategoriesService
    const mockCategoriesService = {
        create: jest.fn(),
        findAllWithProducts: jest.fn(),
        findAll: jest.fn(),
        findById: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    // Mock data
    const mockCategory = {
        id: '1',
        name: 'Coffee',
        image: 'coffee.jpg',
    };

    const mockProducts = [
        {
            id: '1',
            name: 'Espresso',
            image: 'espresso.jpg',
            categoryId: '1',
        },
    ];

    const mockFile = {
        originalname: 'test.jpg',
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg',
        size: 1024,
    } as Multer.File;

    // Add mock for AccessControlService
    const mockAccessControlService = {
        // Add methods the guard calls
        checkAccess: jest.fn().mockReturnValue(true),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CategoriesController],
            providers: [
                {
                    provide: CategoriesService,
                    useValue: mockCategoriesService,
                },
                // Add these providers
                {
                    provide: AccessControlService,
                    useValue: mockAccessControlService,
                },
                {
                    provide: Reflector,
                    useValue: {
                        get: jest.fn(),
                        getAllAndOverride: jest.fn(),
                    },
                },
                {
                    provide: RolesGuard,
                    useValue: {
                        canActivate: jest.fn().mockReturnValue(true),
                    },
                },
            ],
        }).compile();

        controller = module.get<CategoriesController>(CategoriesController);
        service = module.get<CategoriesService>(CategoriesService);
        accessControlService =
            module.get<AccessControlService>(AccessControlService);

        // Reset all mocks
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a category successfully', async () => {
            const createDto: CreateCategoryDto = {
                name: 'Coffee',
                image: 'coffee.jpg',
            };

            mockCategoriesService.create.mockResolvedValue(mockCategory);

            const result = await controller.create(mockFile, createDto);

            const createSpy = jest.spyOn(service, 'create');
            expect(createSpy).toHaveBeenCalledWith(createDto, mockFile);
            expect(result).toEqual(mockCategory);
        });

        it('should throw BadRequestException if file is missing', async () => {
            const createDto: CreateCategoryDto = {
                name: 'Coffee',
                image: 'coffee.jpg',
            };

            await expect(controller.create(null, createDto)).rejects.toThrow(
                BadRequestException,
            );
            const createSpy = jest.spyOn(service, 'create');
            expect(createSpy).not.toHaveBeenCalled();
        });
    });

    describe('findAllWithProducts', () => {
        it('should return all categories with products', async () => {
            const mockResponse = {
                categories: [mockCategory],
                products: mockProducts,
            };

            mockCategoriesService.findAllWithProducts.mockResolvedValue(
                mockResponse,
            );

            const result = await controller.findAllWithProducts();

            const findAllWithProductsSpy = jest.spyOn(
                service,
                'findAllWithProducts',
            );
            expect(findAllWithProductsSpy).toHaveBeenCalled();
            expect(result).toEqual(mockResponse);
        });
    });

    describe('findAll', () => {
        it('should return all categories', async () => {
            const mockCategories = [mockCategory];
            mockCategoriesService.findAll.mockResolvedValue(mockCategories);

            const result = await controller.findAll();
            const findAllSpy = jest.spyOn(service, 'findAll');
            expect(findAllSpy).toHaveBeenCalled();
            expect(result).toEqual(mockCategories);
        });
    });

    describe('findOne', () => {
        it('should return a category by id', async () => {
            mockCategoriesService.findById.mockResolvedValue(mockCategory);

            const result = await controller.findOne('1');
            const findByIdSpy = jest.spyOn(service, 'findById');
            expect(findByIdSpy).toHaveBeenCalledWith('1');
            expect(result).toEqual(mockCategory);
        });
    });

    describe('update', () => {
        it('should update a category without file', async () => {
            const updateDto: UpdateCategoryDto = { name: 'Updated Coffee' };
            const updatedCategory = {
                ...mockCategory,
                name: 'Updated Coffee',
            };

            mockCategoriesService.update.mockResolvedValue(updatedCategory);

            const result = await controller.update('1', null, updateDto);
            const updateSpy = jest.spyOn(service, 'update');
            expect(updateSpy).toHaveBeenCalledWith('1', updateDto, null);
            expect(result).toEqual(updatedCategory);
        });
    });
    describe('remove', () => {
        it('should delete a category', async () => {
            const expectedResponse = {
                message: 'Category deleted successfully',
            };
            mockCategoriesService.delete.mockResolvedValue(expectedResponse);

            const result = await controller.remove('1');
            const deleteSpy = jest.spyOn(service, 'delete');
            expect(deleteSpy).toHaveBeenCalledWith('1');
            expect(result).toEqual(expectedResponse);
        });
    });
});
