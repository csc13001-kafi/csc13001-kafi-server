import {
    Controller,
    Post,
    Request,
    UseGuards,
    Get,
    Param,
    UseInterceptors,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { ATAuthGuard } from '../auth/guards/at-auth.guard';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { CreateOrderDto } from './dtos/create-order.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { ParseFormData } from './decorators/parse-form-data.decorator';

@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @ApiOperation({ summary: 'Checkout an order [EMPLOYEE, MANAGER]' })
    @ApiBearerAuth('access-token')
    @Post('order')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                table: {
                    type: 'string',
                    example: '1',
                },
                id: {
                    type: 'string',
                    example: 'a07781d8-d471-4e80-b251-493beedafaae',
                },
                time: {
                    type: 'string',
                    format: 'date-time',
                    example: '2024-04-07T15:30:00Z',
                },
                products: {
                    type: 'array',
                    items: {
                        type: 'string',
                    },
                },
                quantities: {
                    type: 'array',
                    items: {
                        type: 'number',
                    },
                },
                clientPhoneNumber: {
                    type: 'string',
                    example: '0123456789',
                },
                paymentMethod: {
                    type: 'string',
                    enum: ['Cash', 'QR'],
                    example: 'QR',
                },
            },
            required: [
                'table',
                'id',
                'time',
                'products',
                'quantities',
                'clientPhoneNumber',
                'paymentMethod',
            ],
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Order checked out successfully',
    })
    @UseGuards(ATAuthGuard)
    @Roles(Role.EMPLOYEE, Role.MANAGER)
    async checkoutOrder(
        @Request() req: any,
        @ParseFormData(CreateOrderDto) createOrderDto: CreateOrderDto,
    ) {
        return this.ordersService.checkoutOrder(req.user.id, createOrderDto);
    }

    @ApiOperation({ summary: 'Get all orders [EMPLOYEE, MANAGER]' })
    @ApiBearerAuth('access-token')
    @Get()
    @UseGuards(ATAuthGuard)
    @Roles(Role.MANAGER, Role.EMPLOYEE)
    async getAllOrders() {
        return this.ordersService.getAllOrders();
    }

    @ApiOperation({ summary: 'Get order by id [MANAGER]' })
    @ApiBearerAuth('access-token')
    @Get(':id')
    @UseGuards(ATAuthGuard)
    @Roles(Role.MANAGER)
    async getOrderById(@Param('id') id: string) {
        return this.ordersService.getOrderById(id);
    }

    @ApiOperation({ summary: 'Check payment status [EMPLOYEE, MANAGER]' })
    @ApiBearerAuth('access-token')
    @Get('payment-status/:orderCode')
    @UseGuards(ATAuthGuard)
    @Roles(Role.EMPLOYEE, Role.MANAGER)
    @ApiResponse({
        status: 200,
        description: 'Payment status retrieved successfully',
    })
    async checkPaymentStatus(@Param('orderCode') orderCode: string) {
        return this.ordersService.checkPaymentStatus(orderCode);
    }
}
