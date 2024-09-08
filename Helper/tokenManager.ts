import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { signToken } from './jwtManager';
import {
    updateRefreshToken,
    updateResetToken,
} from '../MySQL/database';

interface User {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    last_login: string | null;
    refresh_token?: string | null;
    reset_token?: string | null;
    reset_token_expiry?: string | null;
    socket_id?: string | null;
}

export const generateAccessToken = (user: User): string => {
    return signToken(
        { user_id: user.user_id },
        process.env.AUTH_ACCESS_TOKEN_SECRET as string,
        process.env.AUTH_ACCESS_TOKEN_EXPIRY as string
    );
}

export const generateRefreshToken = async (user: User): Promise<string> => {
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
        console.error('Error generating refresh token:', error);
        throw new Error('Error generating refresh token');
    }
}

export const generateResetToken = async (user: User): Promise<string> => {
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
        console.error('Error generating reset token:', error);
        throw new Error('Error generating reset token');
    }
}