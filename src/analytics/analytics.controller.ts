import {
    Controller,
    Get,
    Query,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import {
    ApiOperation,
    ApiQuery,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '../auth/enums/roles.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { ATAuthGuard } from '../auth/guards/at-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TimeRangeDto, TimeRangeOption } from './dtos/time-range.dto';
import { DashboardStatsDto } from './dtos/dashboard-stats.dto';
import { Logger } from '@nestjs/common';

@Controller('analytics')
@UseGuards(ATAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class AnalyticsController {
    private readonly logger = new Logger(AnalyticsController.name);

    constructor(private readonly analyticsService: AnalyticsService) {}

    @Get('dashboard')
    @ApiOperation({ summary: 'Get dashboard statistics [EMPLOYEE,MANAGER]' })
    @ApiResponse({
        status: 200,
        description: 'Dashboard statistics retrieved successfully',
        type: DashboardStatsDto,
    })
    @Roles(Role.EMPLOYEE, Role.MANAGER)
    async getDashboardStats(@Query() timeRangeDto: TimeRangeDto) {
        try {
            return await this.analyticsService.getDashboardStatsByTimeRange(
                timeRangeDto.timeRange,
            );
        } catch (error) {
            throw new BadRequestException(
                'Failed to get dashboard statistics: ' + error.message,
            );
        }
    }

    @Get('users/count')
    @ApiOperation({ summary: 'Get users count by role [MANAGER]' })
    @ApiQuery({
        name: 'role',
        required: false,
        enum: Role,
        description: 'Filter by role',
    })
    @ApiResponse({
        status: 200,
        description: 'Users count retrieved successfully',
    })
    @Roles(Role.MANAGER)
    async getUsersCount(@Query('role') role?: Role) {
        if (role) {
            const count = await this.analyticsService.getUsersCountByRole(role);
            return { count, role };
        }

        const [employeesCount, managersCount] = await Promise.all([
            this.analyticsService.getUsersCountByRole(Role.EMPLOYEE),
            this.analyticsService.getUsersCountByRole(Role.MANAGER),
        ]);

        return {
            employeesCount,
            managersCount,
            total: employeesCount + managersCount,
        };
    }

    @Get('orders/hours')
    @ApiOperation({
        summary:
            'Get hourly sales data for a specific date [MANAGER, EMPLOYEE]',
    })
    @ApiQuery({
        name: 'date',
        required: true,
        type: String,
        description: 'Date in YYYY-MM-DD format',
        example: '2024-04-15',
    })
    @ApiResponse({
        status: 200,
        description: 'Hourly sales data retrieved successfully',
    })
    @Roles(Role.MANAGER, Role.EMPLOYEE)
    async getHourlySalesData(@Query('date') dateStr: string) {
        try {
            if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                throw new Error(
                    'Invalid date format. Please use YYYY-MM-DD format.',
                );
            }

            return this.analyticsService.getHourlySalesData(dateStr);
        } catch (error) {
            throw new BadRequestException(
                'Failed to get hourly sales data: ' + error.message,
            );
        }
    }

    @Get('products/top-selling')
    @ApiOperation({
        summary: 'Get top selling products by quantity [MANAGER, EMPLOYEE]',
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Number of products to return (default: 10)',
        example: 10,
    })
    @ApiQuery({
        name: 'startDate',
        required: false,
        type: String,
        description: 'Start date in YYYY-MM-DD format',
        example: '2024-01-01',
    })
    @ApiQuery({
        name: 'endDate',
        required: false,
        type: String,
        description: 'End date in YYYY-MM-DD format',
        example: '2024-12-31',
    })
    @ApiResponse({
        status: 200,
        description: 'Top selling products retrieved successfully',
    })
    @Roles(Role.MANAGER, Role.EMPLOYEE)
    async getTopSellingProducts(
        @Query('limit') limitStr?: string,
        @Query('startDate') startDateStr?: string,
        @Query('endDate') endDateStr?: string,
    ) {
        try {
            // Parse and validate limit parameter
            let limit = 10; // Default limit
            if (limitStr) {
                limit = parseInt(limitStr, 10);
                if (isNaN(limit) || limit <= 0) {
                    throw new Error('Limit must be a positive number');
                }
                // Cap at a reasonable max limit
                if (limit > 100) {
                    limit = 100;
                }
            }

            // Validate date parameters
            if (
                (startDateStr && !endDateStr) ||
                (!startDateStr && endDateStr)
            ) {
                throw new Error(
                    'Both startDate and endDate must be provided together',
                );
            }

            // If dates are provided, validate format
            if (startDateStr && endDateStr) {
                if (
                    !/^\d{4}-\d{2}-\d{2}$/.test(startDateStr) ||
                    !/^\d{4}-\d{2}-\d{2}$/.test(endDateStr)
                ) {
                    throw new Error(
                        'Invalid date format. Please use YYYY-MM-DD format.',
                    );
                }
            }

            return this.analyticsService.getTopSellingProducts(
                limit,
                startDateStr,
                endDateStr,
            );
        } catch (error) {
            this.logger.error(
                `Error getting top selling products: ${error.message}`,
            );
            throw new BadRequestException(
                'Failed to get top selling products: ' + error.message,
            );
        }
    }

    @Get('orders/months')
    @ApiOperation({
        summary:
            'Get order counts by day and payment method for a specific month [MANAGER, EMPLOYEE]',
    })
    @ApiQuery({
        name: 'month',
        required: true,
        type: Number,
        description: 'Month number (1-12)',
        example: 4,
    })
    @ApiResponse({
        status: 200,
        description:
            'Order counts by day and payment method retrieved successfully',
    })
    @Roles(Role.MANAGER, Role.EMPLOYEE)
    async getOrdersByDayAndPaymentMethod(@Query('month') monthStr: string) {
        try {
            const month = parseInt(monthStr, 10);

            if (isNaN(month) || month < 1 || month > 12) {
                throw new Error('Month must be a number between 1 and 12');
            }

            return this.analyticsService.getOrdersByDayAndPaymentMethod(month);
        } catch (error) {
            this.logger.error(
                `Error getting orders by day and payment method: ${error.message}`,
            );
            throw new BadRequestException(
                'Failed to get orders by day and payment method: ' +
                    error.message,
            );
        }
    }

    @Get('materials/low-stock')
    @ApiOperation({
        summary: 'Get materials with lowest stock [MANAGER, EMPLOYEE]',
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Number of materials to return (default: 3)',
        example: 3,
    })
    @ApiResponse({
        status: 200,
        description: 'Low stock materials retrieved successfully',
    })
    @Roles(Role.MANAGER, Role.EMPLOYEE)
    async getLowStockMaterials(@Query('limit') limitStr?: string) {
        try {
            // Parse and validate limit parameter
            let limit = 3; // Default limit
            if (limitStr) {
                limit = parseInt(limitStr, 10);
                if (isNaN(limit) || limit <= 0) {
                    throw new Error('Limit must be a positive number');
                }
                // Cap at a reasonable max limit
                if (limit > 20) {
                    limit = 20;
                }
            }

            return this.analyticsService.getLowStockMaterials(limit);
        } catch (error) {
            this.logger.error(
                `Error getting low stock materials: ${error.message}`,
            );
            throw new BadRequestException(
                'Failed to get low stock materials: ' + error.message,
            );
        }
    }
}
