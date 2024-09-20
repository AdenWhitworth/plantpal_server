import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { TokenPayload } from '../Types/types';

/**
 * Signs a JWT token with the provided payload, secret, and expiry time.
 *
 * @param {TokenPayload} payload - The payload to encode in the token.
 * @param {string} secret - The secret key used to sign the token.
 * @param {string} expiry - The expiration time for the token (e.g., "1h", "2d").
 * @returns {string} The signed JWT token.
 */
export const signToken = (payload: TokenPayload, secret: string, expiry: string): string => {
    const signOptions: SignOptions = {
        expiresIn: expiry,
    };

    return jwt.sign(payload, secret, signOptions);
}

/**
 * Verifies a JWT token and returns the decoded payload.
 *
 * @param {string} token - The JWT token to verify.
 * @param {string} secret - The secret key used to verify the token.
 * @returns {JwtPayload|string} The decoded payload if verification is successful, or an error message if it fails.
 * @throws {Error} Throws an error if the token is invalid or expired.
 */
export const verifyToken = (token: string, secret: string): JwtPayload | string => {
    try {
        return jwt.verify(token, secret) as JwtPayload;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error('Invalid or expired token: ' + error.message);
        } else {
            throw new Error('Token verification failed');
        }
    }
}