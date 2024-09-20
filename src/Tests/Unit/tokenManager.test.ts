/**
 * @module TokenManagerTests
 */
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { signToken } from '../../Helper/jwtManager';
import { updateRefreshToken, updateResetToken } from '../../MySQL/database';
import {
    generateAccessToken,
    generateRefreshToken,
    generateResetToken
} from '../../Helper/tokenManager';

/**
 * Mocking the crypto.
 */
jest.mock('crypto');

/**
 * Mocking the bcryptjs.
 */
jest.mock('bcryptjs');

/**
 * Mocking the jwtManager.
 */
jest.mock('../../Helper/jwtManager', () => ({
    signToken: jest.fn(),
}));

/**
 * Mocking the database.
 */
jest.mock('../../MySQL/database', () => ({
    updateResetToken: jest.fn(),
    updateRefreshToken: jest.fn()
}));

/**
 * Test suite for token generation functions.
 */
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

    /**
     * Test suite for the `generateAccessToken` function.
     */
    describe('generateAccessToken', () => {
        /**
         * Test case for generating an access token for a user.
         * It verifies that the access token is correctly generated and signed.
         */
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

    /**
     * Test suite for the `generateRefreshToken` function.
     */
    describe('generateRefreshToken', () => {
        /**
         * Test case for generating a refresh token.
         * It verifies that the refresh token is generated, hashed, and updated in the database.
         */
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

        /**
         * Test case for generating a refresh token.
         * It verifies that error is thrown when the hash produces an error.
         */
        it('should throw an error if there is an issue generating the refresh token', async () => {
            (signToken as jest.Mock).mockReturnValue('mock_refresh_token');
            (bcrypt.hash as jest.Mock).mockRejectedValueOnce(new Error('Hashing error'));

            await expect(generateRefreshToken(mockUser)).rejects.toThrow('Error generating refresh token');
        });
    });

    /**
     * Test suite for the `generateResetToken` function.
     */
    describe('generateResetToken', () => {
        /**
         * Test case for generating a reset token.
         * It verifies that the reset token is generated, hashed, and updated in the database.
         */
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

        /**
         * Test case for generating a reset token.
         * It verifies that error is thrown when the hash produces an error.
         */
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
