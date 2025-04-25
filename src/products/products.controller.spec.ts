import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { BadRequestException } from '@nestjs/common';
import type { Multer } from 'multer';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AccessControlService } from '../ac/ac.service';
import { Reflector } from '@nestjs/core';

describe('ProductsController', () => {
    let controller: ProductsController;
    let service: ProductsService;

    // Mock ProductsService
    const mockProductsService = {
        create: jest.fn(),
        findAll: jest.fn(),
        findById: jest.fn(),
        findAllExtended: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    // Mock data
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

    // Add mock for AccessControlService
    const mockAccessControlService = {
        checkAccess: jest.fn().mockReturnValue(true),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ProductsController],
            providers: [
                {
                    provide: ProductsService,
                    useValue: mockProductsService,
                },
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
            ],
        })
            .overrideGuard(RolesGuard)
            .useValue({ canActivate: jest.fn().mockReturnValue(true) })
            .compile();

        controller = module.get<ProductsController>(ProductsController);
        service = module.get<ProductsService>(ProductsService);

        // Reset all mocks
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a product successfully', async () => {
            const createDto: CreateProductDto = {
                name: 'Espresso',
                price: 25000,
                categoryId: '1',
                image: 'espresso.jpg',
                onStock: true,
                materials: ['coffee', 'water'],
                quantity: [1, 1],
            };

            mockProductsService.create.mockResolvedValue(mockProduct);

            // Create the spy before calling the method
            const createSpy = jest.spyOn(service, 'create');

            const result = await controller.create(mockFile, createDto);

            expect(createSpy).toHaveBeenCalledWith(createDto, mockFile);
            expect(result).toEqual(mockProduct);
        });

        it('should throw BadRequestException if file is missing', async () => {
            const createDto: CreateProductDto = {
                name: 'Espresso',
                price: 25000,
                categoryId: '1',
                image: 'espresso.jpg',
                onStock: true,
                materials: ['coffee', 'water'],
                quantity: [1, 1],
            };

            // Create the spy before calling the method
            const createSpy = jest.spyOn(service, 'create');

            await expect(controller.create(null, createDto)).rejects.toThrow(
                BadRequestException,
            );
            expect(createSpy).not.toHaveBeenCalled();
        });
    });

    describe('findOne', () => {
        it('should return a product by id', async () => {
            mockProductsService.findById.mockResolvedValue(mockProduct);

            // Create the spy before calling the method
            const findByIdSpy = jest.spyOn(service, 'findById');

            const result = await controller.findOne('1');

            expect(findByIdSpy).toHaveBeenCalledWith('1');
            expect(result).toEqual(mockProduct);
        });
    });

    describe('update', () => {
        it('should update a product without file', async () => {
            const updateDto: UpdateProductDto = { name: 'Updated Espresso' };
            const updatedProduct = {
                ...mockProduct,
                name: 'Updated Espresso',
            };

            mockProductsService.update.mockResolvedValue(updatedProduct);

            // Create the spy before calling the method
            const updateSpy = jest.spyOn(service, 'update');

            const result = await controller.update('1', null, updateDto);

            expect(updateSpy).toHaveBeenCalledWith('1', updateDto, null);
            expect(result).toEqual(updatedProduct);
        });

        it('should update a product with file', async () => {
            const updateDto: UpdateProductDto = { name: 'Updated Espresso' };
            const updatedProduct = {
                ...mockProduct,
                name: 'Updated Espresso',
                image: 'new-image.jpg',
            };

            mockProductsService.update.mockResolvedValue(updatedProduct);

            // Create the spy before calling the method
            const updateSpy = jest.spyOn(service, 'update');

            const result = await controller.update('1', mockFile, updateDto);

            expect(updateSpy).toHaveBeenCalledWith('1', updateDto, mockFile);
            expect(result).toEqual(updatedProduct);
        });
    });

    describe('remove', () => {
        it('should delete a product', async () => {
            const expectedResponse = {
                message: 'Product deleted successfully',
            };
            mockProductsService.delete.mockResolvedValue(expectedResponse);

            // Create the spy before calling the method
            const deleteSpy = jest.spyOn(service, 'delete');

            const result = await controller.remove('1');

            expect(deleteSpy).toHaveBeenCalledWith('1');
            expect(result).toEqual(expectedResponse);
        });
    });
});
