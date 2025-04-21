import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { OrdersService } from '../orders/orders.service';
import { HttpService } from '@nestjs/axios';
import { PayOSService } from './payos/payos.service';
import { of, throwError } from 'rxjs';

describe('PaymentService', () => {
    let service: PaymentService;
    let mockOrdersService: Partial<OrdersService>;
    let mockHttpService: Partial<HttpService>;
    let mockPayosService: Partial<PayOSService>;

    // Mock data
    const mockOrderDetails = {
        numberOfProducts: 2,
        totalPrice: 50000,
        discountPercentage: 5,
        discount: 2500,
        afterDiscountPrice: 47500,
        employeeName: 'John Doe',
    };

    const mockOrderGeneralDto = {
        table: 'T1',
        id: '123',
        time: new Date().toISOString(),
        products: [],
        quantities: [1, 1],
        clientPhoneNumber: '1234567890',
        paymentMethod: 'QR',
    };

    const mockWebhookData = {
        success: true,
        data: {
            orderCode: 12345,
            amount: 47500,
            status: 'PAID',
        },
    };

    const mockHeaders = {
        'x-signature': 'test-signature',
    };

    beforeEach(async () => {
        // Create mock implementations
        mockOrdersService = {
            orderCache: new Map(),
            completeOrder: jest.fn().mockResolvedValue({ success: true }),
        };

        // Set up the cache with mock data
        mockOrdersService.orderCache.set('12345', {
            orderDetails: mockOrderDetails,
            orderGeneralDto: mockOrderGeneralDto,
        });

        mockHttpService = {
            post: jest.fn(),
        };

        mockPayosService = {
            payosApiUrl: 'https://api.payos.vn',
            clientId: 'test-client-id',
            apiKey: 'test-api-key',
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentService,
                {
                    provide: OrdersService,
                    useValue: mockOrdersService,
                },
                {
                    provide: HttpService,
                    useValue: mockHttpService,
                },
                {
                    provide: PayOSService,
                    useValue: mockPayosService,
                },
            ],
        }).compile();

        service = module.get<PaymentService>(PaymentService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('handlePayosWebhook', () => {
        it('should successfully process a payment webhook', async () => {
            // Spy on console methods
            jest.spyOn(console, 'log').mockImplementation(() => {});

            const result = await service.handlePayosWebhook(
                mockWebhookData,
                mockHeaders,
            );

            expect(result).toEqual({ success: true });
            expect(mockOrdersService.completeOrder).toHaveBeenCalledWith(
                mockOrderDetails,
                mockOrderGeneralDto,
            );
        });

        it('should handle missing orderCode in webhook data', async () => {
            // Spy on console methods
            jest.spyOn(console, 'log').mockImplementation(() => {});
            jest.spyOn(console, 'error').mockImplementation(() => {});

            const badWebhookData = {
                success: true,
                data: {},
            };

            const result = await service.handlePayosWebhook(
                badWebhookData,
                mockHeaders,
            );

            expect(result).toEqual({
                success: false,
                error: 'Order code not found',
            });
            expect(mockOrdersService.completeOrder).not.toHaveBeenCalled();
        });

        it('should handle failed payment status', async () => {
            // Spy on console methods
            jest.spyOn(console, 'log').mockImplementation(() => {});
            jest.spyOn(console, 'error').mockImplementation(() => {});

            const failedWebhookData = {
                success: false,
                data: {
                    orderCode: 12345,
                },
            };

            const result = await service.handlePayosWebhook(
                failedWebhookData,
                mockHeaders,
            );

            expect(result).toEqual({
                success: false,
                error: 'Payment failed or was canceled',
            });
            expect(mockOrdersService.completeOrder).not.toHaveBeenCalled();
        });

        it('should handle when order cache does not contain order details', async () => {
            // Spy on console methods
            jest.spyOn(console, 'log').mockImplementation(() => {});
            jest.spyOn(console, 'error').mockImplementation(() => {});

            // Create a new webhook data with a different order code
            const differentOrderCodeWebhook = {
                success: true,
                data: {
                    orderCode: 99999,
                },
            };

            const result = await service.handlePayosWebhook(
                differentOrderCodeWebhook,
                mockHeaders,
            );

            expect(result).toEqual({
                success: false,
                error: expect.any(String),
            });
            expect(mockOrdersService.completeOrder).not.toHaveBeenCalled();
        });
    });

    describe('confirmWebhook', () => {
        it('should successfully confirm a webhook URL', async () => {
            // Mock successful HTTP response
            const mockResponse = {
                data: {
                    success: true,
                    message: 'Webhook confirmed',
                },
            };

            (mockHttpService.post as jest.Mock).mockReturnValue(
                of(mockResponse),
            );

            const body = { webhookUrl: 'https://example.com/webhook' };
            const result = await service.confirmWebhook(body);

            expect(result).toEqual(mockResponse.data);
            expect(mockHttpService.post).toHaveBeenCalledWith(
                'https://api.payos.vn/confirm-webhook',
                { webhookUrl: 'https://example.com/webhook' },
                {
                    headers: {
                        'x-client-id': 'test-client-id',
                        'x-api-key': 'test-api-key',
                        'Content-Type': 'application/json',
                    },
                },
            );
        });

        it('should handle HTTP errors when confirming webhook', async () => {
            // Spy on console error
            jest.spyOn(console, 'error').mockImplementation(() => {});

            // Mock HTTP error
            const mockError = new Error('Network error');
            (mockHttpService.post as jest.Mock).mockReturnValue(
                throwError(() => mockError),
            );

            const body = { webhookUrl: 'https://example.com/webhook' };
            const result = await service.confirmWebhook(body);

            expect(result).toEqual({
                success: false,
                error: 'Network error',
            });
        });
    });
});
