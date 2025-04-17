import { IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TimeRangeDto {
    @ApiProperty({
        description: 'Start date for the time range (YYYY-MM-DD)',
        example: '2023-01-01',
    })
    @IsDateString()
    filterDate: string;
}
