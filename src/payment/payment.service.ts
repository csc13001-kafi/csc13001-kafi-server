import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from 'src/orders/orders.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PayOSService } from './payos/payos.service';

@Injectable()
export class PaymentService {
    constructor(
        @Inject(forwardRef(() => OrdersService))
        private readonly ordersService: OrdersService,
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
        private readonly payosService: PayOSService,
    ) {}

    async handlePayosWebhook(webhookData: any, headers: any) {
        try {
            console.log('Received PayOS webhook:', webhookData);
            console.log('Headers:', headers);

            // Extract relevant data
            const orderCode = webhookData.orderCode;
            const status = webhookData.status; // Expected values like 'SUCCEEDED', 'CANCELED', etc.

            // Log the webhook for debugging
            console.log(
                `Payment status for order ${orderCode} is now: ${status}`,
            );

            // Process the webhook based on status
            if (status === 'SUCCEEDED') {
                // Payment was successful - update the order
                await this.ordersService.completeOrder(
                    orderCode,
                    this.ordersService.orderCache.get(orderCode),
                );
                console.log(`Order ${orderCode} completed successfully`);
            } else if (status === 'CANCELED' || status === 'FAILED') {
                // Payment failed or was canceled
                throw new Error('Payment failed or was canceled');
            }
            // Always return success to acknowledge receipt
            return { success: true };
        } catch (error) {
            console.error('Error processing webhook:', error);
            // Still return 200 to prevent retries
            return { success: false, error: error.message };
        }
    }

    async confirmWebhook(body: { webhookUrl: string }) {
        try {
            const response = await firstValueFrom(
                this.httpService.post(
                    `${this.payosService.payosApiUrl}/confirm-webhook`,
                    {
                        webhookUrl: body.webhookUrl,
                    },
                    {
                        headers: {
                            'x-client-id': this.payosService.clientId,
                            'x-api-key': this.payosService.apiKey,
                            'Content-Type': 'application/json',
                        },
                    },
                ),
            );
            return response.data;
        } catch (error) {
            console.error('Error confirming webhook:', error);
            return { success: false, error: error.message };
        }
    }
}
