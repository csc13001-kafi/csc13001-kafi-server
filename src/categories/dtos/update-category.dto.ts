import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';
import { IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
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
}
