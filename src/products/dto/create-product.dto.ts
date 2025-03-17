import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProductDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    image: string;

    @ApiProperty()
    @IsNumber()
    price: number;

    @ApiProperty()
    @IsBoolean()
    onStock: boolean;
}
