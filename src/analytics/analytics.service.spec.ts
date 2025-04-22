import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { OrdersRepository } from '../orders/orders.repository';
import { UsersRepository } from '../users/users.repository';
import { ProductsRepository } from '../products/products.repository';
import { CategoriesRepository } from '../categories/categories.repository';
import { MaterialsRepository } from '../materials/materials.repository';
import { Role } from '../auth/enums/roles.enum';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Mock data
const mockMaterials = [
    {
        id: '1',
        name: 'Coffee Beans',
        orginalStock: 1000,
        currentStock: 200,
        unit: 'g',
        expiredDate: new Date('2024-12-31'),
        price: 100,
        dataValues: {
            id: '1',
            name: 'Coffee Beans',
            orginalStock: 1000,
            currentStock: 200,
            unit: 'g',
            expiredDate: new Date('2024-12-31'),
            price: 100,
        },
    },
    {
        id: '2',
        name: 'Milk',
        orginalStock: 5000,
        currentStock: 1500,
        unit: 'ml',
        expiredDate: new Date('2024-06-30'),
        price: 50,
        dataValues: {
            id: '2',
            name: 'Milk',
            orginalStock: 5000,
            currentStock: 1500,
            unit: 'ml',
            expiredDate: new Date('2024-06-30'),
            price: 50,
        },
    },
    {
        id: '3',
        name: 'Sugar',
        orginalStock: 2000,
        currentStock: 100,
        unit: 'g',
        expiredDate: new Date('2024-10-31'),
        price: 30,
        dataValues: {
            id: '3',
            name: 'Sugar',
            orginalStock: 2000,
            currentStock: 100,
            unit: 'g',
            expiredDate: new Date('2024-10-31'),
            price: 30,
        },
    },
];

const mockProducts = [
    {
        id: 'p1',
        name: 'Cappuccino',
        price: 35000,
        dataValues: { id: 'p1', name: 'Cappuccino', price: 35000 },
    },
    {
        id: 'p2',
        name: 'Latte',
        price: 40000,
        dataValues: { id: 'p2', name: 'Latte', price: 40000 },
    },
];

// Mock repositories
const mockOrdersRepository = {
    countByTimeRange: jest.fn(),
    getTotalPriceByTimeRange: jest.fn(),
    getOrdersCountByTimeRange: jest.fn(),
    getHourlySalesData: jest.fn(),
    getOrderCountsByDayAndPaymentMethod: jest.fn(),
};

const mockUsersRepository = {
    countByRole: jest.fn(),
};

const mockProductsRepository = {
    findAll: jest.fn(),
    countProducts: jest.fn(),
};

const mockCategoriesRepository = {
    countCategories: jest.fn(),
};

const mockMaterialsRepository = {
    findLowestStock: jest.fn(),
};

// Add mock for ConfigService
const mockConfigService = {
    get: jest.fn((key: string) => {
        if (key === 'OPENAI_API_KEY') {
            return 'test-api-key';
        }
        return undefined;
    }),
};

