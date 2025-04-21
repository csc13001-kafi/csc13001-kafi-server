import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksController } from './payment.controller';
import { PaymentService } from './payment.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ATAuthGuard } from '../auth/guards/at-auth.guard';
import { Reflector } from '@nestjs/core';

describe('WebhooksController', () => {
    let controller: WebhooksController;
    let mockPaymentService: Partial<PaymentService>;

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
        mockPaymentService = {
            handlePayosWebhook: jest.fn().mockResolvedValue({ success: true }),
            confirmWebhook: jest.fn().mockResolvedValue({
                success: true,
                message: 'Webhook confirmed',
            }),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [WebhooksController],
            providers: [
                {
                    provide: PaymentService,
                    useValue: mockPaymentService,
                },
                {
                    provide: Reflector,
                    useValue: {
                        get: jest.fn(),
                        getAllAndOverride: jest
                            .fn()
                            .mockReturnValue(['MANAGER']),
                    },
                },
            ],
        })
            .overrideGuard(ATAuthGuard)
            .useValue({ canActivate: jest.fn().mockReturnValue(true) })
            .overrideGuard(RolesGuard)
            .useValue({ canActivate: jest.fn().mockReturnValue(true) })
            .compile();

        controller = module.get<WebhooksController>(WebhooksController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('handlePayosWebhook', () => {
        it('should call the service with webhook data and headers', async () => {
            const result = await controller.handlePayosWebhook(
                mockWebhookData,
                mockHeaders,
            );

            expect(result).toEqual({ success: true });
            expect(mockPaymentService.handlePayosWebhook).toHaveBeenCalledWith(
                mockWebhookData,
                mockHeaders,
            );
        });

        it('should pass through any errors from the service', async () => {
            const errorResponse = {
                success: false,
                error: 'Payment processing failed',
            };

            (
                mockPaymentService.handlePayosWebhook as jest.Mock
            ).mockResolvedValueOnce(errorResponse);

            const result = await controller.handlePayosWebhook(
                mockWebhookData,
                mockHeaders,
            );

            expect(result).toEqual(errorResponse);
        });
    });

    describe('confirmWebhook', () => {
        it('should call the service with webhook URL data', async () => {
            const mockBody = { webhookUrl: 'https://example.com/webhook' };

            const result = await controller.confirmWebhook(mockBody);

            expect(result).toEqual({
                success: true,
                message: 'Webhook confirmed',
            });
            expect(mockPaymentService.confirmWebhook).toHaveBeenCalledWith(
                mockBody,
            );
        });

        it('should pass through any errors from the service', async () => {
            const mockBody = { webhookUrl: 'https://example.com/webhook' };
            const errorResponse = {
                success: false,
                error: 'Failed to confirm webhook',
            };

            (
                mockPaymentService.confirmWebhook as jest.Mock
            ).mockResolvedValueOnce(errorResponse);

            const result = await controller.confirmWebhook(mockBody);

            expect(result).toEqual(errorResponse);
        });
    });
});
