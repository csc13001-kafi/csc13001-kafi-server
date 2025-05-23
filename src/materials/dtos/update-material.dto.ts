import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateMaterialDto } from './create-material.dto';
import { IsNotEmpty, IsOptional, Min } from 'class-validator';
import { IsNumber } from 'class-validator';

export class UpdateMaterialDto extends PartialType(CreateMaterialDto) {
    @ApiProperty({
        description: 'The new current stock value',
        example: 100,
    })
    @IsNotEmpty()
    @IsNumber()
    @IsOptional()
    @Min(0)
    currentStock: number;
}
