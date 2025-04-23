import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { ProductsRepository } from '../products/products.repository';
import { UsersRepository } from '../users/users.repository';
import { PayOSService } from '../payment/payos/payos.service';
import { PaymentService } from '../payment/payment.service';
import { CreateOrderDto } from './dtos/create-order.dto';
import { PaymentMethod } from './enums/payment-method.enum';
import { InternalServerErrorException } from '@nestjs/common';
import { MaterialsRepository } from '../materials/materials.repository';

describe('OrdersService', () => {
    let service: OrdersService;

    // Mock repositories and services
    const mockOrdersRepository = {
        create: jest.fn(),
        findAll: jest.fn(),
        findById: jest.fn(),
        countByTimeRange: jest.fn(),
        getTotalPriceByTimeRange: jest.fn(),
        getHourlySalesData: jest.fn(),
    };

    const mockProductsRepository = {
        findById: jest.fn(),
        findAll: jest.fn(),
    };

    const mockUsersRepository = {
        findOneById: jest.fn(),
        findOneByPhoneNumber: jest.fn(),
        updateLoyaltyPoints: jest.fn(),
    };

    const mockPayosService = {
        createPaymentLink: jest.fn(),
        checkPaymentStatus: jest.fn(),
    };

    const mockPaymentService = {
        processPayment: jest.fn(),
    };

    // Add mock for MaterialsRepository
    const mockMaterialsRepository = {
        findAll: jest.fn(),
        findById: jest.fn(),
        findByName: jest.fn(),
        findLowestStock: jest.fn(),
        updateMaterialStock: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    // Mock data
    const mockUser = {
        id: 'user1',
        username: 'John Doe',
        phone: '1234567890',
        loyaltyPoints: 1500,
    };

    const mockProduct1 = {
        id: 'product1',
        name: 'Coffee',
        price: 25000,
        dataValues: {
            id: 'product1',
            name: 'Coffee',
            price: 25000,
        },
    };

    const mockProduct2 = {
        id: 'product2',
        name: 'Tea',
        price: 25000,
        dataValues: {
            id: 'product2',
            name: 'Tea',
            price: 25000,
        },
    };

    const mockOrder = {
        id: '123',
        table: 'T1',
        employeeName: 'John Doe',
        clientPhoneNumber: '1234567890',
        time: new Date(),
        numberOfProducts: 2,
        totalPrice: 50000,
        discountPercentage: 5,
        discount: 2500,
        afterDiscountPrice: 47500,
        paymentMethod: PaymentMethod.CASH,
        orderDetails: [
            {
                productName: 'Coffee',
                price: 25000,
                quantity: 1,
            },
            {
                productName: 'Tea',
                price: 25000,
                quantity: 1,
            },
        ],
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrdersService,
                {
                    provide: MaterialsRepository,
                    useValue: mockMaterialsRepository,
                },
                {
                    provide: OrdersRepository,
                    useValue: mockOrdersRepository,
                },
                {
                    provide: ProductsRepository,
                    useValue: mockProductsRepository,
                },
                {
                    provide: UsersRepository,
                    useValue: mockUsersRepository,
                },
                {
                    provide: PayOSService,
                    useValue: mockPayosService,
                },
                {
                    provide: PaymentService,
                    useValue: mockPaymentService,
                },
            ],
        }).compile();

        service = module.get<OrdersService>(OrdersService);

        // Reset all mocks
        jest.clearAllMocks();

        // Reset the orderCache
        service.orderCache = new Map();

        // Mock Math.random to return a consistent value for orderCode
        jest.spyOn(Math, 'random').mockReturnValue(0.12345);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('calculateDiscount', () => {
        it('should calculate platinum discount (15%) for loyalty points >= 5000', () => {
            const result = service.calculateDiscount(5000, 100000);
            expect(result).toEqual({
                afterDiscountPrice: 85000,
                discountPercentage: 15,
            });
        });

        it('should calculate gold discount (10%) for loyalty points >= 2000', () => {
            const result = service.calculateDiscount(2000, 100000);
            expect(result).toEqual({
                afterDiscountPrice: 90000,
                discountPercentage: 10,
            });
        });

        it('should calculate silver discount (5%) for loyalty points >= 1000', () => {
            const result = service.calculateDiscount(1000, 100000);
            expect(result).toEqual({
                afterDiscountPrice: 95000,
                discountPercentage: 5,
            });
        });

        it('should apply no discount for loyalty points < 1000', () => {
            const result = service.calculateDiscount(500, 100000);
            expect(result).toEqual({
                afterDiscountPrice: 100000,
                discountPercentage: 0,
            });
        });
    });

    describe('checkoutOrder', () => {
        it('should create a cash order successfully with discount for existing client', async () => {
            const orderDto: CreateOrderDto = {
                table: 'T1',
                id: '123',
                time: new Date().toISOString(),
                products: ['product1', 'product2'],
                quantities: [1, 1],
                clientPhoneNumber: '1234567890',
                paymentMethod: PaymentMethod.CASH,
            };

            // Set up mocks
            mockProductsRepository.findById
                .mockResolvedValueOnce(mockProduct1)
                .mockResolvedValueOnce(mockProduct2);
            mockUsersRepository.findOneByPhoneNumber.mockResolvedValue(
                mockUser,
            );
            mockUsersRepository.findOneById.mockResolvedValue(mockUser);
            mockOrdersRepository.create.mockResolvedValue(mockOrder);

            // Set up to mock Promise.all for products
            mockProductsRepository.findById
                .mockResolvedValueOnce(mockProduct1)
                .mockResolvedValueOnce(mockProduct2);

            const result = await service.checkoutOrder('user1', orderDto);

            // Verify calculations were done correctly
            expect(mockProductsRepository.findById).toHaveBeenCalledTimes(4); // twice for price calculation, twice for order creation
            expect(
                mockUsersRepository.findOneByPhoneNumber,
            ).toHaveBeenCalledWith('1234567890');
            expect(mockUsersRepository.findOneById).toHaveBeenCalledWith(
                'user1',
            );

            // Verify loyalty points update
            expect(
                mockUsersRepository.updateLoyaltyPoints,
            ).toHaveBeenCalledWith(
                '1234567890',
                50, // totalPrice / 1000
            );

            // Verify order creation
            expect(mockOrdersRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    table: 'T1',
                    id: '123',
                    clientPhoneNumber: '1234567890',
                    paymentMethod: PaymentMethod.CASH,
                }),
                expect.objectContaining({
                    numberOfProducts: 2,
                    totalPrice: 50000,
                    discountPercentage: 5,
                    discount: 2500,
                    afterDiscountPrice: 47500,
                    employeeName: 'John Doe',
                }),
            );

            expect(result).toEqual({
                discountPercentage: 5,
                discount: 2500,
                message: 'Order created successfully',
            });
        });

        it('should create a QR payment link successfully', async () => {
            const orderDto: CreateOrderDto = {
                table: 'T1',
                id: '123',
                time: new Date().toISOString(),
                products: ['product1', 'product2'],
                quantities: [1, 1],
                clientPhoneNumber: '1234567890',
                paymentMethod: PaymentMethod.QR,
            };

            // Set up mocks
            mockProductsRepository.findById
                .mockResolvedValueOnce(mockProduct1)
                .mockResolvedValueOnce(mockProduct2);
            mockUsersRepository.findOneByPhoneNumber.mockResolvedValue(
                mockUser,
            );
            mockUsersRepository.findOneById.mockResolvedValue(mockUser);

            // Mock the PayOS response
            mockPayosService.createPaymentLink.mockResolvedValue({
                paymentResponse: {
                    data: {
                        checkoutUrl: 'https://example.com/payment',
                    },
                },
                qrLink: 'https://example.com/qr',
            });

            // Set up to mock Promise.all for products
            mockProductsRepository.findById
                .mockResolvedValueOnce(mockProduct1)
                .mockResolvedValueOnce(mockProduct2);

            const result = await service.checkoutOrder('user1', orderDto);

            // Verify calculations were done correctly
            expect(mockProductsRepository.findById).toHaveBeenCalledTimes(4);

            // Verify payment link creation
            expect(mockPayosService.createPaymentLink).toHaveBeenCalledWith({
                orderCode: 12345, // from Math.random mock
                amount: 47500, // after 5% discount
                description: 'Payment for order 12345',
                phoneNumber: '1234567890',
                cancelUrl: 'https://kafi-app.com/cancel',
                returnUrl: 'https://kafi-app.com/success',
            });

            // Verify data was cached
            expect(service.orderCache.has('12345')).toBeTruthy();
            const cachedData = service.orderCache.get('12345');
            expect(cachedData).toBeDefined();

            expect(result).toEqual({
                discountPercentage: 5,
                discount: 2500,
                paymentLink: 'https://example.com/payment',
                qrLink: 'https://example.com/qr',
                orderCode: 12345,
                message:
                    'Payment pending. Scan QR code to pay and check payment status.',
            });
        });

        it('should throw InternalServerErrorException if QR payment creation fails', async () => {
            const orderDto: CreateOrderDto = {
                table: 'T1',
                id: '123',
                time: new Date().toISOString(),
                products: ['product1', 'product2'],
                quantities: [1, 1],
                clientPhoneNumber: '1234567890',
                paymentMethod: PaymentMethod.QR,
            };

            // Set up mocks
            mockProductsRepository.findById
                .mockResolvedValueOnce(mockProduct1)
                .mockResolvedValueOnce(mockProduct2);
            mockUsersRepository.findOneByPhoneNumber.mockResolvedValue(
                mockUser,
            );
            mockUsersRepository.findOneById.mockResolvedValue(mockUser);

            // Mock PayOS failure
            mockPayosService.createPaymentLink.mockResolvedValue(null);

            await expect(
                service.checkoutOrder('user1', orderDto),
            ).rejects.toThrow(InternalServerErrorException);
        });
    });

    describe('getAllOrders', () => {
        it('should return all orders', async () => {
            const mockOrders = [mockOrder];
            mockOrdersRepository.findAll.mockResolvedValue(mockOrders);

            const result = await service.getAllOrders();

            expect(mockOrdersRepository.findAll).toHaveBeenCalled();
            expect(result).toEqual(mockOrders);
        });
    });

    describe('getOrderById', () => {
        it('should return an order by id', async () => {
            mockProductsRepository.findAll.mockResolvedValue([
                mockProduct1,
                mockProduct2,
            ]);
            mockOrdersRepository.findById.mockResolvedValue(mockOrder);

            const result = await service.getOrderById('123');

            expect(mockProductsRepository.findAll).toHaveBeenCalled();
            expect(mockOrdersRepository.findById).toHaveBeenCalledWith('123', [
                mockProduct1,
                mockProduct2,
            ]);
            expect(result).toEqual(mockOrder);
        });
    });

    describe('cacheOrderData', () => {
        it('should store order data in the cache', () => {
            const orderCode = '12345';
            const orderData = { test: 'data' };

            // Use the private method via direct call
            service['cacheOrderData'](orderCode, orderData);

            expect(service.orderCache.has(orderCode)).toBeTruthy();
            expect(service.orderCache.get(orderCode)).toEqual(orderData);
        });
    });
});
