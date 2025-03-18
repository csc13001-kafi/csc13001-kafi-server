import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User } from './entities/user.model';
import { CreateCustomerDto, CreateEmployeeDto } from './dtos/create-user.dto';
import { Role } from '../auth/enums/roles.enum';
import { UpdateEmployeeDto } from './dtos/update-user.dto';

@Injectable()
export class UsersService {
    constructor(private readonly usersRepository: UsersRepository) {}

    async createEmployee(createEmployeeDto: CreateEmployeeDto): Promise<User> {
        return this.usersRepository.createEmployee(createEmployeeDto);
    }

    async createCustomer(createCustomerDto: CreateCustomerDto): Promise<User> {
        return this.usersRepository.createCustomer(createCustomerDto);
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

    async getProfiles(
        role?: Role,
    ): Promise<
        { email: string; username: string; id: string; role: string }[]
    > {
        try {
            const users = await this.usersRepository.findAllByRole(role);

            return users.map((user) => ({
                email: user.email,
                username: user.username,
                id: user.id,
                role: user.role,
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
