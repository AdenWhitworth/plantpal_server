import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { signToken } from './jwtManager';
import {
    updateRefreshToken,
    updateResetToken,
} from '../MySQL/database';
import { User, GenerateAccessTokenFunction, GenerateRefreshTokenFunction, GenerateResetTokenFunction} from '../Types/types';

/**
 * Generates an access token for the given user.
 *
 * @param {User} user - The user for whom to generate the access token.
 * @returns {string} The generated access token.
 */
export const generateAccessToken :GenerateAccessTokenFunction = (user: User): string => {
    return signToken(
        { user_id: user.user_id },
        process.env.AUTH_ACCESS_TOKEN_SECRET as string,
        process.env.AUTH_ACCESS_TOKEN_EXPIRY as string
    );
}

/**
 * Generates a refresh token for the given user and saves/updates it in the database..
 *
 * @param {User} user - The user for whom to generate the refresh token.
 * @returns {Promise<string>} A promise that resolves to the generated refresh token.
 * @throws {Error} If there is an error generating the refresh token.
 */
export const generateRefreshToken: GenerateRefreshTokenFunction = async (user: User): Promise<string> => {
    try {
        const refreshToken = signToken(
            { user_id: user.user_id },
            process.env.AUTH_REFRESH_TOKEN_SECRET as string,
            process.env.AUTH_REFRESH_TOKEN_EXPIRY as string
        );
        
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

        await updateRefreshToken(user.user_id, hashedRefreshToken);

        return refreshToken;
    } catch (error) {
        throw new Error('Error generating refresh token');
    }
}

/**
 * Generates a password reset token for the given user and saves/updates it in the database.
 *
 * @param {User} user - The user for whom to generate the reset token.
 * @returns {Promise<string>} A promise that resolves to the generated reset token.
 * @throws {Error} If there is an error generating the reset token.
 */
export const generateResetToken: GenerateResetTokenFunction = async (user: User): Promise<string> => {
    try {
        const resetTokenValue = crypto.randomBytes(20).toString('base64url');
        const resetTokenSecret = crypto.randomBytes(10).toString('hex');
        const resetToken = `${resetTokenValue}+${resetTokenSecret}`;

        const expiryMinutes = parseInt(process.env.RESET_PASSWORD_TOKEN_EXPIRY_MINS as string, 10);
        const resetTokenExpiryTimestamp = Date.now() + (expiryMinutes * 60 * 1000);
        const formattedResetTokenExpiry = new Date(resetTokenExpiryTimestamp).toISOString().slice(0, 19).replace('T', ' ');

        const hashedResetToken = await bcrypt.hash(resetToken, 10);

        await updateResetToken(user.user_id, hashedResetToken, formattedResetTokenExpiry);

        return resetToken;
    } catch (error) {
        throw new Error('Error generating reset token');
    }
}