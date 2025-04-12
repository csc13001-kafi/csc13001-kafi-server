import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
import { TimeRangeDto } from './dtos/time-range.dto';
import { DashboardStatsDto } from './dtos/dashboard-stats.dto';

@Controller('analytics')
@UseGuards(ATAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) {}

    @Get('dashboard')
    @ApiOperation({ summary: 'Get dashboard statistics [MANAGER]' })
    @ApiResponse({
        status: 200,
        description: 'Dashboard statistics retrieved successfully',
        type: DashboardStatsDto,
    })
    @Roles(Role.MANAGER)
    async getDashboardStats(@Query() timeRangeDto: TimeRangeDto) {
        const startDate = new Date(timeRangeDto.startDate);
        const endDate = new Date(timeRangeDto.endDate);

        // Ensure endDate is set to end of day
        endDate.setHours(23, 59, 59, 999);

        return this.analyticsService.getDashboardStats(startDate, endDate);
    }

    @Get('orders/count')
    @ApiOperation({
        summary: 'Get orders count by time range [MANAGER, EMPLOYEE]',
    })
    @ApiResponse({
        status: 200,
        description: 'Orders count retrieved successfully',
    })
    @Roles(Role.MANAGER, Role.EMPLOYEE)
    async getOrdersCount(@Query() timeRangeDto: TimeRangeDto) {
        const startDate = new Date(timeRangeDto.startDate);
        const endDate = new Date(timeRangeDto.endDate);

        // Ensure endDate is set to end of day
        endDate.setHours(23, 59, 59, 999);

        const count = await this.analyticsService.getOrdersCountByTimeRange(
            startDate,
            endDate,
        );
        return { count, timeRange: { startDate, endDate } };
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

    @Get('categories/count')
    @ApiOperation({ summary: 'Get categories count [MANAGER, EMPLOYEE]' })
    @ApiResponse({
        status: 200,
        description: 'Categories count retrieved successfully',
    })
    @Roles(Role.MANAGER, Role.EMPLOYEE)
    async getCategoriesCount() {
        const count = await this.analyticsService.getCategoriesCount();
        return { count };
    }

    @Get('products/count')
    @ApiOperation({ summary: 'Get products count [MANAGER, EMPLOYEE]' })
    @ApiResponse({
        status: 200,
        description: 'Products count retrieved successfully',
    })
    @Roles(Role.MANAGER, Role.EMPLOYEE)
    async getProductsCount() {
        const count = await this.analyticsService.getProductsCount();
        return { count };
    }
}
