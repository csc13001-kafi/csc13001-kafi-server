import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class UpdateProductDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @Transform(
        ({ value }) =>
            typeof value === 'string' && value.trim() === ''
                ? undefined
                : value,
        { toClassOnly: true },
    )
    name?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @Transform(
        ({ value }) =>
            typeof value === 'string' && value.trim() === ''
                ? undefined
                : value,
        { toClassOnly: true },
    )
    image?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Transform(
        ({ value }) => {
            // If price is an empty string or the default marker (-1), transform to undefined.
            if (value === '' || value === -1 || value === '-1') {
                return undefined;
            }
            return value;
        },
        { toClassOnly: true },
    )
    price?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    @Transform(
        ({ value }) => {
            // If onStock is an empty string or default marker (-1), transform to undefined.
            if (value === '' || value === -1 || value === '-1')
                return undefined;
            if (typeof value === 'string') {
                return value.toLowerCase() === 'true';
            }
            return value;
        },
        { toClassOnly: true },
    )
    onStock?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @Transform(
        ({ value }) =>
            typeof value === 'string' && value.trim() === ''
                ? undefined
                : value,
        { toClassOnly: true },
    )
    categoryId?: string;

    @ApiProperty({ required: false, isArray: true, type: String })
    @IsOptional()
    @IsString({ each: true })
    @Transform(
        ({ value }) => {
            if (typeof value === 'string') {
                return value
                    .split(',')
                    .map((v) => v.trim())
                    .filter((v) => v !== '');
            }
            if (Array.isArray(value)) {
                return value;
            }
            return undefined;
        },
        { toClassOnly: true },
    )
    materials?: string[];

    @ApiProperty({ required: false, isArray: true, type: Number })
    @IsOptional()
    @IsNumber({}, { each: true })
    @Transform(
        ({ value }) => {
            if (typeof value === 'string') {
                // Split comma-separated string, trim, filter out empty strings, and convert to numbers
                return value
                    .split(',')
                    .map((v) => v.trim())
                    .filter((v) => v !== '')
                    .map((v) => {
                        const num = Number(v);
                        return isNaN(num) ? undefined : num;
                    });
            }
            if (Array.isArray(value)) {
                return value.map((v) => {
                    const num = Number(v);
                    return isNaN(num) ? undefined : num;
                });
            }
            return value;
        },
        { toClassOnly: true },
    )
    quantity?: number[];
}
