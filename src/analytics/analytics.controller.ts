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
import { TimeRangeDto } from './dtos/time-range.dto';
import { DashboardStatsDto } from './dtos/dashboard-stats.dto';
import { Logger } from '@nestjs/common';

@Controller('analytics')
@UseGuards(ATAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class AnalyticsController {
    private readonly logger = new Logger(AnalyticsController.name);

    constructor(private readonly analyticsService: AnalyticsService) {}

    @Get('dashboard')
    @ApiOperation({ summary: 'Get dashboard statistics [MANAGER]' })
    @ApiResponse({
        status: 200,
        description: 'Dashboard statistics retrieved successfully',
        type: DashboardStatsDto,
    })
    @Roles(Role.EMPLOYEE, Role.MANAGER)
    async getDashboardStats(@Query() timeRangeDto: TimeRangeDto) {
        try {
            const parsedDate = new Date(timeRangeDto.filterDate);

            if (isNaN(parsedDate.getTime())) {
                throw new Error('Invalid date format');
            }

            const startDate = new Date(parsedDate);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(parsedDate);
            endDate.setHours(23, 59, 59, 999);

            return this.analyticsService.getDashboardStats(startDate, endDate);
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
