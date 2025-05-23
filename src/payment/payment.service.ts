import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PayOSService } from './payos/payos.service';

@Injectable()
export class PaymentService {
    constructor(
        @Inject(forwardRef(() => OrdersService))
        private readonly ordersService: OrdersService,
        private readonly httpService: HttpService,
        private readonly payosService: PayOSService,
    ) {}

    async handlePayosWebhook(webhookData: any, headers: any) {
        try {
            console.log('Received PayOS webhook:', webhookData);
            console.log('Headers:', headers);

            const orderCode: number = webhookData.data.orderCode;
            if (!orderCode) {
                throw new Error('Order code not found');
            }
            const status: boolean = webhookData.success;

            console.log(
                `Payment status for order ${orderCode} is now: ${status}`,
            );

            if (status === true) {
                const { orderDetails, orderGeneralDto } =
                    this.ordersService.orderCache.get(orderCode.toString());
                await this.ordersService.completeOrder(
                    orderDetails,
                    orderGeneralDto,
                );
                console.log(`Order ${orderCode} completed successfully`);
            } else if (status === false) {
                // Payment failed or was canceled
                throw new Error('Payment failed or was canceled');
            }
            return { success: true };
        } catch (error) {
            console.error('Error processing webhook:', error);
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
