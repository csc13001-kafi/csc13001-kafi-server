import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User } from './entities/user.model';

@Injectable()
export class UsersService {
    constructor(private readonly usersRepository: UsersRepository) {}

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
