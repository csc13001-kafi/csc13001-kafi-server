import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsString,
    IsArray,
    IsNumber,
    IsEnum,
    IsDateString,
    ArrayMinSize,
    IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaymentMethod } from '../enums/payment-method.enum';
import { Product } from '../../products/entities/product.model';

export class CreateOrderDto {
    @ApiProperty({
        description: 'Table identifier where the order is placed',
        example: 'T1',
    })
    @IsString()
    @IsNotEmpty()
    table: string;

    @ApiProperty({
        description: 'Unique order identifier',
        example: 'ORD-12345',
    })
    @IsString()
    @IsNotEmpty()
    id: string;

    @ApiProperty({
        description: 'Order timestamp (ISO string)',
        example: '2023-04-24T10:30:00Z',
    })
    @IsString()
    @IsNotEmpty()
    time: string;

    @ApiProperty({
        description: 'Array of chosen product IDs',
        example: ['prod-1', 'prod-2'],
    })
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            return value.split(',');
        }
        return value;
    })
    @IsArray()
    @IsString({ each: true })
    @ArrayMinSize(1)
    products: string[];

    @ApiProperty({
        description: 'Array of quantities corresponding to each product',
        example: [1, 3],
    })
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            return value.split(',').map(Number);
        }
        return value;
    })
    @IsArray()
    @IsNumber({}, { each: true })
    @ArrayMinSize(1)
    quantities: number[];

    @ApiProperty({
        description: "Client's phone number",
        example: '+1234567890',
    })
    @IsString()
    @IsOptional()
    clientPhoneNumber: string;

    @ApiProperty({
        description: 'Payment method',
        example: 'cash',
    })
    @IsEnum(PaymentMethod)
    @IsNotEmpty()
    paymentMethod: PaymentMethod;
}

export class CreateOrderGeneralDto {
    @ApiProperty({
        description: 'Table identifier where the order is placed',
        example: 'T1',
    })
    @IsString()
    @IsNotEmpty()
    table: string;

    @ApiProperty({
        description: 'Unique order identifier',
        example: 'ORD-12345',
    })
    @IsString()
    @IsNotEmpty()
    id: string;

    @ApiProperty({
        description: 'Order timestamp (ISO string)',
        example: '2023-04-24T10:30:00Z',
    })
    @IsDateString()
    @IsNotEmpty()
    time: string;

    @ApiProperty({
        description: 'Array of chosen product IDs',
        example: ['prod-1', 'prod-2'],
    })
    @IsArray()
    @IsString({ each: true })
    products: Product[];

    @ApiProperty({
        description: 'Array of quantities corresponding to each product',
        example: [1, 3],
    })
    @IsArray()
    @IsNumber({}, { each: true })
    quantities: number[];

    @ApiProperty({
        description: "Client's phone number",
        example: '+1234567890',
    })
    @IsString()
    @IsNotEmpty()
    clientPhoneNumber: string;

    @ApiProperty({
        description: 'Payment method',
        example: 'cash',
    })
    @IsString()
    @IsNotEmpty()
    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;
}

export class CreateOrderDetailsDto {
    @ApiProperty({
        description: 'Number of products',
        example: 1,
    })
    @IsNumber()
    numberOfProducts: number;

    @ApiProperty({
        description: 'Total price',
        example: 100,
    })
    @IsNumber()
    totalPrice: number;

    @ApiProperty({
        description: 'Discount percentage',
        example: 10,
    })
    @IsNumber()
    discountPercentage: number;

    @ApiProperty({
        description: 'Discount amount',
        example: 10,
    })
    @IsNumber()
    discount: number;

    @ApiProperty({
        description: 'After discount price',
        example: 90,
    })
    @IsNumber()
    afterDiscountPrice: number;

    @ApiProperty({
        description: 'Employee ID',
        example: 'emp-1',
    })
    @IsString()
    employeeName: string;
}
