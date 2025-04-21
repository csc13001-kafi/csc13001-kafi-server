import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { BadRequestException } from '@nestjs/common';
import { AccessControlService } from '../ac/ac.service';

describe('AnalyticsController', () => {
    // Mock data
    const mockLowStockMaterials = {
        materials: [
            {
                name: 'Coffee Beans',
                currentStock: 200,
                originalStock: 1000,
                unit: 'g',
                percentRemaining: 20,
                expiredDate: new Date('2024-12-31'),
            },
            {
                name: 'Sugar',
                currentStock: 100,
                originalStock: 2000,
                unit: 'g',
                percentRemaining: 5,
                expiredDate: new Date('2024-10-31'),
            },
        ],
    };

    // Mock service
    const mockAnalyticsService = {
        getDashboardStats: jest.fn(),
        getOrdersByMonth: jest.fn(),
        getHourlySalesData: jest.fn(),
        getTopSellingProducts: jest.fn(),
        getOrdersByDayAndPaymentMethod: jest.fn(),
        getLowStockMaterials: jest.fn(),
    };
    let controller: AnalyticsController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AnalyticsController],
            providers: [
                {
                    provide: AnalyticsService,
                    useValue: mockAnalyticsService,
                },
                {
                    provide: AccessControlService,
                    useValue: { log: jest.fn(), error: jest.fn() },
                },
            ],
        }).compile();

        controller = module.get<AnalyticsController>(AnalyticsController);

        // Reset all mocks before each test
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getOrdersByMonth', () => {
        it('should return orders data for a valid month', async () => {
            const mockOrdersData = {
                month: 4,
                monthName: 'April',
                ordersCount: 15,
                ordersTotalPrice: 1500,
                timeRange: {
                    startDate: new Date('2024-04-01'),
                    endDate: new Date('2024-04-30'),
                },
            };

            mockAnalyticsService.getOrdersByDayAndPaymentMethod.mockResolvedValue(
                mockOrdersData,
            );

            const result = await controller.getOrdersByDayAndPaymentMethod('4');

            expect(result).toEqual(mockOrdersData);
            expect(
                mockAnalyticsService.getOrdersByDayAndPaymentMethod,
            ).toHaveBeenCalledWith(4);
        });

        it('should throw error for invalid month', async () => {
            await expect(
                controller.getOrdersByDayAndPaymentMethod('13'),
            ).rejects.toThrow(BadRequestException);
            await expect(
                controller.getOrdersByDayAndPaymentMethod('abc'),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('getLowStockMaterials', () => {
        it('should return materials with lowest stock', async () => {
            mockAnalyticsService.getLowStockMaterials.mockResolvedValue(
                mockLowStockMaterials,
            );

            const result = await controller.getLowStockMaterials();

            expect(result).toEqual(mockLowStockMaterials);
            expect(
                mockAnalyticsService.getLowStockMaterials,
            ).toHaveBeenCalledWith(3); // Default limit
        });

        it('should allow customizing the limit', async () => {
            mockAnalyticsService.getLowStockMaterials.mockResolvedValue(
                mockLowStockMaterials,
            );

            const result = await controller.getLowStockMaterials('5');

            expect(result).toEqual(mockLowStockMaterials);
            expect(
                mockAnalyticsService.getLowStockMaterials,
            ).toHaveBeenCalledWith(5);
        });

        it('should handle invalid limit value', async () => {
            await expect(controller.getLowStockMaterials('-1')).rejects.toThrow(
                BadRequestException,
            );
            await expect(
                controller.getLowStockMaterials('abc'),
            ).rejects.toThrow(BadRequestException);
        });

        it('should handle errors from service', async () => {
            mockAnalyticsService.getLowStockMaterials.mockRejectedValue(
                new Error('Database error'),
            );

            let error;
            try {
                await controller.getLowStockMaterials();
            } catch (e) {
                error = e;
            }

            expect(error).toBeDefined();
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toContain('Database error');
        });
    });
});
