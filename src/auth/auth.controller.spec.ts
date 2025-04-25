import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from './enums/roles.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Response } from 'express';

describe('AuthController', () => {
    let controller: AuthController;
    let authService: jest.Mocked<Partial<AuthService>>;

    // Mock data
    const mockAccessToken = 'mock-access-token';
    const mockRefreshToken = 'mock-refresh-token';

    const mockUser = {
        id: 'user-id-1',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword',
        role: Role.GUEST,
    };

    // Mock response object
    const mockResponse = () => {
        const res: Partial<Response> = {};
        res.send = jest.fn().mockReturnValue(res);
        res.cookie = jest.fn().mockReturnValue(res);
        res.clearCookie = jest.fn().mockReturnValue(res);
        return res as Response;
    };

    beforeEach(async () => {
        // Create mock implementations
        authService = {
            signUp: jest.fn(),
            signIn: jest.fn(),
            signOut: jest.fn(),
            getNewTokens: jest.fn(),
            forgotPassword: jest.fn(),
            verifyOtp: jest.fn(),
            changePassword: jest.fn(),
            resetPassword: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                { provide: AuthService, useValue: authService },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn(),
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        signAsync: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('signUp', () => {
        it('should create a new user', async () => {
            const signUpDto = {
                username: 'newuser',
                email: 'newuser@example.com',
                password: 'Password123',
                phone: '9876543210',
            };

            const createdUser = {
                id: 'new-user-id',
                username: signUpDto.username,
                email: signUpDto.email,
                role: Role.GUEST,
            };

            authService.signUp.mockResolvedValue(createdUser);

            const res = mockResponse();
            await controller.signUp(signUpDto, res);

            expect(authService.signUp).toHaveBeenCalledWith(signUpDto);
            expect(res.send).toHaveBeenCalledWith({
                newUser: createdUser,
                message: 'User has been created successfully',
            });
        });

        it('should throw BadRequestException if user already exists', async () => {
            const signUpDto = {
                username: 'existinguser',
                email: 'existing@example.com',
                password: 'Password123',
                phone: '9876543210',
            };

            authService.signUp.mockRejectedValue(
                new BadRequestException('User already exists'),
            );

            const res = mockResponse();
            await expect(controller.signUp(signUpDto, res)).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('signIn', () => {
        it('should return access and refresh tokens on successful login', async () => {
            const expectedTokens = {
                accessToken: mockAccessToken,
                refreshToken: mockRefreshToken,
            };

            authService.signIn.mockResolvedValue(expectedTokens);

            const req = { user: mockUser };
            const res = mockResponse();

            await controller.signIn(req, res);

            expect(authService.signIn).toHaveBeenCalledWith(mockUser);
            expect((res.cookie as jest.Mock).mock.calls.length).toBeGreaterThan(
                0,
            );
            expect((res.cookie as jest.Mock).mock.calls[0]).toEqual([
                'refresh_token',
                mockRefreshToken,
                { httpOnly: true },
            ]);
            expect(res.send).toHaveBeenCalledWith({
                accessToken: mockAccessToken,
                refreshToken: mockRefreshToken,
                message: 'User has been signed in successfully',
            });
        });
    });

    describe('signOut', () => {
        it('should sign out the user and clear cookies', async () => {
            authService.signOut.mockResolvedValue(undefined);

            const req = { user: mockUser };
            const res = mockResponse();

            await controller.signOut(req, res);

            expect(authService.signOut).toHaveBeenCalledWith(mockUser);
            expect(
                (res.clearCookie as unknown as jest.Mock).mock.calls.length,
            ).toBeGreaterThan(0);
            expect(res.send).toHaveBeenCalledWith({
                message: 'User has been signed out successfully',
            });
        });
    });

    describe('refreshToken', () => {
        it('should refresh tokens with valid refresh token', async () => {
            const expectedTokens = {
                accessToken: 'new-access-token',
                refreshToken: 'new-refresh-token',
            };

            authService.getNewTokens.mockResolvedValue(expectedTokens);

            const req = {
                get: jest.fn().mockReturnValue(`Bearer ${mockRefreshToken}`),
                user: mockUser,
            };
            const res = mockResponse();

            await controller.refreshToken(req, res);

            expect(req.get).toHaveBeenCalledWith('Authorization');
            expect(authService.getNewTokens).toHaveBeenCalledWith(
                mockRefreshToken,
            );
            expect((res.cookie as jest.Mock).mock.calls.length).toBeGreaterThan(
                0,
            );
            expect((res.cookie as jest.Mock).mock.calls[0]).toEqual([
                'refresh_token',
                expectedTokens.refreshToken,
                { httpOnly: true },
            ]);
            expect(res.send).toHaveBeenCalledWith({
                accessToken: expectedTokens.accessToken,
                message: 'Access token has been refreshed successfully',
            });
        });
    });

    describe('forgotPassword', () => {
        it('should send OTP for password recovery', async () => {
            const forgotPasswordDto = {
                email: 'test@example.com',
            };

            authService.forgotPassword.mockResolvedValue(undefined);

            const req = { body: forgotPasswordDto };
            const res = mockResponse();

            await controller.forgotPassword(req, res);

            expect(authService.forgotPassword).toHaveBeenCalledWith(
                forgotPasswordDto.email,
            );
            expect(res.send).toHaveBeenCalledWith({
                message: 'Password recovery email has been sent successfully',
            });
        });

        it('should throw NotFoundException if user email is not found', async () => {
            const forgotPasswordDto = {
                email: 'nonexistent@example.com',
            };

            authService.forgotPassword.mockRejectedValue(
                new NotFoundException('User not found'),
            );

            const req = { body: forgotPasswordDto };
            const res = mockResponse();

            await expect(controller.forgotPassword(req, res)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('verifyOtp', () => {
        it('should verify OTP and return success message', async () => {
            const verifyOtpDto = {
                email: 'test@example.com',
                otp: '123456',
            };

            authService.verifyOtp.mockResolvedValue(undefined);

            const req = { body: verifyOtpDto };
            const res = mockResponse();

            await controller.verifyOtp(req, res);

            expect(authService.verifyOtp).toHaveBeenCalledWith(
                verifyOtpDto.email,
                verifyOtpDto.otp,
            );
            expect(res.send).toHaveBeenCalledWith({
                message: 'OTP has been verified successfully',
            });
        });

        it('should throw BadRequestException for invalid OTP', async () => {
            const verifyOtpDto = {
                email: 'test@example.com',
                otp: '999999',
            };

            authService.verifyOtp.mockRejectedValue(
                new BadRequestException('Invalid OTP'),
            );

            const req = { body: verifyOtpDto };
            const res = mockResponse();

            await expect(controller.verifyOtp(req, res)).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('changePassword', () => {
        it('should change password with valid credentials', async () => {
            const changePasswordDto = {
                oldPassword: 'OldPassword123',
                newPassword: 'NewPassword123',
                confirmPassword: 'NewPassword123',
            };

            authService.changePassword.mockResolvedValue(undefined);

            const req = {
                user: mockUser,
                body: changePasswordDto,
            };
            const res = mockResponse();

            await controller.changePassword(req, res);

            expect(authService.changePassword).toHaveBeenCalledWith(
                mockUser.id,
                changePasswordDto.oldPassword,
                changePasswordDto.newPassword,
                changePasswordDto.confirmPassword,
            );
            expect(res.send).toHaveBeenCalledWith({
                message: 'Password has been changed successfully',
            });
        });

        it('should throw BadRequestException for invalid old password', async () => {
            const changePasswordDto = {
                oldPassword: 'WrongPassword',
                newPassword: 'NewPassword123',
                confirmPassword: 'NewPassword123',
            };

            authService.changePassword.mockRejectedValue(
                new BadRequestException('Invalid old password'),
            );

            const req = {
                user: mockUser,
                body: changePasswordDto,
            };
            const res = mockResponse();

            await expect(controller.changePassword(req, res)).rejects.toThrow(
                BadRequestException,
            );
        });
    });
});
