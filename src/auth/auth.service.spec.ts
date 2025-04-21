import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersRepository } from '../users/users.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { Role } from './enums/roles.enum';
import { UserSignUpDto } from './dtos/user-signup.dto';
import {
    UnauthorizedException,
    BadRequestException,
    NotFoundException,
    InternalServerErrorException,
} from '@nestjs/common';

describe('AuthService', () => {
    let service: AuthService;
    let usersRepository: jest.Mocked<Partial<UsersRepository>>;
    let jwtService: jest.Mocked<Partial<JwtService>>;
    let configService: jest.Mocked<Partial<ConfigService>>;
    let mailerService: jest.Mocked<Partial<MailerService>>;

    const mockUser = {
        id: 'user-id-1',
        email: 'test@example.com',
        username: 'testuser',
        role: Role.GUEST,
        password: 'hashedpassword',
        refreshToken: 'refresh-token',
        otp: null,
        otpExpiry: null,
        profileImage: 'profile.jpg',
        phone: '1234567890',
        loyaltyPoints: 100,
    };

    beforeEach(async () => {
        // Create mock implementations
        usersRepository = {
            findOneByEmail: jest.fn(),
            findOneById: jest.fn(),
            validatePassword: jest.fn(),
            updateRefreshToken: jest.fn(),
            updateOtp: jest.fn(),
            createCustomer: jest.fn(),
            findOneByRefreshToken: jest.fn(),
            deleteByRefreshToken: jest.fn(),
            findOneByOtp: jest.fn(),
            hashPassword: jest.fn(),
            updatePassword: jest.fn(),
        };

        jwtService = {
            signAsync: jest.fn(),
            decode: jest.fn(),
            verify: jest.fn(),
        };

        configService = {
            get: jest.fn(),
        };

        mailerService = {
            sendMail: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UsersRepository, useValue: usersRepository },
                { provide: JwtService, useValue: jwtService },
                { provide: ConfigService, useValue: configService },
                { provide: MailerService, useValue: mailerService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('validateUser', () => {
        it('should return user if credentials are valid', async () => {
            // @ts-expect-error - mock doesn't need to match full User type
            usersRepository.findOneByEmail.mockResolvedValue(mockUser);
            usersRepository.validatePassword.mockResolvedValue(true);

            const result = await service.validateUser(
                'test@example.com',
                'password123',
            );

            expect(result).toEqual(mockUser);
            expect(usersRepository.findOneByEmail).toHaveBeenCalledWith(
                'test@example.com',
            );
            expect(usersRepository.validatePassword).toHaveBeenCalledWith(
                'password123',
                mockUser,
            );
        });

        it('should return null if user not found', async () => {
            usersRepository.findOneByEmail.mockResolvedValue(null);

            const result = await service.validateUser(
                'nonexistent@example.com',
                'password123',
            );

            expect(result).toBeNull();
            expect(usersRepository.validatePassword).not.toHaveBeenCalled();
        });

        it('should return null if password is invalid', async () => {
            // @ts-expect-error - mock doesn't need to match full User type
            usersRepository.findOneByEmail.mockResolvedValue(mockUser);
            usersRepository.validatePassword.mockResolvedValue(false);

            const result = await service.validateUser(
                'test@example.com',
                'wrongpassword',
            );

            expect(result).toBeNull();
        });
    });

    describe('signIn', () => {
        it('should generate access and refresh tokens and update user', async () => {
            const loginUser = {
                id: mockUser.id,
                email: mockUser.email,
                username: mockUser.username,
                password: 'password123',
                role: mockUser.role,
            };

            jwtService.signAsync.mockResolvedValueOnce('new-access-token');
            jwtService.signAsync.mockResolvedValueOnce('new-refresh-token');
            configService.get.mockReturnValueOnce('at-secret');
            configService.get.mockReturnValueOnce('rt-secret');

            const result = await service.signIn(loginUser);

            expect(result).toEqual({
                accessToken: 'new-access-token',
                refreshToken: 'new-refresh-token',
            });

            expect(jwtService.signAsync).toHaveBeenCalledWith(
                {
                    id: mockUser.id,
                    email: mockUser.email,
                    username: mockUser.username,
                    role: mockUser.role,
                },
                {
                    expiresIn: '1h',
                    secret: 'at-secret',
                },
            );

            expect(jwtService.signAsync).toHaveBeenCalledWith(
                {
                    id: mockUser.id,
                    email: mockUser.email,
                    role: mockUser.role,
                },
                {
                    expiresIn: '7d',
                    secret: 'rt-secret',
                },
            );

            expect(usersRepository.updateRefreshToken).toHaveBeenCalledWith(
                mockUser.id,
                'new-refresh-token',
            );

            expect(usersRepository.updateOtp).toHaveBeenCalledWith(
                mockUser.id,
                null,
                null,
            );
        });
    });

    describe('signUp', () => {
        it('should create a new user if email is not taken', async () => {
            const signUpDto: UserSignUpDto = {
                username: 'newuser',
                email: 'newuser@example.com',
                password: 'Password123',
                phone: '9876543210',
            };

            usersRepository.findOneByEmail.mockResolvedValue(null);
            // @ts-expect-error - mock return value doesn't need full User properties
            usersRepository.createCustomer.mockResolvedValue({
                id: 'new-user-id',
                username: signUpDto.username,
                email: signUpDto.email,
                role: Role.GUEST,
                profileImage: 'default.jpg',
                phone: signUpDto.phone,
                loyaltyPoints: 0,
            });

            const result = await service.signUp(signUpDto);

            expect(result).toEqual({
                id: 'new-user-id',
                username: signUpDto.username,
                email: signUpDto.email,
                role: Role.GUEST,
                profileImage: 'default.jpg',
                phone: signUpDto.phone,
                loyaltyPoints: 0,
            });

            expect(usersRepository.findOneByEmail).toHaveBeenCalledWith(
                signUpDto.email,
            );
            expect(usersRepository.createCustomer).toHaveBeenCalledWith(
                signUpDto,
            );
        });

        it('should throw BadRequestException if email is already taken', async () => {
            const signUpDto: UserSignUpDto = {
                username: 'existinguser',
                email: 'existing@example.com',
                password: 'Password123',
                phone: '9876543210',
            };

            // @ts-expect-error - mock doesn't need to match full User type
            usersRepository.findOneByEmail.mockResolvedValue(mockUser);

            await expect(service.signUp(signUpDto)).rejects.toThrow(
                BadRequestException,
            );
            await expect(service.signUp(signUpDto)).rejects.toThrow(
                'User already exists',
            );
            expect(usersRepository.createCustomer).not.toHaveBeenCalled();
        });
    });

    describe('signOut', () => {
        it('should update refresh token to null', async () => {
            const user = {
                id: mockUser.id,
                email: mockUser.email,
                username: mockUser.username,
                role: mockUser.role,
                password: 'password123',
            };

            await service.signOut(user);

            expect(usersRepository.updateRefreshToken).toHaveBeenCalledWith(
                user.id,
                'null',
            );
        });
    });

    describe('getNewTokens', () => {
        it('should generate a new access token with valid refresh token', async () => {
            const refreshToken = 'valid-refresh-token';
            const decodedToken = {
                id: mockUser.id,
                email: mockUser.email,
                role: mockUser.role,
            };

            jwtService.decode.mockReturnValue(decodedToken);
            usersRepository.findOneByRefreshToken.mockResolvedValue(
                refreshToken,
            );
            jwtService.verify.mockReturnValue(decodedToken);
            // @ts-expect-error - mock doesn't need full User properties
            usersRepository.findOneByEmail.mockResolvedValue(mockUser);
            jwtService.signAsync.mockResolvedValue('new-access-token');
            configService.get.mockReturnValue('at-secret');

            const result = await service.getNewTokens(refreshToken);

            expect(result).toEqual({
                accessToken: 'new-access-token',
                refreshToken: refreshToken,
            });

            expect(jwtService.decode).toHaveBeenCalledWith(refreshToken);
            expect(usersRepository.findOneByRefreshToken).toHaveBeenCalledWith(
                mockUser.id,
            );
            expect(jwtService.verify).toHaveBeenCalledWith(refreshToken, {
                secret: configService.get('RT_SECRET'),
            });
            expect(usersRepository.findOneByEmail).toHaveBeenCalledWith(
                mockUser.email,
            );
            expect(jwtService.signAsync).toHaveBeenCalledWith(
                {
                    id: mockUser.id,
                    username: mockUser.username,
                    role: mockUser.role,
                },
                {
                    expiresIn: '1h',
                    secret: 'at-secret',
                },
            );
        });

        it('should throw UnauthorizedException if refresh token is invalid', async () => {
            const refreshToken = 'invalid-refresh-token';
            const decodedToken = {
                id: mockUser.id,
                email: mockUser.email,
                role: mockUser.role,
            };

            jwtService.decode.mockReturnValue(decodedToken);
            usersRepository.findOneByRefreshToken.mockResolvedValue(null);

            await expect(service.getNewTokens(refreshToken)).rejects.toThrow(
                UnauthorizedException,
            );
            await expect(service.getNewTokens(refreshToken)).rejects.toThrow(
                'Invalid refresh token',
            );
        });

        it('should throw UnauthorizedException if refresh token does not match stored token', async () => {
            const refreshToken = 'mismatched-refresh-token';
            const decodedToken = {
                id: mockUser.id,
                email: mockUser.email,
                role: mockUser.role,
            };

            jwtService.decode.mockReturnValue(decodedToken);
            usersRepository.findOneByRefreshToken.mockResolvedValue(
                'different-token',
            );

            await expect(service.getNewTokens(refreshToken)).rejects.toThrow(
                UnauthorizedException,
            );
            await expect(service.getNewTokens(refreshToken)).rejects.toThrow(
                'Your refresh token has been expired. Please log in again',
            );
        });

        it('should throw UnauthorizedException if user is not found', async () => {
            const refreshToken = 'valid-refresh-token';
            const decodedToken = {
                id: mockUser.id,
                email: mockUser.email,
                role: mockUser.role,
            };

            jwtService.decode.mockReturnValue(decodedToken);
            usersRepository.findOneByRefreshToken.mockResolvedValue(
                refreshToken,
            );
            jwtService.verify.mockReturnValue(decodedToken);
            usersRepository.findOneByEmail.mockResolvedValue(null);

            await expect(service.getNewTokens(refreshToken)).rejects.toThrow(
                UnauthorizedException,
            );
            await expect(service.getNewTokens(refreshToken)).rejects.toThrow(
                'User not found',
            );
        });
    });

    describe('forgotPassword', () => {
        it('should generate OTP and send email for valid user', async () => {
            // @ts-expect-error - mock doesn't need full User properties
            usersRepository.findOneByEmail.mockResolvedValue(mockUser);

            // Mock Math.random
            jest.spyOn(global.Math, 'random').mockReturnValue(0.5);

            await service.forgotPassword(mockUser.email);

            expect(usersRepository.findOneByEmail).toHaveBeenCalledWith(
                mockUser.email,
            );
            expect(usersRepository.updateOtp).toHaveBeenCalled();
            expect(mailerService.sendMail).toHaveBeenCalled();

            // Restore Math.random
            jest.spyOn(global.Math, 'random').mockRestore();
        });

        it('should throw InternalServerErrorException if user is not found', async () => {
            usersRepository.findOneByEmail.mockResolvedValue(null);

            await expect(
                service.forgotPassword('nonexistent@example.com'),
            ).rejects.toThrow(InternalServerErrorException);
            await expect(
                service.forgotPassword('nonexistent@example.com'),
            ).rejects.toThrow('User not found');
            expect(mailerService.sendMail).not.toHaveBeenCalled();
        });
    });

    describe('verifyOtp', () => {
        it('should verify valid OTP', async () => {
            const userWithOtp = {
                ...mockUser,
                otp: '123456',
                otpExpiry: new Date(Date.now() + 900000), // 15 minutes in the future
            };

            // @ts-expect-error - mock doesn't need full User properties
            usersRepository.findOneByOtp.mockResolvedValue(userWithOtp);

            await service.verifyOtp(mockUser.email, '123456');

            expect(usersRepository.findOneByOtp).toHaveBeenCalledWith(
                mockUser.email,
                '123456',
            );
        });

        it('should throw InternalServerErrorException if OTP is invalid', async () => {
            usersRepository.findOneByOtp.mockResolvedValue(null);

            await expect(
                service.verifyOtp(mockUser.email, '999999'),
            ).rejects.toThrow(InternalServerErrorException);
            await expect(
                service.verifyOtp(mockUser.email, '999999'),
            ).rejects.toThrow('Invalid OTP');
        });

        it('should throw InternalServerErrorException if OTP is expired', async () => {
            const userWithExpiredOtp = {
                ...mockUser,
                otp: '123456',
                otpExpiry: new Date(Date.now() - 900000), // 15 minutes in the past
            };

            // @ts-expect-error - mock doesn't need full User properties
            usersRepository.findOneByOtp.mockResolvedValue(userWithExpiredOtp);

            await expect(
                service.verifyOtp(mockUser.email, '123456'),
            ).rejects.toThrow(InternalServerErrorException);
            await expect(
                service.verifyOtp(mockUser.email, '123456'),
            ).rejects.toThrow('OTP expired');
        });
    });

    describe('changePassword', () => {
        it('should change password with valid credentials', async () => {
            // @ts-expect-error - mock doesn't need full User properties
            usersRepository.findOneById.mockResolvedValue(mockUser);
            usersRepository.validatePassword.mockResolvedValue(true);
            usersRepository.hashPassword.mockResolvedValue(
                'new-hashed-password',
            );

            await service.changePassword(
                mockUser.id,
                'currentPassword',
                'newPassword123',
                'newPassword123',
            );

            expect(usersRepository.findOneById).toHaveBeenCalledWith(
                mockUser.id,
            );
            expect(usersRepository.validatePassword).toHaveBeenCalledWith(
                'currentPassword',
                mockUser,
            );
            expect(usersRepository.hashPassword).toHaveBeenCalledWith(
                'newPassword123',
            );
            expect(usersRepository.updatePassword).toHaveBeenCalledWith(
                mockUser.email,
                'new-hashed-password',
            );
        });

        it('should throw NotFoundException if user is not found', async () => {
            usersRepository.findOneById.mockResolvedValue(null);

            await expect(
                service.changePassword(
                    'nonexistent-id',
                    'currentPassword',
                    'newPassword123',
                    'newPassword123',
                ),
            ).rejects.toThrow(NotFoundException);

            await expect(
                service.changePassword(
                    'nonexistent-id',
                    'currentPassword',
                    'newPassword123',
                    'newPassword123',
                ),
            ).rejects.toThrow('User not found');

            expect(usersRepository.updatePassword).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException if old password is invalid', async () => {
            // @ts-expect-error - mock doesn't need full User properties
            usersRepository.findOneById.mockResolvedValue(mockUser);
            usersRepository.validatePassword.mockResolvedValue(false);

            await expect(
                service.changePassword(
                    mockUser.id,
                    'wrongPassword',
                    'newPassword123',
                    'newPassword123',
                ),
            ).rejects.toThrow(BadRequestException);

            await expect(
                service.changePassword(
                    mockUser.id,
                    'wrongPassword',
                    'newPassword123',
                    'newPassword123',
                ),
            ).rejects.toThrow('Invalid old password');

            expect(usersRepository.updatePassword).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException if passwords do not match', async () => {
            // @ts-expect-error - mock doesn't need full User properties
            usersRepository.findOneById.mockResolvedValue(mockUser);
            usersRepository.validatePassword.mockResolvedValue(true);

            await expect(
                service.changePassword(
                    mockUser.id,
                    'currentPassword',
                    'newPassword123',
                    'differentPassword123',
                ),
            ).rejects.toThrow(BadRequestException);

            await expect(
                service.changePassword(
                    mockUser.id,
                    'currentPassword',
                    'newPassword123',
                    'differentPassword123',
                ),
            ).rejects.toThrow('Passwords do not match');

            expect(usersRepository.updatePassword).not.toHaveBeenCalled();
        });
    });
});
