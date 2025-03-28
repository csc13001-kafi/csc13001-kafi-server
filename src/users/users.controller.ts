import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    Patch,
    Post,
    Query,
    Request,
    Res,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Put,
} from '@nestjs/common';
import { Response } from 'express';
import { UsersService } from './users.service';
import {
    ApiOperation,
    ApiBearerAuth,
    ApiResponse,
    ApiQuery,
    ApiConsumes,
    ApiBody,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
import { ATAuthGuard } from '../auth/guards/at-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ProfileDto } from '../auth/dtos/cred.dto';
import { CreateEmployeeDto } from './dtos/create-user.dto';
import { UpdateEmployeeDto, UpdateProfileDto } from './dtos/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Multer } from 'multer';
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @ApiOperation({ summary: 'Get profiles by role [MANAGER]' })
    @ApiBearerAuth('access-token')
    @Get()
    @ApiQuery({
        name: 'role',
        enum: Role,
        required: false,
        description: `Filter by role. Allowed values: ${Object.values(Role).join(', ')}`,
    })
    @ApiResponse({
        status: 200,
        description: 'Get profiles successfully',
        type: [ProfileDto],
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @ApiBearerAuth('access-token')
    @Roles(Role.MANAGER)
    @HttpCode(200)
    async getProfiles(@Query('role') role: Role, @Res() res: Response) {
        if (role && !Object.values(Role).includes(role)) {
            throw new BadRequestException(
                `Invalid role. Allowed values: ${Object.values(Role).join(', ')}`,
            );
        }

        const foundUsers = await this.usersService.getProfiles(role);
        res.send(foundUsers);
    }

    @ApiOperation({
        summary: 'Get profile with credentials [GUEST, EMPLOYEE, MANAGER]',
    })
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
            phoneNumber: string;
            address: string;
            image: string;
            salary: number;
            birthdate: string;
        } = await this.usersService.getMyProfile(req.user);
        res.send(foundUser);
    }

    @ApiOperation({ summary: 'Update profile [GUEST, EMPLOYEE, MANAGER]' })
    @ApiBearerAuth('access-token')
    @Patch('user')
    @ApiResponse({
        status: 200,
        description: 'Update profile successfully',
        type: UpdateProfileDto,
    })
    @UseGuards(ATAuthGuard)
    async updateProfile(
        @Request() req: any,
        @Body() updateProfileDto: UpdateProfileDto,
    ) {
        if (req.user.role === Role.GUEST || req.user.role === Role.MANAGER) {
            return this.usersService.updateProfile(
                req.user.id,
                updateProfileDto,
            );
        }

        return this.usersService.updateEmployee(req.user.id, updateProfileDto);
    }

    @ApiOperation({ summary: 'Create employee [MANAGER]' })
    @ApiBearerAuth('access-token')
    @Post('employee')
    @ApiResponse({
        status: 200,
        description: 'Create employee successfully',
        type: ProfileDto,
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.MANAGER)
    async createEmployee(@Body() createEmployeeDto: CreateEmployeeDto) {
        return this.usersService.createEmployee(createEmployeeDto);
    }

    @ApiOperation({ summary: 'Update employee [MANAGER]' })
    @ApiBearerAuth('access-token')
    @Patch('employee/:id')
    @ApiResponse({
        status: 200,
        description: 'Update employee successfully',
        type: ProfileDto,
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.MANAGER)
    async updateEmployee(
        @Param('id') id: string,
        @Body() updateEmployeeDto: UpdateEmployeeDto,
    ) {
        return this.usersService.updateEmployee(id, updateEmployeeDto);
    }

    @ApiOperation({ summary: 'Delete employee [MANAGER]' })
    @ApiBearerAuth('access-token')
    @Delete('employee/:id')
    @ApiResponse({
        status: 200,
        description: 'Delete employee successfully',
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.MANAGER)
    async deleteEmployee(@Param('id') id: string) {
        return this.usersService.deleteEmployee(id);
    }

    @ApiOperation({ summary: 'Upload profile image [USER]' })
    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                image: { type: 'string', format: 'binary' },
            },
            required: ['image'],
        },
    })
    @Put('user/image')
    @UseGuards(ATAuthGuard)
    @UseInterceptors(FileInterceptor('image'))
    async uploadProfileImage(
        @Request() req: any,
        @UploadedFile() file: Multer.File,
    ) {
        return this.usersService.updateProfileImage(req.user.id, file);
    }
}
