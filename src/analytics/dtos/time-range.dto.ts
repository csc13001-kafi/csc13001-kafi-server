import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TimeRangeOption {
    TODAY = 'today',
    THIS_WEEK = 'this_week',
    THIS_MONTH = 'this_month',
    THREE_MONTHS = 'three_months',
    SIX_MONTHS = 'six_months',
    THIS_YEAR = 'this_year',
}

export class TimeRangeDto {
    @ApiProperty({
        description: 'Time range option',
        enum: TimeRangeOption,
        example: TimeRangeOption.THIS_MONTH,
        default: TimeRangeOption.TODAY,
    })
    @IsEnum(TimeRangeOption)
    timeRange: TimeRangeOption = TimeRangeOption.TODAY;
}
