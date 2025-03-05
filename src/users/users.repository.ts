import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './entities/user.model';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { UserSignUpDto } from '../auth/dtos/user-signup.dto';
@Injectable()
export class UserRepository {
    constructor(
        @InjectModel(User) private readonly userModel: typeof User,
        private readonly configService: ConfigService,
    ) {}

    async validatePassword(password: string, user: User): Promise<boolean> {
        try {
            return await bcrypt.compare(password, user.password);
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    async hashPassword(password: string): Promise<string> {
        try {
            const salt: number = await bcrypt.genSalt(
                parseInt(this.configService.get('SALT'), 10),
            );

            const hashedPassword: string = await bcrypt.hash(password, salt);

            return hashedPassword;
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    async create(CreateDto: UserSignUpDto, role: string): Promise<User> {
        const { username, email, password } = CreateDto;
        const hashedPassword = await this.hashPassword(password);

        const user = await this.userModel.create({
            id: uuidv4(),
            username: username,
            email: email,
            password: hashedPassword,
            otp: null,
            otpExpiry: null,
            role: role,
        });
        if (!user) {
            throw new InternalServerErrorException(
                'This email or username is already in use',
            );
        }
        return user;
    }

    async findAll(): Promise<User[]> {
        try {
            return await this.userModel.findAll<User>();
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    async findOneByEmail(email: string): Promise<User> {
        try {
            const project = await this.userModel.findOne<User>({
                where: { email },
            });
            return project.dataValues;
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    async findOneById(id: string): Promise<User> {
        try {
            const project = await this.userModel.findOne<User>({
                where: { id },
            });
            return project.dataValues;
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    async updateRefreshToken(id: string, refreshToken: string): Promise<void> {
        try {
            if (refreshToken === 'null') {
                await this.userModel.update(
                    { refreshToken: null },
                    { where: { id: id } },
                );
            } else {
                await this.userModel.update(
                    { refreshToken: refreshToken },
                    { where: { id: id } },
                );
            }
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    async updateOtp(
        email: string,
        otp: string,
        otpExpiry: Date,
    ): Promise<void> {
        try {
            await this.userModel.update(
                { otp: otp, otpExpiry: otpExpiry },
                { where: { email: email } },
            );
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    async findOneByRefreshToken(refreshToken: string): Promise<User> {
        try {
            const project = await this.userModel.findOne<User>({
                where: { refreshToken },
            });
            return project.dataValues;
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    async deleteByRefreshToken(refreshToken: string): Promise<void> {
        try {
            await this.userModel.destroy({ where: { refreshToken } });
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    async findOneByOtp(email: string, otp: string): Promise<User> {
        try {
            const project = await this.userModel.findOne<User>({
                where: { email, otp },
            });
            return project.dataValues;
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }
}
