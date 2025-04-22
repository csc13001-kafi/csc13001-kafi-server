import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User } from './entities/user.model';
import { CreateEmployeeDto } from './dtos/create-user.dto';
import { Role } from '../auth/enums/roles.enum';
import { UpdateEmployeeDto, UpdateProfileDto } from './dtos/update-user.dto';
import type { Multer } from 'multer';
import { UploadService } from '../uploader/upload.service';
import { FeedbackDto } from './dtos/feedback.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class UsersService {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly uploadService: UploadService,
        private readonly mailerService: MailerService,
        private readonly configService: ConfigService,
    ) {}

    async createEmployee(createEmployeeDto: CreateEmployeeDto): Promise<User> {
        return this.usersRepository.createEmployee(createEmployeeDto);
    }

    async updateProfile(
        id: string,
        updateProfileDto: Partial<UpdateProfileDto>,
    ): Promise<User> {
        return this.usersRepository.updateProfile(id, updateProfileDto);
    }

    async updateEmployee(
        id: string,
        updateEmployeeDto: Partial<UpdateEmployeeDto>,
    ): Promise<User> {
        return this.usersRepository.updateEmployee(id, updateEmployeeDto);
    }

    async deleteEmployee(id: string): Promise<{ message: string }> {
        return this.usersRepository.deleteEmployee(id);
    }

    async getProfiles(role?: Role): Promise<
        {
            email: string;
            username: string;
            id: string;
            role: string;
            phone: string;
            address: string;
            birthdate: string;
            salary: number;
            image: string;
            workStart: string;
            workEnd: string;
        }[]
    > {
        try {
            const users = await this.usersRepository.findAllByRole(role);

            return users.map((user) => ({
                email: user.email,
                username: user.username,
                id: user.id,
                role: user.role,
                phone: user.phone,
                address: user.address,
                birthdate: user.birthdate,
                salary: user.salary,
                image: user.profileImage,
                workStart: user.workStart,
                workEnd: user.workEnd,
            }));
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async getMyProfile(profileUser: User): Promise<{
        email: string;
        username: string;
        id: string;
        role: string;
        phone: string;
        address: string;
        image: string;
        salary: number;
        birthdate: string;
        workStart: string;
        workEnd: string;
        loyaltyPoints: number;
    }> {
        try {
            const { id } = profileUser;
            const user = await this.usersRepository.findOneById(id);

            if (!user) {
                throw new BadRequestException('User not found');
            }

            const newUser = {
                email: user.email,
                username: user.username,
                id: user.id,
                role: user.role,
                phone: user.phone,
                address: user.address,
                image: user.profileImage,
                salary: user.salary,
                birthdate: user.birthdate,
                workStart: user.workStart,
                workEnd: user.workEnd,
                loyaltyPoints: user.loyaltyPoints,
            };
            return newUser;
        } catch (error) {
            throw new InternalServerErrorException(
                'Error getting profile',
                error.message,
            );
        }
    }

    async updateProfileImage(
        userId: string,
        file: Multer.File,
    ): Promise<{ message: string; user: Partial<User> }> {
        const imageUrl = await this.uploadService.uploadFile(file, 'users');
        await this.usersRepository.updateProfileImage(userId, imageUrl);
        const user = await this.usersRepository.findOneById(userId);
        const newUser = {
            id: user.id,
            username: user.username,
            profileImage: user.profileImage,
        };
        return {
            message: 'Profile image uploaded successfully',
            user: newUser,
        };
    }

    async sendFeedback(feedbackDto: FeedbackDto): Promise<{ message: string }> {
        try {
            const { name, email, message, phone } = feedbackDto;

            const adminEmail = this.configService.get('MAIL_FROM');
            await this.mailerService.sendMail({
                to: adminEmail,
                subject: `[Customer Feedback] From customer ${name}`,
                text: `
New feedback received from customer:

Name: ${name}
Email: ${email}
Phone: ${phone}

Message:
${message}

This is an automated message from the Kafi POS System.
                `,
            });

            // Send confirmation to the customer
            await this.mailerService.sendMail({
                to: email,
                subject: 'Thank you for your feedback - Kafi',
                text: `
Dear ${name},

Thank you for taking the time to provide us with your feedback. We greatly appreciate your input as it helps us improve our services.

Your feedback has been received and will be reviewed by our team. If necessary, we will contact you for further information.

Best regards,
The Kafi Team
                `,
            });

            return { message: 'Feedback sent successfully' };
        } catch (error) {
            console.log(error.message);
            throw new InternalServerErrorException(
                'Error sending feedback',
                error.message,
            );
        }
    }
}
