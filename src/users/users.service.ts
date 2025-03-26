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
@Injectable()
export class UsersService {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly uploadService: UploadService,
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
        phoneNumber: string;
        address: string;
        image: string;
        salary: number;
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
                phoneNumber: user.phone,
                address: user.address,
                image: user.profileImage,
                salary: user.salary,
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
}
