import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class CreateProductDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsString()
    image: string;

    @ApiProperty()
    @IsNumber()
    price: number;

    @ApiProperty()
    @IsBoolean()
    onStock: boolean;

    @ApiProperty()
    @IsString()
    categoryId: string;

    @ApiProperty()
    @IsString()
    materials: string[];

    @ApiProperty()
    @IsNumber()
    quantity: number[];
}
