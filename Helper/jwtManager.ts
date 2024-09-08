import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';

interface TokenPayload {
    user_id: number;
}

export const signToken = (payload: TokenPayload, secret: string, expiry: string): string => {
    const signOptions: SignOptions = {
        expiresIn: expiry,
    };

    return jwt.sign(payload, secret, signOptions);
}

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