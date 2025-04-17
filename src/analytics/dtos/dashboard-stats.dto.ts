import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class TimeRangeResponseDto {
    @ApiProperty({
        description: 'Start date of the queried time range',
        example: '2023-01-01T00:00:00.000+0700',
    })
    @Transform(({ value }) => {
        if (value instanceof Date) {
            // Format date with local timezone
            return value.toLocaleString('en-US', {
                timeZone: 'Asia/Ho_Chi_Minh',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
            });
        }
        return value;
    })
    startDate: Date;

    @ApiProperty({
        description: 'End date of the queried time range',
        example: '2023-12-31T23:59:59.999+0700',
    })
    @Transform(({ value }) => {
        if (value instanceof Date) {
            // Format date with local timezone
            return value.toLocaleString('en-US', {
                timeZone: 'Asia/Ho_Chi_Minh',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
            });
        }
        return value;
    })
    endDate: Date;
}

export class DashboardStatsDto {
    @ApiProperty({
        description: 'Number of orders within the specified time range',
        example: 250,
    })
    ordersCount: number;

    @ApiProperty({
        description: 'Number of categories',
        example: 10,
    })
    categoriesCount: number;

    @ApiProperty({
        description: 'Number of users with role EMPLOYEE',
        example: 15,
    })
    employeesCount: number;

    @ApiProperty({
        description: 'Number of users with role MANAGER',
        example: 3,
    })
    managersCount: number;

    @ApiProperty({
        description: 'Number of products',
        example: 75,
    })
    productsCount: number;

    @ApiProperty({
        description: 'Time range of the query',
        type: TimeRangeResponseDto,
    })
    timeRange: TimeRangeResponseDto;
}
