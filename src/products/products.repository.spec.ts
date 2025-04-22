import { Test, TestingModule } from '@nestjs/testing';
import { ProductsRepository } from './products.repository';
import { Product } from './entities/product.model';
import { ProductMaterial } from './entities/product_material.model';
import { getModelToken } from '@nestjs/sequelize';
import { InternalServerErrorException } from '@nestjs/common';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { Material } from '../materials/entities/material.model';

describe('ProductsRepository', () => {
    let repository: ProductsRepository;

    // Mock Product model
    const mockProductModel = {
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        findByPk: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
        count: jest.fn(),
    };

    // Mock ProductMaterial model
    const mockProductMaterialModel = {
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
    };

    // Mock Material model
    const mockMaterialModel = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        findByPk: jest.fn(),
    };

    // Mock product data
    const mockProduct = {
        id: '1',
        name: 'Espresso',
        description: 'Strong coffee',
        price: 25000,
        image: 'espresso.jpg',
        categoryId: '1',
        onStock: true,
        update: jest.fn(),
        destroy: jest.fn(),
        get: jest.fn(),
        dataValues: {
            id: '1',
            name: 'Espresso',
            description: 'Strong coffee',
            price: 25000,
            image: 'espresso.jpg',
            categoryId: '1',
            onStock: true,
        },
    };

    // Mock product material data
    const mockProductMaterial = {
        id: '1',
        productId: '1',
        materialId: 'coffee',
        quantity: 1,
        dataValues: {
            id: '1',
            productId: '1',
            materialId: 'coffee',
            quantity: 1,
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProductsRepository,
                {
                    provide: getModelToken(Product),
                    useValue: mockProductModel,
                },
                {
                    provide: getModelToken(ProductMaterial),
                    useValue: mockProductMaterialModel,
                },
                {
                    provide: getModelToken(Material),
                    useValue: mockMaterialModel,
                },
            ],
        }).compile();

        repository = module.get<ProductsRepository>(ProductsRepository);

        // Reset all mocks
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    describe('create', () => {
        it('should create a product successfully', async () => {
            const createDto: CreateProductDto = {
                name: 'Espresso',
                price: 25000,
                image: 'espresso.jpg',
                categoryId: '1',
                onStock: true,
                materials: ['coffee', 'water'],
                quantity: [1, 1],
            };

            mockProductModel.create.mockResolvedValue(mockProduct);
            mockProductMaterialModel.create.mockResolvedValue(
                mockProductMaterial,
            );

            const result = await repository.create(createDto);

            expect(mockProductModel.create).toHaveBeenCalledWith({
                name: createDto.name,
                price: createDto.price,
                image: createDto.image,
                categoryId: createDto.categoryId,
                onStock: createDto.onStock,
            });

            // Should create 2 materials (coffee and water)
            expect(mockProductMaterialModel.create).toHaveBeenCalledTimes(2);
            expect(mockProductMaterialModel.create).toHaveBeenCalledWith({
                productId: mockProduct.id,
                materialId: 'coffee',
                quantity: 1,
            });
            expect(mockProductMaterialModel.create).toHaveBeenCalledWith({
                productId: mockProduct.id,
                materialId: 'water',
                quantity: 1,
            });

            expect(result).toEqual(mockProduct);
        });

        it('should throw InternalServerErrorException if creation fails', async () => {
            const createDto: CreateProductDto = {
                name: 'Espresso',
                price: 25000,
                image: 'espresso.jpg',
                categoryId: '1',
                onStock: true,
                materials: ['coffee', 'water'],
                quantity: [1, 1],
            };

            mockProductModel.create.mockResolvedValue(null);

            await expect(repository.create(createDto)).rejects.toThrow(
                InternalServerErrorException,
            );
            expect(mockProductModel.create).toHaveBeenCalled();
            expect(mockProductMaterialModel.create).not.toHaveBeenCalled();
        });
    });

    describe('findByName', () => {
        it('should find a product by name', async () => {
            mockProductModel.findOne.mockResolvedValue(mockProduct);

            const result = await repository.findByName('Espresso');

            expect(mockProductModel.findOne).toHaveBeenCalledWith({
                where: { name: 'Espresso' },
            });
            expect(result).toEqual(mockProduct.dataValues);
        });

        it('should return undefined if product not found', async () => {
            mockProductModel.findOne.mockResolvedValue(null);

            const result = await repository.findByName('Non-existent Product');

            expect(result).toBeUndefined();
        });

        it('should throw InternalServerErrorException on error', async () => {
            mockProductModel.findOne.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(repository.findByName('Espresso')).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    describe('findAll', () => {
        it('should return all products', async () => {
            const products = [mockProduct];
            mockProductModel.findAll.mockResolvedValue(products);

            const result = await repository.findAll();

            expect(mockProductModel.findAll).toHaveBeenCalled();
            expect(result).toEqual(products.map((p) => p.dataValues));
        });

        it('should throw InternalServerErrorException on error', async () => {
            mockProductModel.findAll.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(repository.findAll()).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    describe('findAllMaterialsOfProduct', () => {
        it('should return all materials for a product', async () => {
            const productId = '1';
            const mockMaterial = {
                id: 'm1',
                name: 'Coffee Beans',
                currentStock: 1000,
                unit: 'g',
                dataValues: {
                    id: 'm1',
                    name: 'Coffee Beans',
                    currentStock: 1000,
                    unit: 'g',
                },
            };

            const mockProductMaterials = [
                {
                    materialId: 'm1',
                    productId: '1',
                    quantity: 10,
                    dataValues: {
                        materialId: 'm1',
                        productId: '1',
                        quantity: 10,
                        Material: {
                            dataValues: mockMaterial.dataValues,
                        },
                    },
                },
            ];

            mockProductMaterialModel.findAll.mockResolvedValue(
                mockProductMaterials,
            );

            const result =
                await repository.findAllMaterialsOfProduct(productId);

            expect(mockProductMaterialModel.findAll).toHaveBeenCalledWith({
                where: { productId },
                include: [
                    {
                        model: mockMaterialModel,
                        attributes: ['id', 'name', 'currentStock', 'unit'],
                    },
                ],
            });

            expect(result).toHaveLength(1);
            expect(result[0].materialId).toBe('m1');
            expect(result[0].productId).toBe('1');
            expect(result[0].quantity).toBe(10);
            expect(result[0].material).toEqual(mockMaterial.dataValues);
        });

        it('should return empty array if no materials found', async () => {
            mockProductMaterialModel.findAll.mockResolvedValue([]);

            const result =
                await repository.findAllMaterialsOfProduct('nonexistent');

            expect(result).toEqual([]);
        });
    });

    describe('findById', () => {
        it('should find a product by id', async () => {
            mockProductModel.findByPk.mockResolvedValue(mockProduct);

            const result = await repository.findById('1');

            expect(mockProductModel.findByPk).toHaveBeenCalledWith('1');
            expect(result).toEqual(mockProduct);
        });

        it('should throw InternalServerErrorException on error', async () => {
            mockProductModel.findByPk.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(repository.findById('1')).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    describe('update', () => {
        it('should update a product with materials', async () => {
            const updateDto: UpdateProductDto = {
                name: 'Updated Espresso',
                price: 30000,
                materials: ['coffee', 'milk'],
                quantity: [1, 2],
            };
            mockProduct.get.mockReturnValue(mockProduct.dataValues);
            mockProductMaterialModel.findOne.mockResolvedValue(
                mockProductMaterial,
            );

            await repository.update(mockProduct as any, updateDto);

            expect(mockProduct.update).toHaveBeenCalledWith({
                ...mockProduct.dataValues,
                ...updateDto,
            });
            expect(mockProductMaterialModel.findOne).toHaveBeenCalledTimes(2);
            expect(mockProductMaterialModel.update).toHaveBeenCalledTimes(2);
        });

        it('should throw Error on error', async () => {
            const updateDto: UpdateProductDto = {
                name: 'Updated Espresso',
                materials: [],
                quantity: [],
            };
            mockProduct.get.mockReturnValue(mockProduct.dataValues);
            mockProduct.update.mockRejectedValue(new Error('Database error'));

            await expect(
                repository.update(mockProduct as any, updateDto),
            ).rejects.toThrow(Error);
        });
    });

    describe('delete', () => {
        it('should delete a product', async () => {
            await repository.delete(mockProduct as any);

            expect(mockProductMaterialModel.destroy).toHaveBeenCalledWith({
                where: { productId: mockProduct.id },
            });
            expect(mockProduct.destroy).toHaveBeenCalled();
        });

        it('should throw Error on error', async () => {
            mockProduct.destroy.mockRejectedValue(new Error('Database error'));

            await expect(repository.delete(mockProduct as any)).rejects.toThrow(
                Error,
            );
        });
    });

    describe('countProducts', () => {
        it('should count products', async () => {
            mockProductModel.count.mockResolvedValue(15);

            const result = await repository.countProducts();

            expect(mockProductModel.count).toHaveBeenCalled();
            expect(result).toEqual(15);
        });

        it('should throw Error on error', async () => {
            mockProductModel.count.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(repository.countProducts()).rejects.toThrow(Error);
        });
    });
});
