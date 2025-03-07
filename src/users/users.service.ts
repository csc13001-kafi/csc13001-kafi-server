import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User } from './entities/user.model';
import { Role } from '../auth/enums/roles.enum';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class UsersService {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly mailerService: MailerService,
    ) {}

    async getAllProfiles(): Promise<
        { email: string; username: string; id: string; role: string }[]
    > {
        try {
            const users = await this.usersRepository.findAll();
            const newUsers = users.map((user) => {
                return {
                    email: user.email,
                    username: user.username,
                    id: user.id,
                    role: user.role,
                };
            });
            return newUsers;
        } catch (error) {
            throw new InternalServerErrorException(
                'Error getting all profiles',
                error.message,
            );
        }
    }

    async createCustomerAccount(
        email: string,
        username: string,
        phone: string,
    ): Promise<User> {
        const foundUser = await this.usersRepository.findOneByEmail(email);
        if (foundUser) {
            throw new BadRequestException('Email is already in use');
        }

        try {
            const password = Math.random().toString(36).slice(-8);
            const hashedPassword =
                await this.usersRepository.hashPassword(password);
            const user = await this.usersRepository.create(
                {
                    email: email,
                    username: username,
                    phone: phone,
                    password: hashedPassword,
                },
                Role.CUSTOMER,
            );

            await this.mailerService.sendMail({
                to: email,
                subject:
                    '[Kafi - POS System] Account Created - Welcome you to Kafi',
                text: `Your account has been created successfully. This account is used for Kafi POS System - membership loyalty. Your account information is: \n
                Email: ${email}. (This email is used for login to our website) \n
                Username: ${username}. \n
                Password: ${password}. \n
                Phone: ${phone}. \n
                \n Please change your password after login. Thank you for using our service.`,
            });
            return user;
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    async getMyProfile(profileUser: User): Promise<{
        email: string;
        username: string;
        id: string;
        role: string;
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
            };
            return newUser;
        } catch (error) {
            throw new InternalServerErrorException(
                'Error getting profile',
                error.message,
            );
        }
    }
}
