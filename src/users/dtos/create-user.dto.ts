import { ApiProperty } from '@nestjs/swagger';
import {
    IsDateString,
    IsNumber,
    IsPhoneNumber,
    IsString,
} from 'class-validator';

export class CreateEmployeeDto {
    @ApiProperty()
    @IsString()
    username: string;

    @ApiProperty()
    @IsString()
    email: string;

    @ApiProperty()
    @IsPhoneNumber('VN')
    phone: string;

    @ApiProperty()
    @IsString()
    address: string;

    @ApiProperty()
    @IsDateString()
    birthdate: string;

    @ApiProperty()
    @IsNumber()
    salary: number;

    @ApiProperty()
    @IsString()
    workStart: string;

    @ApiProperty()
    @IsString()
    workEnd: string;
}
