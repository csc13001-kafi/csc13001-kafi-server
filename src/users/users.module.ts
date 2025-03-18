import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserSignUpDto } from '../auth/dtos/user-signup.dto';
import { UsersController } from './users.controller';
import { AccessControlService } from '../ac/ac.service';
import { UsersRepository } from './users.repository';

@Module({
    imports: [SequelizeModule.forFeature([User]), UserSignUpDto],
    controllers: [UsersController],
    providers: [UsersService, UsersRepository, AccessControlService],
    exports: [UsersService, UsersRepository, UserSignUpDto],
})
export class UsersModule {}
