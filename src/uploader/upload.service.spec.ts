import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { InternalServerErrorException } from '@nestjs/common';
import type { Multer } from 'multer';

// Mock S3 upload function and promise
const mockS3UploadPromise = jest.fn();
const mockS3Upload = jest.fn().mockReturnValue({
    promise: mockS3UploadPromise,
});

// Mock AWS SDK S3
jest.mock('aws-sdk', () => {
    return {
        S3: jest.fn().mockImplementation(() => ({
            upload: mockS3Upload,
        })),
    };
});

describe('UploadService', () => {
    let service: UploadService;
    let mockConfigService: jest.Mocked<ConfigService>;

    const mockFile = {
        originalname: 'test-image.jpg',
        buffer: Buffer.from('test-file-content'),
        mimetype: 'image/jpeg',
        size: 1024,
    } as Multer.File;

    beforeEach(async () => {
        // Reset and setup mocks
        jest.clearAllMocks();

        // Set up the mock response
        mockS3UploadPromise.mockResolvedValue({
            Location:
                'https://test-bucket.test-region.digitaloceanspaces.com/images/uuid-test-image.jpg',
        });

        mockConfigService = {
            get: jest.fn().mockImplementation((key: string) => {
                const config = {
                    DO_SPACES_ENDPOINT:
                        'https://test-region.digitaloceanspaces.com',
                    DO_SPACES_ACCESS_KEY: 'test-access-key',
                    DO_SPACES_SECRET_KEY: 'test-secret-key',
                    DO_SPACES_BUCKET: 'test-bucket',
                };
                return config[key];
            }),
        } as unknown as jest.Mocked<ConfigService>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UploadService,
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        service = module.get<UploadService>(UploadService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should initialize S3 client with correct configuration', () => {
        // Verify S3 was initialized with the correct configs
        expect(S3).toHaveBeenCalledWith({
            endpoint: 'https://test-region.digitaloceanspaces.com',
            accessKeyId: 'test-access-key',
            secretAccessKey: 'test-secret-key',
        });
    });

    describe('uploadFile', () => {
        it('should upload file to S3 successfully', async () => {
            // Mock uuid to return a predictable value
            jest.spyOn(global, 'Date').mockImplementation(
                () => new Date('2023-01-01'),
            );
            jest.mock('uuid', () => ({
                v4: jest.fn().mockReturnValue('mocked-uuid'),
            }));

            const result = await service.uploadFile(mockFile, 'images');

            // Verify S3 upload was called with correct parameters
            expect(mockS3Upload).toHaveBeenCalledWith({
                Bucket: 'test-bucket',
                Key: expect.stringContaining('images/'),
                Body: mockFile.buffer,
                ContentType: mockFile.mimetype,
                ACL: 'public-read',
            });

            // Check the key format
            const uploadParams = mockS3Upload.mock.calls[0][0];
            expect(uploadParams.Key).toMatch(
                /images\/[a-zA-Z0-9-]+-test-image.jpg/,
            );

            // Verify correct URL is returned
            expect(result).toMatch(
                /https:\/\/test-bucket\.test-region\.digitaloceanspaces\.com\/images\/.+/,
            );
        });

        it('should throw InternalServerErrorException if bucket name is not configured', async () => {
            // Mock to return null for bucket config
            mockConfigService.get.mockImplementation((key: string) => {
                if (key === 'DO_SPACES_BUCKET') return null;

                const config = {
                    DO_SPACES_ENDPOINT:
                        'https://test-region.digitaloceanspaces.com',
                    DO_SPACES_ACCESS_KEY: 'test-access-key',
                    DO_SPACES_SECRET_KEY: 'test-secret-key',
                };
                return config[key];
            });

            await expect(
                service.uploadFile(mockFile, 'images'),
            ).rejects.toThrow(InternalServerErrorException);
            await expect(
                service.uploadFile(mockFile, 'images'),
            ).rejects.toThrow('Bucket name is not configured');
        });

        it('should throw InternalServerErrorException if S3 upload fails', async () => {
            // Mock the S3 upload to reject with an error
            mockS3UploadPromise.mockRejectedValue(
                new Error('S3 upload failed'),
            );

            await expect(
                service.uploadFile(mockFile, 'images'),
            ).rejects.toThrow(InternalServerErrorException);
            await expect(
                service.uploadFile(mockFile, 'images'),
            ).rejects.toThrow('S3 upload failed');
        });

        it('should throw InternalServerErrorException with error code if S3 returns error code', async () => {
            // Mock the S3 upload to reject with an AWS error
            const awsError = { code: 'AccessDenied' };
            mockS3UploadPromise.mockRejectedValue(awsError);

            await expect(
                service.uploadFile(mockFile, 'images'),
            ).rejects.toThrow(InternalServerErrorException);
            await expect(
                service.uploadFile(mockFile, 'images'),
            ).rejects.toThrow('AccessDenied');
        });
    });
});
