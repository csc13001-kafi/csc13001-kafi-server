import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from './users.repository';
import { User } from './entities/user.model';
import { getModelToken } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import {
    InternalServerErrorException,
    NotFoundException,
    Module,
} from '@nestjs/common';
import { Role } from '../auth/enums/roles.enum';
import { UserSignUpDto } from '../auth/dtos/user-signup.dto';
import { CreateEmployeeDto } from './dtos/create-user.dto';
import { UpdateProfileDto } from './dtos/update-user.dto';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
    compare: jest.fn(),
    genSalt: jest.fn(),
    hash: jest.fn(),
}));

// Create a mock Redis module
@Module({
    providers: [
        {
            provide: 'default_IORedisModuleConnectionToken',
            useValue: {
                set: jest.fn().mockImplementation(() => Promise.resolve('OK')),
                get: jest.fn().mockImplementation(() => Promise.resolve(null)),
                del: jest.fn().mockImplementation(() => Promise.resolve(1)),
            },
        },
    ],
    exports: ['default_IORedisModuleConnectionToken'],
})
class MockRedisModule {}

describe('UsersRepository', () => {
    let repository: UsersRepository;
    let configService: ConfigService;
    let mailerService: MailerService;

    // Mock User model
    const mockUserModel = {
        findOne: jest.fn(),
        findAll: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findByPk: jest.fn(),
    };

    // Mock user data
    const mockUser = {
        id: '1',
        email: 'test@test.com',
        username: 'testuser',
        role: Role.EMPLOYEE,
        phone: '0123456789',
        address: 'Test Address',
        birthdate: '1990-01-01',
        salary: 1000,
        profileImage: 'test.jpg',
        password: 'hashedpassword',
        workStart: '08:00',
        workEnd: '17:00',
        loyaltyPoints: 0,
        dataValues: {
            id: '1',
            email: 'test@test.com',
            username: 'testuser',
            role: Role.EMPLOYEE,
            phone: '0123456789',
            address: 'Test Address',
            birthdate: '1990-01-01',
            salary: 1000,
            profileImage: 'test.jpg',
            password: 'hashedpassword',
            workStart: '08:00',
            workEnd: '17:00',
            loyaltyPoints: 0,
        },
    };

    // Mock config service
    const mockConfigService = {
        get: jest.fn(),
    };

    // Mock mailer service
    const mockMailerService = {
        sendMail: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [MockRedisModule],
            providers: [
                UsersRepository,
                {
                    provide: getModelToken(User),
                    useValue: mockUserModel,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
                {
                    provide: MailerService,
                    useValue: mockMailerService,
                },
            ],
        }).compile();

        repository = module.get<UsersRepository>(UsersRepository);
        configService = module.get<ConfigService>(ConfigService);
        mailerService = module.get<MailerService>(MailerService);

        // Reset all mocks
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    describe('validatePassword', () => {
        it('should return true if password is valid', async () => {
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await repository.validatePassword(
                'password',
                mockUser as any,
            );

            expect(bcrypt.compare).toHaveBeenCalledWith(
                'password',
                'hashedpassword',
            );
            expect(result).toBe(true);
        });

        it('should return false if password is invalid', async () => {
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            const result = await repository.validatePassword(
                'wrongpassword',
                mockUser as any,
            );

            expect(bcrypt.compare).toHaveBeenCalledWith(
                'wrongpassword',
                'hashedpassword',
            );
            expect(result).toBe(false);
        });

        it('should throw InternalServerErrorException on error', async () => {
            (bcrypt.compare as jest.Mock).mockRejectedValue(
                new Error('Bcrypt error'),
            );

            await expect(
                repository.validatePassword('password', mockUser as any),
            ).rejects.toThrow(InternalServerErrorException);
        });
    });

    describe('hashPassword', () => {
        it('should hash a password', async () => {
            mockConfigService.get.mockReturnValue('10');
            (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');

            const result = await repository.hashPassword('password');

            expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(bcrypt.hash).toHaveBeenCalledWith('password', 'salt');
            expect(result).toBe('hashedpassword');
        });

        it('should throw InternalServerErrorException on error', async () => {
            mockConfigService.get.mockReturnValue('10');
            (bcrypt.genSalt as jest.Mock).mockRejectedValue(
                new Error('Bcrypt error'),
            );

            await expect(repository.hashPassword('password')).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    describe('findOneByPhoneNumber', () => {
        it('should find a user by phone number', async () => {
            mockUserModel.findOne.mockResolvedValue(mockUser);

            const result = await repository.findOneByPhoneNumber('0123456789');

            expect(mockUserModel.findOne).toHaveBeenCalledWith({
                where: { phone: '0123456789' },
            });
            expect(result).toEqual(mockUser.dataValues);
        });

        it('should return null if user not found', async () => {
            mockUserModel.findOne.mockResolvedValue(null);

            const result = await repository.findOneByPhoneNumber('9999999999');

            expect(result).toBeNull();
        });
    });

    describe('updateLoyaltyPoints', () => {
        it('should update loyalty points for a user', async () => {
            mockUserModel.update.mockResolvedValue([1]);

            await repository.updateLoyaltyPoints('0123456789', 100);

            expect(mockUserModel.update).toHaveBeenCalledWith(
                { loyaltyPoints: 100 },
                { where: { phone: '0123456789' } },
            );
        });
    });

    describe('createEmployee', () => {
        it('should create a new employee', async () => {
            const createDto: CreateEmployeeDto = {
                username: 'newemployee',
                email: 'employee@test.com',
                phone: '0987654321',
                address: 'Employee Address',
                birthdate: '1995-01-01',
                salary: 1200,
                workStart: '09:00',
                workEnd: '18:00',
            };

            const newEmployee = {
                ...createDto,
                id: expect.any(String),
                role: Role.EMPLOYEE,
            };

            mockConfigService.get.mockReturnValue('defaultpassword');
            (repository.hashPassword as jest.Mock) = jest
                .fn()
                .mockResolvedValue('hashedpassword');
            mockUserModel.create.mockResolvedValue(newEmployee);

            const result = await repository.createEmployee(createDto);

            expect(mockMailerService.sendMail).toHaveBeenCalled();
            expect(mockUserModel.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    username: createDto.username,
                    email: createDto.email,
                    phone: createDto.phone,
                    role: Role.EMPLOYEE,
                }),
            );
            expect(result).toEqual(newEmployee);
        });

        it('should throw InternalServerErrorException if user creation fails', async () => {
            const createDto: CreateEmployeeDto = {
                username: 'newemployee',
                email: 'employee@test.com',
                phone: '0987654321',
                address: 'Employee Address',
                birthdate: '1995-01-01',
                salary: 1200,
                workStart: '09:00',
                workEnd: '18:00',
            };

            mockConfigService.get.mockReturnValue('defaultpassword');
            (repository.hashPassword as jest.Mock) = jest
                .fn()
                .mockResolvedValue('hashedpassword');
            mockUserModel.create.mockResolvedValue(null);

            await expect(repository.createEmployee(createDto)).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    describe('createCustomer', () => {
        it('should create a new customer', async () => {
            const createDto: UserSignUpDto = {
                username: 'newcustomer',
                email: 'customer@test.com',
                password: 'password',
                phone: '0987654321',
            };

            const newCustomer = {
                ...createDto,
                id: expect.any(String),
                role: Role.GUEST,
            };

            (repository.hashPassword as jest.Mock) = jest
                .fn()
                .mockResolvedValue('hashedpassword');
            mockUserModel.create.mockResolvedValue(newCustomer);

            const result = await repository.createCustomer(createDto);

            expect(mockUserModel.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    username: createDto.username,
                    email: createDto.email,
                    phone: createDto.phone,
                    role: Role.GUEST,
                }),
            );
            expect(result).toEqual(newCustomer);
        });

        it('should throw InternalServerErrorException if user creation fails', async () => {
            const createDto: UserSignUpDto = {
                username: 'newcustomer',
                email: 'customer@test.com',
                password: 'password',
                phone: '0987654321',
            };

            (repository.hashPassword as jest.Mock) = jest
                .fn()
                .mockResolvedValue('hashedpassword');
            mockUserModel.create.mockResolvedValue(null);

            await expect(repository.createCustomer(createDto)).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    describe('findAllByRole', () => {
        it('should find all users by role', async () => {
            const users = [mockUser];
            mockUserModel.findAll.mockResolvedValue(users);

            const result = await repository.findAllByRole(Role.EMPLOYEE);

            expect(mockUserModel.findAll).toHaveBeenCalledWith({
                where: { role: Role.EMPLOYEE },
            });
            expect(result).toEqual([mockUser.dataValues]);
        });

        it('should handle errors', async () => {
            mockUserModel.findAll.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(
                repository.findAllByRole(Role.EMPLOYEE),
            ).rejects.toThrow(InternalServerErrorException);
        });
    });

    describe('findOneByEmail', () => {
        it('should find a user by email', async () => {
            mockUserModel.findOne.mockResolvedValue(mockUser);

            const result = await repository.findOneByEmail('test@test.com');

            expect(mockUserModel.findOne).toHaveBeenCalledWith({
                where: { email: 'test@test.com' },
            });
            expect(result).toEqual(mockUser.dataValues);
        });

        it('should return null if user not found', async () => {
            mockUserModel.findOne.mockResolvedValue(null);

            const result = await repository.findOneByEmail(
                'nonexistent@test.com',
            );

            expect(result).toBeNull();
        });

        it('should handle errors', async () => {
            mockUserModel.findOne.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(
                repository.findOneByEmail('test@test.com'),
            ).rejects.toThrow(InternalServerErrorException);
        });
    });

    describe('updateProfile', () => {
        it('should update a user profile', async () => {
            const id = '1';
            const updateDto: UpdateProfileDto = { username: 'updatedusername' };

            const updatedUser = {
                ...mockUser,
                username: 'updatedusername',
                dataValues: {
                    ...mockUser.dataValues,
                    username: 'updatedusername',
                },
            };

            mockUserModel.update.mockResolvedValue([1, [updatedUser]]);

            const result = await repository.updateProfile(id, updateDto);

            expect(mockUserModel.update).toHaveBeenCalledWith(updateDto, {
                where: { id },
                returning: true,
            });
            expect(result).toEqual(updatedUser.dataValues);
        });

        it('should throw InternalServerErrorException if user not found', async () => {
            const id = '999';
            const updateDto: UpdateProfileDto = { username: 'updatedusername' };

            mockUserModel.update.mockResolvedValue([0, []]);

            await expect(
                repository.updateProfile(id, updateDto),
            ).rejects.toThrow(InternalServerErrorException);
        });

        it('should handle errors', async () => {
            const id = '1';
            const updateDto: UpdateProfileDto = { username: 'updatedusername' };

            mockUserModel.update.mockRejectedValue(new Error('Database error'));

            await expect(
                repository.updateProfile(id, updateDto),
            ).rejects.toThrow(InternalServerErrorException);
        });
    });

    describe('updateProfileImage', () => {
        it('should update a user profile image', async () => {
            const id = '1';
            const imageUrl = 'new-image.jpg';

            mockUserModel.update.mockResolvedValue([1]);

            await repository.updateProfileImage(id, imageUrl);

            expect(mockUserModel.update).toHaveBeenCalledWith(
                { profileImage: imageUrl },
                { where: { id } },
            );
        });
    });

    describe('deleteEmployee', () => {
        it('should delete an employee', async () => {
            const id = '1';
            const mockEmployeeModel = {
                destroy: jest.fn().mockResolvedValue(undefined),
            };

            mockUserModel.findByPk.mockResolvedValue(mockEmployeeModel);

            const result = await repository.deleteEmployee(id);

            expect(mockUserModel.findByPk).toHaveBeenCalledWith(id);
            expect(mockEmployeeModel.destroy).toHaveBeenCalled();
            expect(result).toEqual({
                message: 'Employee deleted successfully',
            });
        });

        it('should throw NotFoundException if employee not found', async () => {
            const id = '999';

            mockUserModel.findByPk.mockResolvedValue(null);

            await expect(repository.deleteEmployee(id)).rejects.toThrow(
                NotFoundException,
            );
        });
    });
});
