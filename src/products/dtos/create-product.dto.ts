import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateProductDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    image?: string;

    @ApiProperty()
    @IsNumber()
    @Type(() => Number)
    @Transform(({ value }) => {
        if (value === '') return undefined;
        return typeof value === 'string' ? parseFloat(value) : value;
    })
    price: number;

    @ApiProperty()
    @IsBoolean()
    @Transform(({ value }) => {
        if (value === '') return undefined;
        if (typeof value === 'string') {
            const lowercaseValue = value.toLowerCase();
            return lowercaseValue === 'true' || lowercaseValue === '1';
        }
        return value;
    })
    onStock: boolean;

    @ApiProperty()
    @IsString()
    categoryId: string;

    @ApiProperty({ isArray: true, type: String })
    @IsString({ each: true })
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            return value
                .split(',')
                .map((v) => v.trim())
                .filter((v) => v !== '');
        }
        return value;
    })
    materials: string[];

    @ApiProperty({ isArray: true, type: Number })
    @IsNumber({}, { each: true })
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            return value
                .split(',')
                .map((v) => v.trim())
                .filter((v) => v !== '')
                .map((v) => parseFloat(v));
        }
        if (Array.isArray(value)) {
            return value.map((v) =>
                typeof v === 'string' ? parseFloat(v) : v,
            );
        }
        return value;
    })
    quantity: number[];
}
