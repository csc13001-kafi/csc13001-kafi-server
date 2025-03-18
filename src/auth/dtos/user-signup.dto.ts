import {
    IsDateString,
    IsEmail,
    IsNotEmpty,
    IsPhoneNumber,
    IsString,
} from 'class-validator';

export class UserSignUpDto {
    @IsNotEmpty({ message: 'Username cannot be empty' })
    @IsString()
    username: string;

    @IsNotEmpty({ message: 'Email cannot be empty' })
    @IsEmail({}, { message: 'Invalid email' })
    email: string;

    @IsNotEmpty({ message: 'Password cannot be empty' })
    @IsString()
    password: string;

    @IsNotEmpty({ message: 'Phone cannot be empty' })
    @IsPhoneNumber('VN', { message: 'Invalid phone number' })
    phone: string;

    @IsNotEmpty({ message: 'Address cannot be empty' })
    @IsString()
    address: string;

    @IsNotEmpty({ message: 'Birthdate cannot be empty' })
    @IsDateString()
    birthdate: string;
}
