import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { UploadService } from '../uploader/upload.service';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { Role } from '../auth/enums/roles.enum';
import { CreateEmployeeDto } from './dtos/create-user.dto';
import { UpdateProfileDto } from './dtos/update-user.dto';
import { FeedbackDto } from './dtos/feedback.dto';

describe('UsersService', () => {
    let service: UsersService;
    let usersRepository: UsersRepository;
    let uploadService: UploadService;
    let mailerService: MailerService;
    let configService: ConfigService;

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
        workStart: '08:00',
        workEnd: '17:00',
        loyaltyPoints: 0,
    };

    // Mock repository
    const mockUsersRepository = {
        createEmployee: jest.fn(),
        updateProfile: jest.fn(),
        updateEmployee: jest.fn(),
        deleteEmployee: jest.fn(),
        findAllByRole: jest.fn(),
        findOneById: jest.fn(),
        updateProfileImage: jest.fn(),
        updateRefreshToken: jest.fn(),
        findOneByRefreshToken: jest.fn(),
        deleteByRefreshToken: jest.fn(),
        validatePassword: jest.fn(),
        hashPassword: jest.fn(),
        findOneByPhoneNumber: jest.fn(),
        updatePassword: jest.fn(),
        updateOtp: jest.fn(),
        findOneByOtp: jest.fn(),
    };

    // Mock upload service
    const mockUploadService = {
        uploadFile: jest.fn(),
    };

    // Mock mailer service
    const mockMailerService = {
        sendMail: jest.fn(),
    };

    // Mock config service
    const mockConfigService = {
        get: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: UsersRepository,
                    useValue: mockUsersRepository,
                },
                {
                    provide: UploadService,
                    useValue: mockUploadService,
                },
                {
                    provide: MailerService,
                    useValue: mockMailerService,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        usersRepository = module.get<UsersRepository>(UsersRepository);
        uploadService = module.get<UploadService>(UploadService);
        mailerService = module.get<MailerService>(MailerService);
        configService = module.get<ConfigService>(ConfigService);

        // Reset all mocks
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
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
                id: '2',
                role: Role.EMPLOYEE,
            };

            mockUsersRepository.createEmployee.mockResolvedValue(newEmployee);

            const result = await service.createEmployee(createDto);

            expect(mockUsersRepository.createEmployee).toHaveBeenCalledWith(
                createDto,
            );
            expect(result).toEqual(newEmployee);
        });
    });

    describe('updateProfile', () => {
        it('should update a user profile', async () => {
            const id = '1';
            const updateDto: UpdateProfileDto = { username: 'updatedusername' };

            const updatedUser = {
                ...mockUser,
                username: 'updatedusername',
            };

            mockUsersRepository.updateProfile.mockResolvedValue(updatedUser);

            const result = await service.updateProfile(id, updateDto);

            expect(mockUsersRepository.updateProfile).toHaveBeenCalledWith(
                id,
                updateDto,
            );
            expect(result).toEqual(updatedUser);
        });
    });

    describe('updateEmployee', () => {
        it('should update an employee', async () => {
            const id = '1';
            const updateDto = { salary: 1500 };

            const updatedEmployee = {
                ...mockUser,
                salary: 1500,
            };

            mockUsersRepository.updateEmployee.mockResolvedValue(
                updatedEmployee,
            );

            const result = await service.updateEmployee(id, updateDto);

            expect(mockUsersRepository.updateEmployee).toHaveBeenCalledWith(
                id,
                updateDto,
            );
            expect(result).toEqual(updatedEmployee);
        });
    });

    describe('deleteEmployee', () => {
        it('should delete an employee', async () => {
            const id = '1';
            const expectedResult = { message: 'Employee deleted successfully' };

            mockUsersRepository.deleteEmployee.mockResolvedValue(
                expectedResult,
            );

            const result = await service.deleteEmployee(id);

            expect(mockUsersRepository.deleteEmployee).toHaveBeenCalledWith(id);
            expect(result).toEqual(expectedResult);
        });
    });

    describe('getProfiles', () => {
        it('should return profiles filtered by role', async () => {
            const users = [mockUser];
            mockUsersRepository.findAllByRole.mockResolvedValue(users);

            const result = await service.getProfiles(Role.EMPLOYEE);

            expect(mockUsersRepository.findAllByRole).toHaveBeenCalledWith(
                Role.EMPLOYEE,
            );
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(
                expect.objectContaining({
                    email: mockUser.email,
                    username: mockUser.username,
                    role: mockUser.role,
                }),
            );
        });

        it('should handle errors', async () => {
            mockUsersRepository.findAllByRole.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(service.getProfiles(Role.EMPLOYEE)).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    describe('getMyProfile', () => {
        it('should return the user profile', async () => {
            const profileUser = { id: '1' };
            mockUsersRepository.findOneById.mockResolvedValue(mockUser);

            const result = await service.getMyProfile(profileUser as any);

            expect(mockUsersRepository.findOneById).toHaveBeenCalledWith('1');
            expect(result).toEqual(
                expect.objectContaining({
                    email: mockUser.email,
                    username: mockUser.username,
                    role: mockUser.role,
                }),
            );
        });

        it('should throw InternalServerErrorException if user not found', async () => {
            const profileUser = { id: '999' };
            mockUsersRepository.findOneById.mockResolvedValue(null);

            await expect(
                service.getMyProfile(profileUser as any),
            ).rejects.toThrow(InternalServerErrorException);
        });

        it('should handle errors', async () => {
            const profileUser = { id: '1' };
            mockUsersRepository.findOneById.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(
                service.getMyProfile(profileUser as any),
            ).rejects.toThrow(InternalServerErrorException);
        });
    });

    describe('updateProfileImage', () => {
        it('should update the user profile image', async () => {
            const userId = '1';
            const file = { buffer: Buffer.from('test') } as any;
            const imageUrl = 'new-image.jpg';

            mockUploadService.uploadFile.mockResolvedValue(imageUrl);
            mockUsersRepository.updateProfileImage.mockResolvedValue(undefined);
            mockUsersRepository.findOneById.mockResolvedValue({
                ...mockUser,
                profileImage: imageUrl,
            });

            const result = await service.updateProfileImage(userId, file);

            expect(mockUploadService.uploadFile).toHaveBeenCalledWith(
                file,
                'users',
            );
            expect(mockUsersRepository.updateProfileImage).toHaveBeenCalledWith(
                userId,
                imageUrl,
            );
            expect(result).toEqual({
                message: 'Profile image uploaded successfully',
                user: expect.objectContaining({
                    id: '1',
                    username: 'testuser',
                    profileImage: imageUrl,
                }),
            });
        });
    });

    describe('sendFeedback', () => {
        it('should send feedback emails', async () => {
            const feedbackDto: FeedbackDto = {
                name: 'Test User',
                email: 'test@test.com',
                phone: '0123456789',
                message: 'Great service!',
            };

            mockConfigService.get.mockReturnValue('admin@example.com');
            mockMailerService.sendMail.mockResolvedValue(true);

            const result = await service.sendFeedback(feedbackDto);

            expect(mockConfigService.get).toHaveBeenCalledWith(
                'MEDIATOR_EMAIL',
            );
            expect(mockMailerService.sendMail).toHaveBeenCalledTimes(2);
            expect(result).toEqual({ message: 'Feedback sent successfully' });
        });

        it('should handle errors', async () => {
            const feedbackDto: FeedbackDto = {
                name: 'Test User',
                email: 'test@test.com',
                phone: '0123456789',
                message: 'Great service!',
            };

            mockConfigService.get.mockReturnValue('admin@example.com');
            mockMailerService.sendMail.mockRejectedValue(
                new Error('Email error'),
            );

            await expect(service.sendFeedback(feedbackDto)).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });
});
