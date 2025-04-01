import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
    IsDateString,
    IsNumber,
    IsOptional,
    IsPhoneNumber,
    IsString,
} from 'class-validator';
import { CreateEmployeeDto } from './create-user.dto';

export class UpdateProfileDto {
    @ApiProperty({ required: false })
    @IsString()
    username?: string;

    @ApiProperty({ required: false })
    @IsString()
    email?: string;

    @ApiProperty({ required: false })
    @IsPhoneNumber('VN')
    phone?: string;

    @ApiProperty({ required: false })
    @IsString()
    address?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    birthdate?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    salary?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    image?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    workStart?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    workEnd?: string;
}

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    username?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsPhoneNumber('VN')
    phone?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    birthdate?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    salary?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    workStart?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    workEnd?: string;
}
