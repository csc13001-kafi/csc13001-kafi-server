import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
@Injectable()
export class PayOSService {
    private readonly payosApiUrl: string;
    private readonly clientId: string;
    private readonly apiKey: string;
    private readonly checksumKey: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
    ) {
        this.payosApiUrl = this.configService.get<string>('PAYOS_API_URL');
        this.clientId = this.configService.get<string>('PAYOS_CLIENT_ID');
        this.apiKey = this.configService.get<string>('PAYOS_API_KEY');
        this.checksumKey = this.configService.get<string>('PAYOS_CHECKSUM_KEY');
    }

    async createPaymentLink(orderData: {
        orderCode: number;
        amount: number;
        description: string;
        phoneNumber: string;
        cancelUrl: string;
        returnUrl: string;
    }) {
        try {
            const signatureString = `amount=${orderData.amount}&cancelUrl=${orderData.cancelUrl}&description=${orderData.description}&orderCode=${orderData.orderCode}&returnUrl=${orderData.returnUrl}`;
            const signature = crypto
                .createHmac('sha256', this.checksumKey)
                .update(signatureString)
                .digest('hex');
            const response = await firstValueFrom(
                this.httpService.post(
                    `${this.payosApiUrl}/v2/payment-requests`,
                    {
                        orderCode: orderData.orderCode,
                        amount: orderData.amount,
                        description: orderData.description,
                        buyerPhone: orderData.phoneNumber,
                        cancelUrl: orderData.cancelUrl,
                        returnUrl: orderData.returnUrl,
                        signature: signature,
                        embedded: true,
                    },
                    {
                        headers: {
                            'x-client-id': this.clientId,
                            'x-api-key': this.apiKey,
                            'Content-Type': 'application/json',
                        },
                    },
                ),
            );

            console.log(response.data);
            const bin = response.data.data.bin;
            const accountNumber = response.data.data.accountNumber;
            const description = response.data.data.description;
            const amount = response.data.data.amount;
            const orderCode = response.data.data.orderCode;
            const qrLink = `https://img.vietqr.io/image/${bin}-${accountNumber}-vietqr_pro.jpg?addInfo=${description}&amount=${amount}&orderCode=${orderCode}`;
            return {
                paymentResponse: response.data,
                qrLink: qrLink,
            };
        } catch (error) {
            console.error('PayOS error:', error.message);
            if (error.response) {
                console.error('PayOS error details:', error.response.data);
            }
            throw new Error(`PayOS payment creation failed: ${error.message}`);
        }
    }

    async checkPaymentStatus(orderCode: number | string) {
        try {
            // Generate signature for the get payment API
            const signatureString = `orderCode=${orderCode}`;
            const signature = crypto
                .createHmac('sha256', this.checksumKey)
                .update(signatureString)
                .digest('hex');

            const response = await firstValueFrom(
                this.httpService.get(
                    `${this.payosApiUrl}/v2/payment-requests/${orderCode}`,
                    {
                        headers: {
                            'x-client-id': this.clientId,
                            'x-api-key': this.apiKey,
                            signature: signature,
                        },
                    },
                ),
            );

            console.log('Payment status response:', response.data);

            // Return a standardized payment status
            return {
                success: true,
                orderCode: orderCode,
                status: response.data?.data?.status || 'UNKNOWN',
                isCompleted: response.data?.data?.status === 'SUCCEEDED',
                amount: response.data?.data?.amount,
                paymentTime: response.data?.data?.paymentTime,
                rawData: response.data,
            };
        } catch (error) {
            console.error('Failed to check payment status:', error.message);
            if (error.response) {
                console.error('Error details:', error.response.data);
            }

            return {
                success: false,
                orderCode: orderCode,
                status: 'ERROR',
                isCompleted: false,
                error: error.message,
            };
        }
    }
}
