import { Controller, Post, Body, Headers, HttpCode } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { ApiOperation } from '@nestjs/swagger';

@Controller('webhooks')
export class WebhooksController {
    constructor(private readonly paymentService: PaymentService) {}

    @ApiOperation({ summary: 'Handle PayOS webhook' })
    @ApiResponse({ status: 200, description: 'Webhook received' })
    @Post('payos')
    @HttpCode(200)
    async handlePayosWebhook(
        @Body() webhookData: any,
        @Headers() headers: any,
    ) {
        return this.paymentService.handlePayosWebhook(webhookData, headers);
    }

    @ApiOperation({ summary: 'Confirm PayOS webhook' })
    @ApiResponse({ status: 200, description: 'Webhook confirmed' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                webhookUrl: { type: 'string' },
            },
        },
    })
    @Post('payos/confirm-webhook')
    @HttpCode(200)
    async confirmWebhook(@Body() body: { webhookUrl: string }) {
        return this.paymentService.confirmWebhook(body);
    }
}
