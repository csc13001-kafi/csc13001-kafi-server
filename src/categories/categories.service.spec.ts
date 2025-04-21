import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { CategoriesRepository } from './categories.repository';
import { ProductsRepository } from '../products/products.repository';
import { UploadService } from '../uploader/upload.service';
import { InternalServerErrorException } from '@nestjs/common';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import type { Multer } from 'multer';

describe('CategoriesService', () => {
    let service: CategoriesService;
    let categoriesRepository: CategoriesRepository;
    let productsRepository: ProductsRepository;
    let uploadService: UploadService;

    // Mock repositories
    const mockCategoriesRepository = {
        create: jest.fn(),
        findAll: jest.fn(),
        findById: jest.fn(),
        findByName: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockProductsRepository = {
        findAll: jest.fn(),
    };

    const mockUploadService = {
        uploadFile: jest.fn(),
    };

    // Mock data
    const mockCategory = {
        id: '1',
        name: 'Coffee',
        image: 'coffee.jpg',
    };

    const mockProduct = {
        id: '1',
        name: 'Espresso',
        image: 'espresso.jpg',
        categoryId: '1',
    };

    const mockFile = {
        originalname: 'test.jpg',
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg',
        size: 1024,
    } as Multer.File;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CategoriesService,
                {
                    provide: CategoriesRepository,
                    useValue: mockCategoriesRepository,
                },
                {
                    provide: ProductsRepository,
                    useValue: mockProductsRepository,
                },
                {
                    provide: UploadService,
                    useValue: mockUploadService,
                },
            ],
        }).compile();

        service = module.get<CategoriesService>(CategoriesService);
        categoriesRepository =
            module.get<CategoriesRepository>(CategoriesRepository);
        productsRepository = module.get<ProductsRepository>(ProductsRepository);
        uploadService = module.get<UploadService>(UploadService);

        // Reset all mocks
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a category successfully', async () => {
            const createDto: CreateCategoryDto = {
                name: 'Coffee',
                image: 'coffee.jpg',
            };
            const uploadedImageUrl = 'uploaded-coffee.jpg';

            mockCategoriesRepository.findByName.mockResolvedValue(null);
            mockUploadService.uploadFile.mockResolvedValue(uploadedImageUrl);
            mockCategoriesRepository.create.mockResolvedValue({
                ...mockCategory,
                image: uploadedImageUrl,
            });

            const result = await service.create(createDto, mockFile);

            expect(mockUploadService.uploadFile).toHaveBeenCalledWith(
                mockFile,
                'categories',
            );
            expect(mockCategoriesRepository.findByName).toHaveBeenCalledWith(
                createDto.name,
            );
            expect(mockCategoriesRepository.create).toHaveBeenCalledWith({
                ...createDto,
                image: uploadedImageUrl,
            });
            expect(result).toEqual({
                ...mockCategory,
                image: uploadedImageUrl,
            });
        });

        it('should throw InternalServerErrorException if category already exists', async () => {
            const createDto: CreateCategoryDto = {
                name: 'Coffee',
                image: 'coffee.jpg',
            };

            mockUploadService.uploadFile.mockResolvedValue(
                'uploaded-coffee.jpg',
            );
            mockCategoriesRepository.findByName.mockResolvedValue(mockCategory);

            await expect(service.create(createDto, mockFile)).rejects.toThrow(
                InternalServerErrorException,
            );
            expect(mockCategoriesRepository.create).not.toHaveBeenCalled();
        });

        it('should throw InternalServerErrorException if name is missing', async () => {
            const createDto = {} as CreateCategoryDto;

            await expect(service.create(createDto, mockFile)).rejects.toThrow(
                InternalServerErrorException,
            );
            expect(mockUploadService.uploadFile).not.toHaveBeenCalled();
            expect(mockCategoriesRepository.findByName).not.toHaveBeenCalled();
            expect(mockCategoriesRepository.create).not.toHaveBeenCalled();
        });

        it('should throw InternalServerErrorException if file is missing', async () => {
            const createDto: CreateCategoryDto = {
                name: 'Coffee',
                image: 'coffee.jpg',
            };

            await expect(service.create(createDto, null)).rejects.toThrow(
                InternalServerErrorException,
            );
            expect(mockUploadService.uploadFile).not.toHaveBeenCalled();
            expect(mockCategoriesRepository.findByName).not.toHaveBeenCalled();
            expect(mockCategoriesRepository.create).not.toHaveBeenCalled();
        });
    });

    describe('findAllWithProducts', () => {
        it('should return all categories with products', async () => {
            const mockResponse = {
                categories: [mockCategory],
                products: [mockProduct],
            };

            // Create spy BEFORE calling the method
            const findAllWithProductsSpy = jest.spyOn(
                service,
                'findAllWithProducts',
            );

            // Set up the mock return value
            mockCategoriesRepository.findAll.mockResolvedValue(
                mockResponse.categories,
            );
            mockProductsRepository.findAll.mockResolvedValue(
                mockResponse.products,
            );

            // Call the method
            const result = await service.findAllWithProducts();

            // Now your expectations will work
            expect(findAllWithProductsSpy).toHaveBeenCalled();
            expect(result).toEqual(mockResponse);
        });

        it('should throw InternalServerErrorException on error', async () => {
            mockCategoriesRepository.findAll.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(service.findAllWithProducts()).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    describe('findAll', () => {
        it('should return all categories', async () => {
            const mockCategories = [mockCategory];
            mockCategoriesRepository.findAll.mockResolvedValue(mockCategories);

            const result = await service.findAll();
            const findAllSpy = jest.spyOn(categoriesRepository, 'findAll');
            expect(findAllSpy).toHaveBeenCalled();
            expect(result).toEqual(mockCategories);
        });

        it('should throw InternalServerErrorException on error', async () => {
            mockCategoriesRepository.findAll.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(service.findAll()).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    describe('findById', () => {
        it('should find a category by id', async () => {
            mockCategoriesRepository.findById.mockResolvedValue(mockCategory);

            const result = await service.findById('1');
            const findByIdSpy = jest.spyOn(categoriesRepository, 'findById');
            expect(findByIdSpy).toHaveBeenCalledWith('1');
            expect(result).toEqual(mockCategory);
        });

        it('should throw InternalServerErrorException on error', async () => {
            mockCategoriesRepository.findById.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(service.findById('1')).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    describe('update', () => {
        it('should update a category', async () => {
            const updateDto: UpdateCategoryDto = { name: 'Updated Coffee' };
            mockCategoriesRepository.findById.mockResolvedValue(mockCategory);
            mockCategoriesRepository.update.mockResolvedValue({
                ...mockCategory,
                ...updateDto,
            });

            const result = await service.update('1', updateDto);
            const findByIdSpy = jest.spyOn(categoriesRepository, 'findById');
            const updateSpy = jest.spyOn(categoriesRepository, 'update');
            expect(findByIdSpy).toHaveBeenCalledWith('1');
            expect(updateSpy).toHaveBeenCalledWith(mockCategory, updateDto);
            expect(result).toEqual({
                ...mockCategory,
                ...updateDto,
            });
        });

        it('should update a category with file', async () => {
            const updateDto: UpdateCategoryDto = { name: 'Updated Coffee' };
            const uploadedImageUrl = 'updated-coffee.jpg';

            mockCategoriesRepository.findById.mockResolvedValue(mockCategory);
            mockUploadService.uploadFile.mockResolvedValue(uploadedImageUrl);
            mockCategoriesRepository.update.mockResolvedValue({
                ...mockCategory,
                ...updateDto,
                image: uploadedImageUrl,
            });

            const result = await service.update('1', updateDto, mockFile);
            const findByIdSpy = jest.spyOn(categoriesRepository, 'findById');
            const updateSpy = jest.spyOn(categoriesRepository, 'update');
            expect(findByIdSpy).toHaveBeenCalledWith('1');
            expect(updateSpy).toHaveBeenCalledWith(mockCategory, updateDto);
            const uploadFileSpy = jest.spyOn(uploadService, 'uploadFile');
            expect(uploadFileSpy).toHaveBeenCalledWith(mockFile, 'categories');
            expect(result).toEqual({
                ...mockCategory,
                ...updateDto,
                image: uploadedImageUrl,
            });
            expect(result).toEqual({
                ...mockCategory,
                ...updateDto,
                image: uploadedImageUrl,
            });
        });

        it('should throw InternalServerErrorException if category not found', async () => {
            const updateDto: UpdateCategoryDto = { name: 'Updated Coffee' };
            mockCategoriesRepository.findById.mockResolvedValue(null);

            await expect(service.update('1', updateDto)).rejects.toThrow(
                InternalServerErrorException,
            );
            const findByIdSpy = jest.spyOn(categoriesRepository, 'findById');
            expect(findByIdSpy).toHaveBeenCalledWith('1');
            const updateSpy = jest.spyOn(categoriesRepository, 'update');
            expect(updateSpy).not.toHaveBeenCalled();
        });

        it('should throw InternalServerErrorException on update error', async () => {
            const updateDto: UpdateCategoryDto = { name: 'Updated Coffee' };
            mockCategoriesRepository.findById.mockResolvedValue(mockCategory);
            mockCategoriesRepository.update.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(service.update('1', updateDto)).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    describe('delete', () => {
        it('should delete a category', async () => {
            mockCategoriesRepository.findById.mockResolvedValue(mockCategory);

            await service.delete('1');
            const findByIdSpy = jest.spyOn(categoriesRepository, 'findById');
            expect(findByIdSpy).toHaveBeenCalledWith('1');
            const deleteSpy = jest.spyOn(categoriesRepository, 'delete');
            expect(deleteSpy).toHaveBeenCalledWith(mockCategory);
        });

        it('should throw InternalServerErrorException if category not found', async () => {
            mockCategoriesRepository.findById.mockResolvedValue(null);

            await expect(service.delete('1')).rejects.toThrow(
                InternalServerErrorException,
            );
            const findByIdSpy = jest.spyOn(categoriesRepository, 'findById');
            expect(findByIdSpy).toHaveBeenCalledWith('1');
            const deleteSpy = jest.spyOn(categoriesRepository, 'delete');
            expect(deleteSpy).not.toHaveBeenCalled();
        });

        it('should throw InternalServerErrorException on delete error', async () => {
            mockCategoriesRepository.findById.mockResolvedValue(mockCategory);
            mockCategoriesRepository.delete.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(service.delete('1')).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });
});
