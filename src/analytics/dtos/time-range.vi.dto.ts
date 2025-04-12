import { IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class KhoangThoiGianDto {
    @ApiProperty({
        description: 'Ngày bắt đầu của khoảng thời gian (YYYY-MM-DD)',
        example: '2023-01-01',
    })
    @IsDateString()
    ngayBatDau: string;

    @ApiProperty({
        description: 'Ngày kết thúc của khoảng thời gian (YYYY-MM-DD)',
        example: '2023-12-31',
    })
    @IsDateString()
    ngayKetThuc: string;
}
