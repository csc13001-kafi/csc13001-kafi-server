import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsString } from 'class-validator';

export class CreateMaterialDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsNumber()
    originalStock: number;

    @ApiProperty()
    @IsString()
    unit: string;

    @ApiProperty()
    @IsDateString()
    expiredDate: Date;

    @ApiProperty()
    @IsNumber()
    price: number;
}
