import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dtos/create-order.dto';
import { PaymentMethod } from './enums/payment-method.enum';
import { JwtService } from '@nestjs/jwt';
import { ATAuthGuard } from '../auth/guards/at-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { MulterModule } from '@nestjs/platform-express';
import { AccessControlService } from '../ac/ac.service';

describe('OrdersController', () => {
    let controller: OrdersController;

    // Mock OrdersService
    const mockOrdersService = {
        checkoutOrder: jest.fn(),
        getAllOrders: jest.fn(),
        getOrderById: jest.fn(),
        checkPaymentStatus: jest.fn(),
    };

    // Mock data
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

    const mockOrdersList = [
        {
            id: '123',
            time: new Date(),
            employeeName: 'John Doe',
            paymentMethod: PaymentMethod.CASH,
            price: 47500,
        },
        {
            id: '456',
            time: new Date(),
            employeeName: 'Jane Smith',
            paymentMethod: PaymentMethod.QR,
            price: 60000,
        },
    ];

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [MulterModule.register()],
            controllers: [OrdersController],
            providers: [
                {
                    provide: OrdersService,
                    useValue: mockOrdersService,
                },
                {
                    provide: JwtService,
                    useValue: {
                        sign: jest.fn(),
                        verify: jest.fn(),
                    },
                },
                {
                    provide: Reflector,
                    useValue: {
                        get: jest.fn(),
                        getAllAndOverride: jest.fn(),
                    },
                },
                {
                    provide: AccessControlService,
                    useValue: {
                        checkAccess: jest.fn().mockReturnValue(true),
                    },
                },
            ],
        })
            .overrideGuard(ATAuthGuard)
            .useValue({ canActivate: jest.fn().mockReturnValue(true) })
            .overrideGuard(RolesGuard)
            .useValue({ canActivate: jest.fn().mockReturnValue(true) })
            .compile();

        controller = module.get<OrdersController>(OrdersController);

        // Reset all mocks
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getAllOrders', () => {
        it('should return all orders', async () => {
            mockOrdersService.getAllOrders.mockResolvedValue(mockOrdersList);

            const result = await controller.getAllOrders();

            expect(mockOrdersService.getAllOrders).toHaveBeenCalled();
            expect(result).toEqual(mockOrdersList);
        });
    });

    describe('getOrderById', () => {
        it('should return an order by id', async () => {
            mockOrdersService.getOrderById.mockResolvedValue(mockOrder);

            const result = await controller.getOrderById('123');

            expect(mockOrdersService.getOrderById).toHaveBeenCalledWith('123');
            expect(result).toEqual(mockOrder);
        });
    });

    describe('checkPaymentStatus', () => {
        it('should return the payment status for an order', async () => {
            const mockPaymentStatus = {
                status: 'paid',
                info: 'Payment completed',
            };
            mockOrdersService.checkPaymentStatus.mockResolvedValue(
                mockPaymentStatus,
            );

            const result = await controller.checkPaymentStatus('12345');

            expect(result).toEqual(mockPaymentStatus);
            expect(mockOrdersService.checkPaymentStatus).toHaveBeenCalledWith(
                '12345',
            );
        });
    });
});