describe('AnalyticsService', () => {
    let service: AnalyticsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AnalyticsService,
                { provide: OrdersRepository, useValue: mockOrdersRepository },
                { provide: UsersRepository, useValue: mockUsersRepository },
                {
                    provide: ProductsRepository,
                    useValue: mockProductsRepository,
                },
                {
                    provide: CategoriesRepository,
                    useValue: mockCategoriesRepository,
                },
                {
                    provide: MaterialsRepository,
                    useValue: mockMaterialsRepository,
                },
                {
                    provide: Logger,
                    useValue: { log: jest.fn(), error: jest.fn() },
                },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<AnalyticsService>(AnalyticsService);

        // Reset all mocks before each test
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getOrdersCountByTimeRange', () => {
        it('should return order count for a given time range', async () => {
            mockOrdersRepository.countByTimeRange.mockResolvedValue(10);

            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            const result = await service.getOrdersCountByTimeRange(
                startDate,
                endDate,
            );

            expect(result).toBe(10);
            expect(mockOrdersRepository.countByTimeRange).toHaveBeenCalledWith(
                startDate,
                endDate,
            );
        });

        it('should handle errors', async () => {
            mockOrdersRepository.countByTimeRange.mockRejectedValue(
                new Error('Database error'),
            );

            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            await expect(
                service.getOrdersCountByTimeRange(startDate, endDate),
            ).rejects.toThrow(
                'Failed to get orders count by time range: Database error',
            );
        });
    });

    describe('getOrdersTotalPriceByTimeRange', () => {
        it('should return total price for a given time range', async () => {
            mockOrdersRepository.getTotalPriceByTimeRange.mockResolvedValue(
                1000,
            );

            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            const result = await service.getOrdersTotalPriceByTimeRange(
                startDate,
                endDate,
            );

            expect(result).toBe(1000);
            expect(
                mockOrdersRepository.getTotalPriceByTimeRange,
            ).toHaveBeenCalledWith(startDate, endDate);
        });

        it('should handle errors', async () => {
            mockOrdersRepository.getTotalPriceByTimeRange.mockRejectedValue(
                new Error('Database error'),
            );

            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            await expect(
                service.getOrdersTotalPriceByTimeRange(startDate, endDate),
            ).rejects.toThrow(
                'Failed to get orders total price by time range: Database error',
            );
        });
    });

    describe('getProducts', () => {
        it('should return all products', async () => {
            mockProductsRepository.findAll.mockResolvedValue(mockProducts);

            const result = await service.getProducts();

            expect(result).toEqual(mockProducts);
            expect(mockProductsRepository.findAll).toHaveBeenCalled();
        });

        it('should handle errors', async () => {
            mockProductsRepository.findAll.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(service.getProducts()).rejects.toThrow(
                'Failed to get products',
            );
        });
    });

    describe('getCategoriesCount', () => {
        it('should return the number of categories', async () => {
            mockCategoriesRepository.countCategories.mockResolvedValue(5);

            const result = await service.getCategoriesCount();

            expect(result).toBe(5);
            expect(mockCategoriesRepository.countCategories).toHaveBeenCalled();
        });

        it('should handle errors', async () => {
            mockCategoriesRepository.countCategories.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(service.getCategoriesCount()).rejects.toThrow(
                'Failed to get categories count',
            );
        });
    });

    describe('getUsersCountByRole', () => {
        it('should return the number of users with a given role', async () => {
            mockUsersRepository.countByRole.mockResolvedValue(3);

            const result = await service.getUsersCountByRole(Role.EMPLOYEE);

            expect(result).toBe(3);
            expect(mockUsersRepository.countByRole).toHaveBeenCalledWith(
                Role.EMPLOYEE,
            );
        });

        it('should handle errors', async () => {
            mockUsersRepository.countByRole.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(
                service.getUsersCountByRole(Role.EMPLOYEE),
            ).rejects.toThrow('Failed to get users count with role EMPLOYEE');
        });
    });

    describe('getProductsCount', () => {
        it('should return the number of products', async () => {
            mockProductsRepository.countProducts.mockResolvedValue(10);

            const result = await service.getProductsCount();

            expect(result).toBe(10);
            expect(mockProductsRepository.countProducts).toHaveBeenCalled();
        });

        it('should handle errors', async () => {
            mockProductsRepository.countProducts.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(service.getProductsCount()).rejects.toThrow(
                'Failed to get products count: Database error',
            );
        });
    });

    describe('getDashboardStats', () => {
        beforeEach(() => {
            // Mock the service methods that getDashboardStats calls
            jest.spyOn(service, 'getOrdersCountByTimeRange').mockResolvedValue(
                20,
            );
            jest.spyOn(
                service,
                'getOrdersTotalPriceByTimeRange',
            ).mockResolvedValue(2000);
            jest.spyOn(service, 'getCategoriesCount').mockResolvedValue(5);
            jest.spyOn(service, 'getProductsCount').mockResolvedValue(10);
            jest.spyOn(service, 'getUsersCountByRole').mockResolvedValue(100);
        });

        it('should return dashboard statistics', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            const result = await service.getDashboardStats(startDate, endDate);

            expect(result).toHaveProperty('Overview');
            expect(result).toHaveProperty('Product');
            expect(result).toHaveProperty('Membership');
            expect(result).toHaveProperty('timeRange');

            expect(result.Overview.ordersCount).toBe(20);
            expect(result.Overview.ordersTotalPrice).toBe(2000);
            expect(result.Product.categoriesCount).toBe(5);
            expect(result.Product.productsCount).toBe(10);
            expect(result.Membership).toBe(100);
        });

        it('should handle errors', async () => {
            jest.spyOn(service, 'getOrdersCountByTimeRange').mockRejectedValue(
                new Error('Database error'),
            );

            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            await expect(
                service.getDashboardStats(startDate, endDate),
            ).rejects.toThrow(
                'Failed to get dashboard statistics: Database error',
            );
        });
    });

    describe('getOrdersByMonth', () => {
        beforeEach(() => {
            // Mock the service methods that getOrdersByMonth calls
            jest.spyOn(service, 'getOrdersCountByTimeRange').mockResolvedValue(
                15,
            );
            jest.spyOn(
                service,
                'getOrdersTotalPriceByTimeRange',
            ).mockResolvedValue(1500);
        });

        it('should return orders data for a valid month', async () => {
            const result = await service.getOrdersByMonth(4); // April

            expect(result).toHaveProperty('month', 4);
            expect(result).toHaveProperty('monthName', 'April');
            expect(result).toHaveProperty('ordersCount', 15);
            expect(result).toHaveProperty('ordersTotalPrice', 1500);
            expect(result).toHaveProperty('timeRange');
        });

        it('should throw error for invalid month', async () => {
            await expect(service.getOrdersByMonth(13)).rejects.toThrow(
                'Month must be between 1 and 12',
            );
            await expect(service.getOrdersByMonth(0)).rejects.toThrow(
                'Month must be between 1 and 12',
            );
        });

        it('should handle errors from service calls', async () => {
            jest.spyOn(service, 'getOrdersCountByTimeRange').mockRejectedValue(
                new Error('Database error'),
            );

            await expect(service.getOrdersByMonth(4)).rejects.toThrow(
                'Failed to get orders by month: Database error',
            );
        });
    });

    describe('getHourlySalesData', () => {
        beforeEach(() => {
            mockOrdersRepository.getHourlySalesData.mockResolvedValue([
                { hour: 8, totalPrice: 300000 },
                { hour: 9, totalPrice: 250000 },
                { hour: 10, totalPrice: 400000 },
            ]);
        });

        it('should return hourly sales data for a valid date', async () => {
            const dateStr = '2024-04-15';
            const result = await service.getHourlySalesData(dateStr);

            expect(result).toHaveProperty('date');
            expect(result).toHaveProperty('rawDate', '2024-04-15');
            expect(result).toHaveProperty('hourlySales');
        });

        it('should throw error for invalid date format', async () => {
            await expect(
                service.getHourlySalesData('invalid-date'),
            ).rejects.toThrow(
                'Invalid date format. Please use YYYY-MM-DD format.',
            );
        });
    });

    describe('getLowStockMaterials', () => {
        it('should return materials with lowest stock', async () => {
            mockMaterialsRepository.findLowestStock.mockResolvedValue(
                mockMaterials,
            );

            const result = await service.getLowStockMaterials();

            expect(result).toHaveProperty('materials');
            expect(result.materials).toHaveLength(3);
            expect(result.materials[0]).toHaveProperty('name', 'Coffee Beans');
            expect(result.materials[0]).toHaveProperty('currentStock', 200);
            expect(result.materials[0]).toHaveProperty('percentRemaining', 20); // (200/1000)*100

            expect(
                mockMaterialsRepository.findLowestStock,
            ).toHaveBeenCalledWith(3);
        });

        it('should allow customizing the limit', async () => {
            mockMaterialsRepository.findLowestStock.mockResolvedValue([
                mockMaterials[0],
                mockMaterials[1],
            ]);

            const result = await service.getLowStockMaterials(2);

            expect(result.materials).toHaveLength(2);
            expect(
                mockMaterialsRepository.findLowestStock,
            ).toHaveBeenCalledWith(2);
        });

        it('should handle errors', async () => {
            mockMaterialsRepository.findLowestStock.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(service.getLowStockMaterials()).rejects.toThrow(
                'Failed to get low stock materials: Database error',
            );
        });
    });
});
