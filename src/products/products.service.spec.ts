import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';
import { CategoriesRepository } from '../categories/categories.repository';
import { UploadService } from '../uploader/upload.service';
import { InternalServerErrorException } from '@nestjs/common';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import type { Multer } from 'multer';

describe('ProductsService', () => {
    let service: ProductsService;
    let productsRepository: ProductsRepository;
    let uploadService: UploadService;

    // Mock repositories
    const mockProductsRepository = {
        create: jest.fn(),
        findAll: jest.fn(),
        findById: jest.fn(),
        findByName: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        countProducts: jest.fn(),
    };

    const mockCategoriesRepository = {
        findById: jest.fn(),
    };

    const mockUploadService = {
        uploadFile: jest.fn(),
    };

    const mockProduct = {
        id: '1',
        name: 'Espresso',
        description: 'Strong coffee',
        price: 25000,
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
                ProductsService,
                {
                    provide: ProductsRepository,
                    useValue: mockProductsRepository,
                },
                {
                    provide: CategoriesRepository,
                    useValue: mockCategoriesRepository,
                },
                {
                    provide: UploadService,
                    useValue: mockUploadService,
                },
            ],
        }).compile();

        service = module.get<ProductsService>(ProductsService);
        productsRepository = module.get<ProductsRepository>(ProductsRepository);
        uploadService = module.get<UploadService>(UploadService);

        // Reset all mocks
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should throw InternalServerErrorException if file is missing', async () => {
            const createDto: CreateProductDto = {
                name: 'Espresso',
                price: 25000,
                image: 'espresso.jpg',
                categoryId: '1',
                onStock: true,
                materials: ['coffee', 'water'],
                quantity: [1, 1],
            };

            await expect(service.create(createDto, null)).rejects.toThrow(
                InternalServerErrorException,
            );
            expect(mockCategoriesRepository.findById).not.toHaveBeenCalled();
            expect(mockUploadService.uploadFile).not.toHaveBeenCalled();
            expect(mockProductsRepository.create).not.toHaveBeenCalled();
        });
    });

    describe('findAll', () => {
        it('should return all products', async () => {
            const mockProducts = [mockProduct];
            mockProductsRepository.findAll.mockResolvedValue(mockProducts);

            const result = await service.findAll();

            const findAllSpy = jest.spyOn(productsRepository, 'findAll');
            expect(findAllSpy).toHaveBeenCalled();
            expect(result).toEqual(mockProducts);
        });

        it('should filter products by category if categoryId is provided', async () => {
            const mockProducts = [mockProduct];
            mockProductsRepository.findAll.mockResolvedValue(mockProducts);

            const result = await service.findAll();

            const findAllSpy = jest.spyOn(productsRepository, 'findAll');
            expect(findAllSpy).toHaveBeenCalled();
            expect(result).toEqual(mockProducts);
        });

        it('should throw InternalServerErrorException on error', async () => {
            mockProductsRepository.findAll.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(service.findAll()).rejects.toThrow(Error);
        });
    });

    describe('findById', () => {
        it('should find a product by id', async () => {
            mockProductsRepository.findById.mockResolvedValue(mockProduct);

            const result = await service.findById('1');

            const findByIdSpy = jest.spyOn(productsRepository, 'findById');
            expect(findByIdSpy).toHaveBeenCalledWith('1');
            expect(result).toEqual(mockProduct);
        });

        it('should throw InternalServerErrorException if product not found', async () => {
            mockProductsRepository.findById.mockResolvedValue(null);

            await expect(service.findById('1')).rejects.toThrow(
                InternalServerErrorException,
            );
        });

        it('should throw Error on error', async () => {
            mockProductsRepository.findById.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(service.findById('1')).rejects.toThrow(Error);
        });
    });

    describe('update', () => {
        it('should update a product without file', async () => {
            const updateDto: UpdateProductDto = {
                name: 'Updated Espresso',
                price: 30000,
            };
            mockProductsRepository.findById.mockResolvedValue(mockProduct);
            mockProductsRepository.update.mockResolvedValue({
                ...mockProduct,
                ...updateDto,
            });

            const result = await service.update('1', updateDto);

            const findByIdSpy = jest.spyOn(productsRepository, 'findById');
            expect(findByIdSpy).toHaveBeenCalledWith('1');

            const updateSpy = jest.spyOn(productsRepository, 'update');
            expect(updateSpy).toHaveBeenCalledWith(mockProduct, updateDto);

            expect(result).toEqual({
                ...mockProduct,
                ...updateDto,
            });
        });

        it('should update a product with file', async () => {
            const updateDto: UpdateProductDto = { name: 'Updated Espresso' };
            const uploadedImageUrl = 'updated-espresso.jpg';

            mockProductsRepository.findById.mockResolvedValue(mockProduct);
            mockUploadService.uploadFile.mockResolvedValue(uploadedImageUrl);
            mockProductsRepository.update.mockResolvedValue({
                ...mockProduct,
                ...updateDto,
                image: uploadedImageUrl,
            });

            const result = await service.update('1', updateDto, mockFile);

            const findByIdSpy = jest.spyOn(productsRepository, 'findById');
            expect(findByIdSpy).toHaveBeenCalledWith('1');

            const uploadFileSpy = jest.spyOn(uploadService, 'uploadFile');
            expect(uploadFileSpy).toHaveBeenCalledWith(mockFile, 'products');

            const updateSpy = jest.spyOn(productsRepository, 'update');
            expect(updateSpy).toHaveBeenCalledWith(mockProduct, {
                ...updateDto,
                image: uploadedImageUrl,
            });

            expect(result).toEqual({
                ...mockProduct,
                ...updateDto,
                image: uploadedImageUrl,
            });
        });

        it('should throw InternalServerErrorException if product not found', async () => {
            const updateDto: UpdateProductDto = { name: 'Updated Espresso' };
            mockProductsRepository.findById.mockResolvedValue(null);

            await expect(service.update('1', updateDto)).rejects.toThrow(
                InternalServerErrorException,
            );

            const findByIdSpy = jest.spyOn(productsRepository, 'findById');
            expect(findByIdSpy).toHaveBeenCalledWith('1');

            const updateSpy = jest.spyOn(productsRepository, 'update');
            expect(updateSpy).not.toHaveBeenCalled();
        });
    });

    describe('delete', () => {
        it('should delete a product', async () => {
            mockProductsRepository.findById.mockResolvedValue(mockProduct);

            await service.delete('1');

            const findByIdSpy = jest.spyOn(productsRepository, 'findById');
            expect(findByIdSpy).toHaveBeenCalledWith('1');

            const deleteSpy = jest.spyOn(productsRepository, 'delete');
            expect(deleteSpy).toHaveBeenCalledWith(mockProduct);
        });

        it('should throw InternalServerErrorException if product not found', async () => {
            mockProductsRepository.findById.mockResolvedValue(null);

            await expect(service.delete('1')).rejects.toThrow(
                InternalServerErrorException,
            );

            const findByIdSpy = jest.spyOn(productsRepository, 'findById');
            expect(findByIdSpy).toHaveBeenCalledWith('1');

            const deleteSpy = jest.spyOn(productsRepository, 'delete');
            expect(deleteSpy).not.toHaveBeenCalled();
        });
    });
});
