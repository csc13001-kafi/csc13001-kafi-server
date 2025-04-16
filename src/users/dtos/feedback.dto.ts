import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class FeedbackDto {
    @ApiProperty({
        description: 'Name of the person providing feedback',
        example: 'John Doe',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @ApiProperty({
        description: 'Email of the person providing feedback',
        example: 'john.doe@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'Customer phone number',
        example: '+1234567890',
    })
    @IsString()
    @IsNotEmpty()
    phone: string;

    @ApiProperty({
        description: 'The feedback message content',
        example:
            'I really enjoyed your coffee. The service was excellent and the atmosphere was pleasant.',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    message: string;
}
