import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';
import { CreateProductDto } from '../../products/dtos/create-product.dto';
import { CreateCategoryDto } from './create-category.dto';

export class MenuDto {
    @ApiProperty()
    @IsObject()
    categories: CreateCategoryDto[];

    @ApiProperty()
    @IsObject()
    products: CreateProductDto[];
}
