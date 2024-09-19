import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { signToken } from '../../Helper/jwtManager';
import { updateRefreshToken, updateResetToken } from '../../MySQL/database';
import {
    generateAccessToken,
    generateRefreshToken,
    generateResetToken
} from '../../Helper/tokenManager';

jest.mock('crypto');

jest.mock('bcryptjs');

jest.mock('../../Helper/jwtManager', () => ({
    signToken: jest.fn(),
}));

jest.mock('../../MySQL/database', () => ({
    updateResetToken: jest.fn(),
    updateRefreshToken: jest.fn()
}));

describe('Token Generation Functions', () => {
    const mockUser = {
        user_id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        password: 'hashed_password',
        last_login: null
    };

    beforeAll(() => {
        process.env.RESET_PASSWORD_TOKEN_EXPIRY_MINS = '15';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('generateAccessToken', () => {
        it('should generate an access token for the user', () => {
            const mockAccessToken = 'mock_access_token';
            (signToken as jest.Mock).mockReturnValue(mockAccessToken);

            const result = generateAccessToken(mockUser);

            expect(signToken).toHaveBeenCalledWith(
                { user_id: mockUser.user_id },
                process.env.AUTH_ACCESS_TOKEN_SECRET,
                process.env.AUTH_ACCESS_TOKEN_EXPIRY
            );
            expect(result).toBe(mockAccessToken);
        });
    });

    describe('generateRefreshToken', () => {
        it('should generate and hash a refresh token, and update the refresh token in the database', async () => {
            const mockRefreshToken = 'mock_refresh_token';
            const mockHashedRefreshToken = 'mock_hashed_refresh_token';
            (signToken as jest.Mock).mockReturnValue(mockRefreshToken);
            (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedRefreshToken);
            (updateRefreshToken as jest.Mock).mockResolvedValue(true);

            const result = await generateRefreshToken(mockUser);

            expect(signToken).toHaveBeenCalledWith(
                { user_id: mockUser.user_id },
                process.env.AUTH_REFRESH_TOKEN_SECRET,
                process.env.AUTH_REFRESH_TOKEN_EXPIRY
            );
            expect(bcrypt.hash).toHaveBeenCalledWith(mockRefreshToken, 10);
            expect(updateRefreshToken).toHaveBeenCalledWith(mockUser.user_id, mockHashedRefreshToken);
            expect(result).toBe(mockRefreshToken);
        });

        it('should throw an error if there is an issue generating the refresh token', async () => {
            (signToken as jest.Mock).mockReturnValue('mock_refresh_token');
            (bcrypt.hash as jest.Mock).mockRejectedValueOnce(new Error('Hashing error'));

            await expect(generateRefreshToken(mockUser)).rejects.toThrow('Error generating refresh token');
        });
    });

    describe('generateResetToken', () => {
        it('should generate, hash, and update the reset token in the database', async () => {
            const mockResetTokenValue = 'mock_reset_value';
            const mockResetTokenSecret = 'mock_reset_secret';
            const mockResetToken = `${mockResetTokenValue}+${mockResetTokenSecret}`;
            const mockHashedResetToken = 'mock_hashed_reset_token' as string;

            jest.spyOn(crypto, 'randomBytes')
                .mockImplementationOnce(() => mockResetTokenValue)
                .mockImplementationOnce(() => mockResetTokenSecret);


            (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedResetToken);
    
            (updateResetToken as jest.Mock).mockResolvedValue(true);
    
            const result = await generateResetToken(mockUser);
    
            expect(crypto.randomBytes).toHaveBeenCalledTimes(2);
            expect(bcrypt.hash).toHaveBeenCalledWith(mockResetToken, 10);
            expect(updateResetToken).toHaveBeenCalledWith(mockUser.user_id, mockHashedResetToken, expect.any(String));
            expect(result).toBe(mockResetToken);
        });

        it('should throw an error if there is an issue generating the reset token', async () => {
            const mockResetTokenValue = 'mock_reset_value';
            const mockResetTokenSecret = 'mock_reset_secret';

            jest.spyOn(crypto, 'randomBytes')
                .mockImplementationOnce(() => mockResetTokenValue)
                .mockImplementationOnce(() => mockResetTokenSecret);
    
            (bcrypt.hash as jest.Mock).mockRejectedValueOnce(new Error('Hashing error'));
    
            await expect(generateResetToken(mockUser)).rejects.toThrow('Error generating reset token');
        });
    });
});
