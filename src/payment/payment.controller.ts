import { UseGuards } from '@nestjs/common';
import { Controller, Post, Body, Headers, HttpCode } from '@nestjs/common';
import { PaymentService } from './payment.service';
import {
    ApiBody,
    ApiResponse,
    ApiOperation,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { ATAuthGuard } from '../auth/guards/at-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
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

    @ApiBearerAuth('access-token')
    @ApiOperation({
        summary:
            'Confirm PayOS webhook. Only manager can call this endpoint [MANAGER]',
    })
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
    @UseGuards(ATAuthGuard)
    @Roles(Role.MANAGER)
    @HttpCode(200)
    async confirmWebhook(@Body() body: { webhookUrl: string }) {
        return this.paymentService.confirmWebhook(body);
    }
}
