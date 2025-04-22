import { ApiProperty } from '@nestjs/swagger';
import { TimeRangeOption } from './time-range.dto';
import { IsEnum } from 'class-validator';

export class BusinessReportDto {
    @ApiProperty({
        description: 'Time range for the business report',
        enum: TimeRangeOption,
        example: TimeRangeOption.THIS_MONTH,
        default: TimeRangeOption.THIS_MONTH,
    })
    @IsEnum(TimeRangeOption)
    timeRange: TimeRangeOption = TimeRangeOption.THIS_MONTH;
}
