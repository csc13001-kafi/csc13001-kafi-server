import { Injectable } from '@nestjs/common';
import { TokensDto } from './dtos/tokens.dto';
import { UsersRepository } from '../users/users.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserLoginDto } from './dtos/user-signin.dto';
import {
    UnauthorizedException,
    NotFoundException,
    InternalServerErrorException,
    BadRequestException,
} from '@nestjs/common';
import { User } from '../users/entities/user.model';
import { UserSignUpDto } from './dtos/user-signup.dto';
import { Role } from './enums/roles.enum';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly mailerService: MailerService,
    ) {}

    public async validateUser(email: string, password: string): Promise<User> {
        const user = await this.usersRepository.findOneByEmail(email);
        if (!user) {
            return null;
        }

        console.log(user);
        const isValidPassword: boolean =
            await this.usersRepository.validatePassword(password, user);

        if (!isValidPassword) {
            return null;
        }

        return user;
    }

    public async signIn(user: UserLoginDto): Promise<TokensDto> {
        try {
            const payloadAccessToken = {
                id: user.id,
                username: user.username,
                role: user.role,
            };

            const accessToken = await this.jwtService.signAsync(
                payloadAccessToken,
                {
                    expiresIn: '15m',
                    secret: this.configService.get('AT_SECRET'),
                },
            );

            const payloadRefreshToken = {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            };

            const refreshToken = await this.jwtService.signAsync(
                payloadRefreshToken,
                {
                    expiresIn: '7d',
                    secret: this.configService.get('RT_SECRET'),
                },
            );

            console.log(user);
            await this.usersRepository.updateRefreshToken(
                user.id,
                refreshToken,
            );
            await this.usersRepository.updateOtp(user.id, null, null);

            return { accessToken, refreshToken };
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    public async signUp(user: UserSignUpDto): Promise<User> {
        try {
            const newUser = await this.usersRepository.create(user, Role.GUEST);
            return newUser;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    public async signOut(user: UserLoginDto): Promise<void> {
        try {
            await this.usersRepository.updateRefreshToken(user.id, 'null');
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    public async getNewTokens(refreshToken: string): Promise<TokensDto> {
        try {
            const RTRecord =
                await this.usersRepository.findOneByRefreshToken(refreshToken);
            if (!RTRecord) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            const payload = this.jwtService.verify<{
                id: string;
                username: string;
                role: Role;
            }>(refreshToken, {
                secret: this.configService.get('RT_SECRET'),
            });

            const payloadAccessToken = {
                id: payload.id,
                username: payload.username,
                role: payload.role,
            };

            const newAT = await this.jwtService.signAsync(payloadAccessToken, {
                expiresIn: '15m',
                secret: this.configService.get('AT_SECRET'),
            });

            return { accessToken: newAT, refreshToken: refreshToken };
        } catch (error: any) {
            await this.usersRepository.deleteByRefreshToken(refreshToken);
            throw new UnauthorizedException(
                (error as Error).message ||
                    'Refresh token expired. Please log in again',
            );
        }
    }

    public async forgotPassword(email: string): Promise<void> {
        try {
            const user = await this.usersRepository.findOneByEmail(email);
            if (!user) throw new NotFoundException('User not found');

            const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
            const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

            await this.usersRepository.updateOtp(email, otp, otpExpiry);

            await this.mailerService.sendMail({
                to: email,
                subject: '[Kafi - POS System] Reset Password OTP',
                text: `Please do not reply this message. \n Your OTP is: ${otp}`,
            });

            return;
        } catch (error) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async verifyOtp(email: string, otp: string): Promise<void> {
        try {
            const user = await this.usersRepository.findOneByOtp(email, otp);

            if (!user) throw new BadRequestException('Invalid OTP');

            const currentTime = new Date();

            if (currentTime > user.otpExpiry) {
                throw new BadRequestException('OTP expired');
            }

            return;
        } catch (error) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async resetPassword(
        email: string,
        otp: string,
        newPassword: string,
        confirmPassword: string,
    ): Promise<void> {
        try {
            const user = await this.usersRepository.findByOtpOnly(email, otp);

            if (!user) throw new BadRequestException('Invalid OTP');

            if (newPassword !== confirmPassword) {
                throw new BadRequestException('Passwords do not match');
            }

            const currentTime = new Date();
            if (currentTime > user.otpExpiry) {
                throw new BadRequestException('OTP expired');
            }

            const hashedPassword =
                await this.usersRepository.hashPassword(newPassword);
            await this.usersRepository.updatePassword(email, hashedPassword);
            return;
        } catch (error) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }
}
