import { Test, TestingModule } from '@nestjs/testing';
import { MaterialsService } from './materials.service';
import { MaterialsRepository } from './materials.repository';
import { InternalServerErrorException } from '@nestjs/common';
import { CreateMaterialDto } from './dtos/create-material.dto';
import { UpdateMaterialDto } from './dtos/update-material.dto';

describe('MaterialsService', () => {
    let service: MaterialsService;
    let repository: MaterialsRepository;

    // Mock material data
    const mockMaterial = {
        id: '1',
        name: 'Coffee Beans',
        orginalStock: 100,
        currentStock: 80,
        unit: 'kg',
        expiredDate: new Date('2024-12-31'),
        price: 10,
    };

    // Mock repository
    const mockMaterialsRepository = {
        create: jest.fn(),
        findAll: jest.fn(),
        findById: jest.fn(),
        findByName: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findLowestStock: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MaterialsService,
                {
                    provide: MaterialsRepository,
                    useValue: mockMaterialsRepository,
                },
            ],
        }).compile();

        service = module.get<MaterialsService>(MaterialsService);
        repository = module.get<MaterialsRepository>(MaterialsRepository);

        // Reset all mocks
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
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

            mockMaterialsRepository.findByName.mockResolvedValue(null);
            mockMaterialsRepository.create.mockResolvedValue(mockMaterial);

            const result = await service.create(createDto);

            expect(mockMaterialsRepository.findByName).toHaveBeenCalledWith(
                createDto.name,
            );
            expect(mockMaterialsRepository.create).toHaveBeenCalledWith(
                createDto,
            );
            expect(result).toEqual(mockMaterial);
        });

        it('should throw InternalServerErrorException if material already exists', async () => {
            const createDto: CreateMaterialDto = {
                name: 'Coffee Beans',
                originalStock: 100,
                unit: 'kg',
                expiredDate: new Date('2024-12-31'),
                price: 10,
            };

            mockMaterialsRepository.findByName.mockResolvedValue(mockMaterial);

            await expect(service.create(createDto)).rejects.toThrow(
                InternalServerErrorException,
            );
            expect(mockMaterialsRepository.findByName).toHaveBeenCalledWith(
                createDto.name,
            );
            expect(mockMaterialsRepository.create).not.toHaveBeenCalled();
        });

        it('should throw InternalServerErrorException if price is negative', async () => {
            const createDto: CreateMaterialDto = {
                name: 'Coffee Beans',
                originalStock: 100,
                unit: 'kg',
                expiredDate: new Date('2024-12-31'),
                price: -10,
            };

            await expect(service.create(createDto)).rejects.toThrow(
                InternalServerErrorException,
            );
            expect(mockMaterialsRepository.findByName).not.toHaveBeenCalled();
            expect(mockMaterialsRepository.create).not.toHaveBeenCalled();
        });

        it('should throw InternalServerErrorException if any required field is missing', async () => {
            const createDto = {
                name: 'Coffee Beans',
                // originalStock is missing
                unit: 'kg',
                expiredDate: new Date('2024-12-31'),
                price: 10,
            } as CreateMaterialDto;

            await expect(service.create(createDto)).rejects.toThrow(
                InternalServerErrorException,
            );
            expect(mockMaterialsRepository.findByName).not.toHaveBeenCalled();
            expect(mockMaterialsRepository.create).not.toHaveBeenCalled();
        });
    });

    describe('findAll', () => {
        it('should return all materials', async () => {
            const materials = [mockMaterial];
            mockMaterialsRepository.findAll.mockResolvedValue(materials);

            const result = await service.findAll();

            expect(mockMaterialsRepository.findAll).toHaveBeenCalled();
            expect(result).toEqual(materials);
        });

        it('should throw InternalServerErrorException on error', async () => {
            mockMaterialsRepository.findAll.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(service.findAll()).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    describe('findById', () => {
        it('should find a material by id', async () => {
            mockMaterialsRepository.findById.mockResolvedValue(mockMaterial);

            const result = await service.findById('1');

            expect(mockMaterialsRepository.findById).toHaveBeenCalledWith('1');
            expect(result).toEqual(mockMaterial);
        });

        it('should throw InternalServerErrorException if material not found', async () => {
            mockMaterialsRepository.findById.mockResolvedValue(null);

            await expect(service.findById('999')).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    describe('update', () => {
        it('should update a material', async () => {
            const updateDto: UpdateMaterialDto = { price: 15 };
            mockMaterialsRepository.findById.mockResolvedValue(mockMaterial);
            mockMaterialsRepository.update.mockResolvedValue({
                ...mockMaterial,
                ...updateDto,
            });

            const result = await service.update('1', updateDto);

            expect(mockMaterialsRepository.findById).toHaveBeenCalledWith('1');
            expect(mockMaterialsRepository.update).toHaveBeenCalledWith(
                mockMaterial,
                updateDto,
            );
            expect(result).toEqual({ ...mockMaterial, ...updateDto });
        });

        it('should throw InternalServerErrorException if material not found', async () => {
            const updateDto: UpdateMaterialDto = { price: 15 };
            mockMaterialsRepository.findById.mockResolvedValue(null);

            await expect(service.update('999', updateDto)).rejects.toThrow(
                InternalServerErrorException,
            );
            expect(mockMaterialsRepository.update).not.toHaveBeenCalled();
        });

        it('should throw InternalServerErrorException on update error', async () => {
            const updateDto: UpdateMaterialDto = { price: 15 };
            mockMaterialsRepository.findById.mockResolvedValue(mockMaterial);
            mockMaterialsRepository.update.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(service.update('1', updateDto)).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    describe('delete', () => {
        it('should delete a material', async () => {
            mockMaterialsRepository.findById.mockResolvedValue(mockMaterial);

            await service.delete('1');

            expect(mockMaterialsRepository.findById).toHaveBeenCalledWith('1');
            expect(mockMaterialsRepository.delete).toHaveBeenCalledWith(
                mockMaterial,
            );
        });

        it('should throw InternalServerErrorException if material not found', async () => {
            mockMaterialsRepository.findById.mockResolvedValue(null);

            await expect(service.delete('999')).rejects.toThrow(
                InternalServerErrorException,
            );
            expect(mockMaterialsRepository.delete).not.toHaveBeenCalled();
        });

        it('should throw InternalServerErrorException on delete error', async () => {
            mockMaterialsRepository.findById.mockResolvedValue(mockMaterial);
            mockMaterialsRepository.delete.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(service.delete('1')).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });
});
