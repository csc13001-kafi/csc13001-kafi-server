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
    @ApiProperty()
    @IsString()
    email: string;

    @ApiProperty()
    @IsString()
    username: string;

    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    phoneNumber: string;

    @ApiProperty()
    @IsString()
    address: string;

    @ApiProperty()
    @IsString()
    image: string;

    @ApiProperty()
    @IsNumber()
    salary: number;

    @ApiProperty()
    @IsDateString()
    birthdate: string;

    @ApiProperty()
    @IsString()
    workStart: string;

    @ApiProperty()
    @IsString()
    workEnd: string;
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
