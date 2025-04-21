import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Role } from '../auth/enums/roles.enum';
import { BadRequestException } from '@nestjs/common';
import { CreateEmployeeDto } from './dtos/create-user.dto';
import { FeedbackDto } from './dtos/feedback.dto';
import { UpdateEmployeeDto, UpdateProfileDto } from './dtos/update-user.dto';
import { AccessControlService } from '../ac/ac.service';

describe('UsersController', () => {
    let controller: UsersController;
    let accessControlService: AccessControlService;
    // Mock user data
    const mockUsers = [
        {
            id: '1',
            email: 'test@test.com',
            username: 'testuser',
            role: Role.EMPLOYEE,
            phone: '0123456789',
            address: 'Test Address',
            birthdate: '1990-01-01',
            salary: 1000,
            image: 'test.jpg',
            workStart: '08:00',
            workEnd: '17:00',
            loyaltyPoints: 0,
        },
    ];

    const mockUsersService = {
        getProfiles: jest.fn(),
        getMyProfile: jest.fn(),
        sendFeedback: jest.fn(),
        updateProfile: jest.fn(),
        updateEmployee: jest.fn(),
        createEmployee: jest.fn(),
        deleteEmployee: jest.fn(),
        updateProfileImage: jest.fn(),
    };

    // Mock response object
    const mockResponse = {
        send: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                {
                    provide: UsersService,
                    useValue: mockUsersService,
                },
                {
                    provide: AccessControlService,
                    useValue: { log: jest.fn(), error: jest.fn() },
                },
            ],
        }).compile();

        controller = module.get<UsersController>(UsersController);

        // Reset all mocks
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getProfiles', () => {
        it('should return profiles filtered by role', async () => {
            mockUsersService.getProfiles.mockResolvedValue(mockUsers);

            await controller.getProfiles(Role.EMPLOYEE, mockResponse as any);

            expect(mockUsersService.getProfiles).toHaveBeenCalledWith(
                Role.EMPLOYEE,
            );
            expect(mockResponse.send).toHaveBeenCalledWith(mockUsers);
        });

        it('should throw BadRequestException for invalid role', async () => {
            await expect(
                controller.getProfiles(
                    'INVALID_ROLE' as Role,
                    mockResponse as any,
                ),
            ).rejects.toThrow(BadRequestException);

            expect(mockUsersService.getProfiles).not.toHaveBeenCalled();
        });
    });

    describe('getMyProfile', () => {
        it('should return the user profile', async () => {
            const mockUser = { id: '1', role: Role.EMPLOYEE };
            mockUsersService.getMyProfile.mockResolvedValue(mockUsers[0]);

            await controller.getMyProfile(
                { user: mockUser },
                mockResponse as any,
            );

            expect(mockUsersService.getMyProfile).toHaveBeenCalledWith(
                mockUser,
            );
            expect(mockResponse.send).toHaveBeenCalledWith(mockUsers[0]);
        });
    });

    describe('sendFeedback', () => {
        it('should send customer feedback', async () => {
            const feedbackDto: FeedbackDto = {
                name: 'Test User',
                email: 'test@test.com',
                phone: '0123456789',
                message: 'Great service!',
            };

            const expectedResult = { message: 'Feedback sent successfully' };
            mockUsersService.sendFeedback.mockResolvedValue(expectedResult);

            const result = await controller.sendFeedback(feedbackDto);

            expect(mockUsersService.sendFeedback).toHaveBeenCalledWith(
                feedbackDto,
            );
            expect(result).toEqual(expectedResult);
        });
    });

    describe('updateProfile', () => {
        it('should update guest profile', async () => {
            const mockUser = { id: '1', role: Role.GUEST };
            const updateDto: UpdateProfileDto = { username: 'New Username' };

            mockUsersService.updateProfile.mockResolvedValue({
                ...mockUsers[0],
                username: 'New Username',
            });

            const result = await controller.updateProfile(
                { user: mockUser },
                updateDto,
            );

            expect(mockUsersService.updateProfile).toHaveBeenCalledWith(
                '1',
                updateDto,
            );
            expect(result.username).toBe('New Username');
        });

        it('should update employee profile', async () => {
            const mockUser = { id: '1', role: Role.EMPLOYEE };
            const updateDto: UpdateProfileDto = { username: 'New Username' };

            mockUsersService.updateEmployee.mockResolvedValue({
                ...mockUsers[0],
                username: 'New Username',
            });

            const result = await controller.updateProfile(
                { user: mockUser },
                updateDto,
            );

            expect(mockUsersService.updateEmployee).toHaveBeenCalledWith(
                '1',
                updateDto,
            );
            expect(result.username).toBe('New Username');
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
                id: '2',
                role: Role.EMPLOYEE,
            };

            mockUsersService.createEmployee.mockResolvedValue(newEmployee);

            const result = await controller.createEmployee(createDto);

            expect(mockUsersService.createEmployee).toHaveBeenCalledWith(
                createDto,
            );
            expect(result).toEqual(newEmployee);
        });
    });

    describe('updateEmployee', () => {
        it('should update an employee', async () => {
            const employeeId = '1';
            const updateDto: UpdateEmployeeDto = { salary: 1500 };

            const updatedEmployee = {
                ...mockUsers[0],
                salary: 1500,
            };

            mockUsersService.updateEmployee.mockResolvedValue(updatedEmployee);

            const result = await controller.updateEmployee(
                employeeId,
                updateDto,
            );

            expect(mockUsersService.updateEmployee).toHaveBeenCalledWith(
                employeeId,
                updateDto,
            );
            expect(result.salary).toBe(1500);
        });
    });

    describe('deleteEmployee', () => {
        it('should delete an employee', async () => {
            const employeeId = '1';
            const expectedResult = { message: 'Employee deleted successfully' };

            mockUsersService.deleteEmployee.mockResolvedValue(expectedResult);

            const result = await controller.deleteEmployee(employeeId);

            expect(mockUsersService.deleteEmployee).toHaveBeenCalledWith(
                employeeId,
            );
            expect(result).toEqual(expectedResult);
        });
    });

    describe('uploadProfileImage', () => {
        it('should upload a profile image', async () => {
            const mockUser = { id: '1' };
            const mockFile = { buffer: Buffer.from('test') } as any;

            const expectedResult = {
                message: 'Profile image uploaded successfully',
                user: {
                    id: '1',
                    username: 'testuser',
                    profileImage: 'new-image.jpg',
                },
            };

            mockUsersService.updateProfileImage.mockResolvedValue(
                expectedResult,
            );

            const result = await controller.uploadProfileImage(
                { user: mockUser },
                mockFile,
            );

            expect(mockUsersService.updateProfileImage).toHaveBeenCalledWith(
                '1',
                mockFile,
            );
            expect(result).toEqual(expectedResult);
        });
    });
});
