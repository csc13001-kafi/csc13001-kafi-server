import {
    Controller,
    Get,
    HttpCode,
    Request,
    Res,
    UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { UsersService } from './users.service';
import { ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
import { ATAuthGuard } from '../auth/guards/at-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ProfileDto } from '../auth/dtos/cred.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @ApiOperation({ summary: 'Get all profiles [MANAGER]' })
    @ApiBearerAuth('access-token')
    @Get()
    @ApiResponse({
        status: 200,
        description: 'Get all profiles successfully',
        type: [ProfileDto],
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @ApiBearerAuth('access-token')
    @Roles(Role.MANAGER)
    @HttpCode(200)
    async getAllProfiles(@Request() req: any, @Res() res: Response) {
        const foundUsers: {
            email: string;
            username: string;
            id: string;
            role: string;
        }[] = await this.usersService.getAllProfiles();
        res.send(foundUsers);
    }

    @ApiOperation({ summary: 'Get profile with credentials [USER]' })
    @ApiBearerAuth('access-token')
    @Get('user')
    @ApiResponse({
        status: 200,
        description: 'Get profile successfully',
        type: ProfileDto,
    })
    @UseGuards(ATAuthGuard)
    async getMyProfile(@Request() req: any, @Res() res: Response) {
        const foundUser: {
            email: string;
            username: string;
            id: string;
            role: string;
        } = await this.usersService.getMyProfile(req.user);
        res.send(foundUser);
    }
}
