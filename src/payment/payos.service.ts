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
        orderCode: string;
        amount: number;
        description: string;
        cancelUrl: string;
        returnUrl: string;
    }) {
        try {
            const signature = this.generateSignature(
                orderData.orderCode,
                orderData.amount.toString(),
            );
            console.log(signature);
            const response = await firstValueFrom(
                this.httpService.post(
                    `${this.payosApiUrl}/v2/payment-requests`,
                    {
                        orderCode: orderData.orderCode,
                        amount: orderData.amount,
                        description: orderData.description,
                        cancelUrl: orderData.cancelUrl,
                        returnUrl: orderData.returnUrl,
                        signature: signature,
                    },
                    {
                        headers: {
                            'x-client-id': this.clientId,
                            'x-api-key': this.apiKey,
                        },
                    },
                ),
            );
            console.log(response.data);
            return response.data;
        } catch (error) {
            throw new Error(`PayOS payment creation failed: ${error.message}`);
        }
    }

    private generateSignature(orderCode: string, amount: string): string {
        const data = `${orderCode}|${amount}`;
        return crypto
            .createHmac('sha256', this.checksumKey)
            .update(data)
            .digest('hex');
    }
}
