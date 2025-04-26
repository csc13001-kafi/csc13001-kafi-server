import { Test, TestingModule } from '@nestjs/testing';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';
import { AccessControlService } from '../ac/ac.service';
import { CreateMaterialDto } from './dtos/create-material.dto';
import { UpdateMaterialDto } from './dtos/update-material.dto';

describe('MaterialsController', () => {
    let controller: MaterialsController;

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

    // Mock service
    const mockMaterialsService = {
        create: jest.fn(),
        findAll: jest.fn(),
        findById: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        updateStock: jest.fn(),
    };

    // Mock access control service
    const mockAccessControlService = {
        canActivate: jest.fn().mockReturnValue(true),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [MaterialsController],
            providers: [
                {
                    provide: MaterialsService,
                    useValue: mockMaterialsService,
                },
                {
                    provide: AccessControlService,
                    useValue: mockAccessControlService,
                },
            ],
        }).compile();

        controller = module.get<MaterialsController>(MaterialsController);

        // Reset all mocks
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a new material', async () => {
            const createDto: CreateMaterialDto = {
                name: 'Coffee Beans',
                originalStock: 100,
                unit: 'kg',
                expiredDate: new Date('2024-12-31'),
                price: 10,
            };

            mockMaterialsService.create.mockResolvedValue(mockMaterial);

            const result = await controller.create(createDto);

            expect(mockMaterialsService.create).toHaveBeenCalledWith(createDto);
            expect(result).toEqual(mockMaterial);
        });
    });

    describe('findAll', () => {
        it('should return all materials', async () => {
            const materials = [mockMaterial];
            mockMaterialsService.findAll.mockResolvedValue(materials);

            const result = await controller.findAll();

            expect(mockMaterialsService.findAll).toHaveBeenCalled();
            expect(result).toEqual(materials);
        });
    });

    describe('findOne', () => {
        it('should find a material by id', async () => {
            mockMaterialsService.findById.mockResolvedValue(mockMaterial);

            const result = await controller.findOne('1');

            expect(mockMaterialsService.findById).toHaveBeenCalledWith('1');
            expect(result).toEqual(mockMaterial);
        });
    });

    describe('update', () => {
        it('should update a material', async () => {
            const updateDto: UpdateMaterialDto = {
                price: 15,
                currentStock: 100,
            };
            const updatedMaterial = {
                ...mockMaterial,
                price: 15,
                currentStock: 100,
            };

            mockMaterialsService.update.mockResolvedValue(updatedMaterial);

            const result = await controller.update('1', updateDto);

            expect(mockMaterialsService.update).toHaveBeenCalledWith(
                '1',
                updateDto,
            );
            expect(result).toEqual(updatedMaterial);
        });
    });

    describe('remove', () => {
        it('should delete a material', async () => {
            const response = { message: 'Material deleted successfully' };
            mockMaterialsService.delete.mockResolvedValue(response);

            const result = await controller.remove('1');

            expect(mockMaterialsService.delete).toHaveBeenCalledWith('1');
            expect(result).toEqual(response);
        });
    });

    describe('updateStock', () => {
        it('should update material stock and handle product availability', async () => {
            const updateDto: UpdateMaterialDto = { currentStock: 50 };
            const updatedMaterial = {
                ...mockMaterial,
                currentStock: 50,
            };

            mockMaterialsService.updateStock.mockResolvedValue(updatedMaterial);

            const result = await controller.updateStock('1', updateDto);

            expect(mockMaterialsService.updateStock).toHaveBeenCalledWith(
                '1',
                updateDto,
            );
            expect(result).toEqual(updatedMaterial);
        });
    });
});
