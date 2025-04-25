import { Test, TestingModule } from '@nestjs/testing';
import { MaterialsRepository } from './materials.repository';
import { Material } from './entities/material.model';
import { getModelToken } from '@nestjs/sequelize';
import { InternalServerErrorException } from '@nestjs/common';
import { CreateMaterialDto } from './dtos/create-material.dto';
import { UpdateMaterialDto } from './dtos/update-material.dto';

describe('MaterialsRepository', () => {
    let repository: MaterialsRepository;

    // Mock Material model
    const mockMaterialModel = {
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        findByPk: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
    };

    // Mock material data
    const mockMaterial = {
        id: '1',
        name: 'Coffee Beans',
        orginalStock: 100,
        currentStock: 80,
        unit: 'kg',
        expiredDate: new Date('2024-12-31'),
        price: 10,
        update: jest.fn(),
        destroy: jest.fn(),
        get: jest.fn(),
        dataValues: {
            id: '1',
            name: 'Coffee Beans',
            orginalStock: 100,
            currentStock: 80,
            unit: 'kg',
            expiredDate: new Date('2024-12-31'),
            price: 10,
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MaterialsRepository,
                {
                    provide: getModelToken(Material),
                    useValue: mockMaterialModel,
                },
            ],
        }).compile();

        repository = module.get<MaterialsRepository>(MaterialsRepository);

        // Reset all mocks
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    describe('create', () => {
        it('should create a material successfully', async () => {
            const createDto: CreateMaterialDto = {
                name: 'Coffee Beans',
                originalStock: 100,
                unit: 'kg',
                expiredDate: new Date('2024-12-31'),
                price: 10,
            };

            mockMaterialModel.create.mockResolvedValue(mockMaterial);

            const result = await repository.create(createDto);

            expect(mockMaterialModel.create).toHaveBeenCalledWith({
                name: createDto.name,
                orginalStock: createDto.originalStock,
                currentStock: createDto.originalStock,
                unit: createDto.unit,
                expiredDate: createDto.expiredDate,
                price: createDto.price,
            });
            expect(result).toEqual(mockMaterial);
        });

        it('should throw InternalServerErrorException if creation fails', async () => {
            const createDto: CreateMaterialDto = {
                name: 'Coffee Beans',
                originalStock: 100,
                unit: 'kg',
                expiredDate: new Date('2024-12-31'),
                price: 10,
            };

            mockMaterialModel.create.mockResolvedValue(null);

            await expect(repository.create(createDto)).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    describe('findAll', () => {
        it('should return all materials', async () => {
            const materials = [mockMaterial];
            mockMaterialModel.findAll.mockResolvedValue(materials);

            const result = await repository.findAll();

            expect(mockMaterialModel.findAll).toHaveBeenCalled();
            expect(result).toEqual(materials.map((m) => m.dataValues));
        });

        it('should throw InternalServerErrorException on error', async () => {
            mockMaterialModel.findAll.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(repository.findAll()).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    describe('findByName', () => {
        it('should find a material by name', async () => {
            mockMaterialModel.findOne.mockResolvedValue(mockMaterial);

            const result = await repository.findByName('Coffee Beans');

            expect(mockMaterialModel.findOne).toHaveBeenCalledWith({
                where: { name: 'Coffee Beans' },
            });
            expect(result).toEqual(mockMaterial.dataValues);
        });

        it('should return null if material not found', async () => {
            mockMaterialModel.findOne.mockResolvedValue(null);

            const result = await repository.findByName('Non-existent Material');

            expect(result).toBeUndefined();
        });

        it('should throw InternalServerErrorException on error', async () => {
            mockMaterialModel.findOne.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(repository.findByName('Coffee Beans')).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    describe('findById', () => {
        it('should find a material by id', async () => {
            mockMaterialModel.findByPk.mockResolvedValue(mockMaterial);

            const result = await repository.findById('1');

            expect(mockMaterialModel.findByPk).toHaveBeenCalledWith('1');
            expect(result).toEqual(mockMaterial);
        });

        it('should throw InternalServerErrorException on error', async () => {
            mockMaterialModel.findByPk.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(repository.findById('1')).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    describe('update', () => {
        it('should update a material', async () => {
            const updateDto: UpdateMaterialDto = { price: 15 };
            mockMaterial.get.mockReturnValue(mockMaterial.dataValues);

            await repository.update(mockMaterial as any, updateDto);

            expect(mockMaterial.update).toHaveBeenCalledWith({
                ...mockMaterial.dataValues,
                ...updateDto,
            });
        });

        it('should throw InternalServerErrorException on error', async () => {
            const updateDto: UpdateMaterialDto = { price: 15 };
            mockMaterial.get.mockReturnValue(mockMaterial.dataValues);
            mockMaterial.update.mockRejectedValue(new Error('Database error'));

            await expect(
                repository.update(mockMaterial as any, updateDto),
            ).rejects.toThrow(InternalServerErrorException);
        });
    });

    describe('delete', () => {
        it('should delete a material', async () => {
            await repository.delete(mockMaterial as any);

            expect(mockMaterial.destroy).toHaveBeenCalled();
        });

        it('should throw InternalServerErrorException on error', async () => {
            mockMaterial.destroy.mockRejectedValue(new Error('Database error'));

            await expect(
                repository.delete(mockMaterial as any),
            ).rejects.toThrow(InternalServerErrorException);
        });
    });

    describe('findLowestStock', () => {
        it('should find materials with lowest stock', async () => {
            const materials = [mockMaterial];
            mockMaterialModel.findAll.mockResolvedValue(materials);

            const result = await repository.findLowestStock(3);

            expect(mockMaterialModel.findAll).toHaveBeenCalledWith({
                order: [['currentStock', 'ASC']],
                limit: 3,
            });
            expect(result).toEqual(materials.map((m) => m.dataValues));
        });

        it('should throw InternalServerErrorException on error', async () => {
            mockMaterialModel.findAll.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(repository.findLowestStock(3)).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });
});
