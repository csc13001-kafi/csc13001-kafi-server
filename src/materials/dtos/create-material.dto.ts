import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNumber, IsString } from 'class-validator';

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
    @IsDate()
    expiredDate: Date;

    @ApiProperty()
    @IsNumber()
    price: number;
}
