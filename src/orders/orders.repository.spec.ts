import { Test, TestingModule } from '@nestjs/testing';
import { OrdersRepository } from './orders.repository';
import { Order } from './entities/order.model';
import { OrderDetails } from './entities/order_details.model';
import { getModelToken } from '@nestjs/sequelize';
import { InternalServerErrorException } from '@nestjs/common';
import {
    CreateOrderDetailsDto,
    CreateOrderGeneralDto,
} from './dtos/create-order.dto';
import { PaymentMethod } from './enums/payment-method.enum';
import { Op } from 'sequelize';

// Mock uuid to return a consistent id
jest.mock('uuid', () => ({
    v4: jest.fn().mockReturnValue('mocked-uuid'),
}));

describe('OrdersRepository', () => {
    let repository: OrdersRepository;

    // Mock Order model
    const mockOrderModel = {
        create: jest.fn(),
        findAll: jest.fn(),
        findByPk: jest.fn(),
        sum: jest.fn(),
        count: jest.fn(),
    };

    // Mock OrderDetails model
    const mockOrderDetailsModel = {
        create: jest.fn(),
        findAll: jest.fn(),
        bulkCreate: jest.fn(),
    };

    // Mock data
    const mockOrder = {
        id: '123',
        table: 'T1',
        employeeName: 'John',
        clientPhoneNumber: '1234567890',
        time: new Date(),
        numberOfProducts: 2,
        totalPrice: 50000,
        discountPercentage: 10,
        discount: 5000,
        afterDiscountPrice: 45000,
        paymentMethod: PaymentMethod.CASH,
        dataValues: {
            id: '123',
            table: 'T1',
            employeeName: 'John',
            clientPhoneNumber: '1234567890',
            time: new Date(),
            numberOfProducts: 2,
            totalPrice: 50000,
            discountPercentage: 10,
            discount: 5000,
            afterDiscountPrice: 45000,
            paymentMethod: PaymentMethod.CASH,
        },
    };

    const mockOrderDetails = [
        {
            id: '1',
            orderId: '123',
            productId: 'product1',
            price: 25000,
            quantity: 1,
            dataValues: {
                id: '1',
                orderId: '123',
                productId: 'product1',
                price: 25000,
                quantity: 1,
            },
        },
        {
            id: '2',
            orderId: '123',
            productId: 'product2',
            price: 25000,
            quantity: 1,
            dataValues: {
                id: '2',
                orderId: '123',
                productId: 'product2',
                price: 25000,
                quantity: 1,
            },
        },
    ];

    // Mock product data for testing
    const mockProducts = [
        {
            id: 'product1',
            name: 'Coffee',
            price: 25000,
            dataValues: {
                id: 'product1',
                name: 'Coffee',
                price: 25000,
            },
        },
        {
            id: 'product2',
            name: 'Tea',
            price: 25000,
            dataValues: {
                id: 'product2',
                name: 'Tea',
                price: 25000,
            },
        },
    ];

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrdersRepository,
                {
                    provide: getModelToken(Order),
                    useValue: mockOrderModel,
                },
                {
                    provide: getModelToken(OrderDetails),
                    useValue: mockOrderDetailsModel,
                },
            ],
        }).compile();

        repository = module.get<OrdersRepository>(OrdersRepository);

        // Reset all mocks
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    describe('create', () => {
        it('should throw InternalServerErrorException if creation fails', async () => {
            const orderGeneralDto: CreateOrderGeneralDto = {
                table: 'T1',
                id: '123',
                time: new Date().toISOString(),
                products: mockProducts as any,
                quantities: [1, 1],
                clientPhoneNumber: '1234567890',
                paymentMethod: PaymentMethod.CASH,
            };

            const orderDetailsDto: CreateOrderDetailsDto = {
                numberOfProducts: 2,
                totalPrice: 50000,
                discountPercentage: 10,
                discount: 5000,
                afterDiscountPrice: 45000,
                employeeName: 'John',
            };

            mockOrderModel.create.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(
                repository.create(orderGeneralDto, orderDetailsDto),
            ).rejects.toThrow(InternalServerErrorException);
        });
    });

    describe('findAll', () => {
        it('should return all orders', async () => {
            const orders = [mockOrder];
            mockOrderModel.findAll.mockResolvedValue(orders);

            const result = await repository.findAll();

            expect(mockOrderModel.findAll).toHaveBeenCalled();
            const date = new Date(mockOrder.dataValues.time);
            date.setHours(date.getHours() + 7);
            expect(result).toEqual([
                {
                    id: mockOrder.dataValues.id,
                    time: date.toISOString().replace('Z', '+07:00'),
                    employeeName: mockOrder.dataValues.employeeName,
                    paymentMethod: mockOrder.dataValues.paymentMethod,
                    price: mockOrder.dataValues.afterDiscountPrice,
                },
            ]);
        });
    });

    describe('findById', () => {
        it('should find an order by id with details', async () => {
            mockOrderModel.findByPk.mockResolvedValue(mockOrder);
            mockOrderDetailsModel.findAll.mockResolvedValue(mockOrderDetails);

            const products = mockProducts;
            const result = await repository.findById('123', products as any);

            expect(mockOrderModel.findByPk).toHaveBeenCalledWith('123');
            expect(mockOrderDetailsModel.findAll).toHaveBeenCalledWith({
                where: { orderId: '123' },
            });

            expect(result).toEqual({
                id: mockOrder.id,
                employeeName: mockOrder.dataValues.employeeName,
                clientPhoneNumber: mockOrder.dataValues.clientPhoneNumber,
                table: mockOrder.dataValues.table,
                time: mockOrder.dataValues.time,
                numberOfProducts: mockOrder.dataValues.numberOfProducts,
                totalPrice: mockOrder.dataValues.totalPrice,
                discountPercentage: mockOrder.dataValues.discountPercentage,
                discount: mockOrder.dataValues.discount,
                afterDiscountPrice: mockOrder.dataValues.afterDiscountPrice,
                paymentMethod: mockOrder.dataValues.paymentMethod,
                orderDetails: expect.arrayContaining([
                    expect.objectContaining({
                        productName: 'Coffee',
                        price: 25000,
                        quantity: 1,
                    }),
                    expect.objectContaining({
                        productName: 'Tea',
                        price: 25000,
                        quantity: 1,
                    }),
                ]),
            });
        });
    });

    describe('countByTimeRange', () => {
        it('should count orders within a time range', async () => {
            const startDate = new Date('2023-01-01');
            const endDate = new Date('2023-01-31');

            mockOrderModel.count.mockResolvedValue(5);

            const result = await repository.countByTimeRange(
                startDate,
                endDate,
            );

            expect(mockOrderModel.count).toHaveBeenCalledWith({
                where: {
                    time: {
                        [Op.between]: [startDate, endDate],
                    },
                },
            });
            expect(result).toEqual(5);
        });
    });

    describe('getTotalPriceByTimeRange', () => {
        it('should sum order prices within a time range', async () => {
            const startDate = new Date('2023-01-01');
            const endDate = new Date('2023-01-31');

            mockOrderModel.sum.mockResolvedValue(500000);

            const result = await repository.getTotalPriceByTimeRange(
                startDate,
                endDate,
            );

            expect(mockOrderModel.sum).toHaveBeenCalledWith(
                'afterDiscountPrice',
                {
                    where: { time: { [Op.between]: [startDate, endDate] } },
                },
            );
            expect(result).toEqual(500000);
        });
    });

    describe('getHourlySalesData', () => {
        it('should get hourly sales data for a specific date', async () => {
            const date = new Date('2023-01-15');
            const mockOrders = [
                {
                    time: new Date('2023-01-15T10:30:00'),
                    afterDiscountPrice: 100000,
                },
                {
                    time: new Date('2023-01-15T14:15:00'),
                    afterDiscountPrice: 120000,
                },
                {
                    time: new Date('2023-01-15T14:45:00'),
                    afterDiscountPrice: 80000,
                },
            ];

            mockOrderModel.findAll.mockResolvedValue(mockOrders);

            const result = await repository.getHourlySalesData(date);

            expect(mockOrderModel.findAll).toHaveBeenCalledWith({
                attributes: ['time', 'afterDiscountPrice'],
                where: {
                    time: {
                        [Op.between]: [expect.any(Date), expect.any(Date)],
                    },
                },
                raw: true,
            });

            // Should have entries for hours 10 and 14 with the summed totals
            expect(result).toContainEqual({ hour: 10, totalPrice: 100000 });
            expect(result).toContainEqual({ hour: 14, totalPrice: 200000 });
            // Should have entries for all other hours with zero
            expect(result).toHaveLength(24);
        });

        it('should throw InternalServerErrorException on error', async () => {
            const date = new Date('2023-01-15');
            mockOrderModel.findAll.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(repository.getHourlySalesData(date)).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });
});
