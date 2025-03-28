import {
    Controller,
    Post,
    Body,
    Request,
    UseGuards,
    Get,
    Param,
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

@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @ApiOperation({ summary: 'Checkout an order [EMPLOYEE, MANAGER]' })
    @ApiBearerAuth('access-token')
    @Post('order')
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                table: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                time: {
                    type: 'string',
                    format: 'date-time',
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
                },
                paymentMethod: {
                    type: 'string',
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
        @Body() createOrderDto: CreateOrderDto,
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
}
