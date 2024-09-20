import { validateAccessToken } from '../../Helper/validateRequestManager';
import { verifyToken } from '../../Helper/jwtManager'; 
import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../../Helper/errorManager';
import { JwtPayload } from 'jsonwebtoken';

jest.mock('../../Helper/jwtManager', () => ({
    verifyToken: jest.fn(),
}));

interface AccessTokenRequest extends Request {
    user_id?: number;
}

declare module 'express' {
    interface Request {
        user_id?: number;
    }
}

describe('validateAccessToken', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockRequest = {
            headers: {
                authorization: 'Bearer validAccessToken',
            },
            user_id: 1,
        } as Partial<AccessTokenRequest> as AccessTokenRequest;
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        mockNext = jest.fn();
    });

    beforeAll(() => {
        process.env.AUTH_ACCESS_TOKEN_SECRET = 'accessTokenSecret';
    });

    it('should throw error if authorization header is missing', async () => {
        mockRequest.headers = {};

        await expect(() => validateAccessToken(mockRequest as Request, mockResponse as Response, mockNext))
            .rejects
            .toThrow(new CustomError('Please provide the access token', 401));
    });

    it('should throw error if token is invalid or expired', async () => {
        (verifyToken as jest.Mock).mockImplementation(() => {
            throw new Error('Token verification failed');
        });

        await validateAccessToken(mockRequest as Request, mockResponse as Response, mockNext);

        expect(verifyToken).toHaveBeenCalledWith('validAccessToken', process.env.AUTH_ACCESS_TOKEN_SECRET);
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Token verification failed',
        }));

    });

    it('should call next function if token is valid', async () => {
        const decodedPayload = { user_id: 123 } as JwtPayload;
        (verifyToken as jest.Mock).mockReturnValue(decodedPayload);

        await validateAccessToken(mockRequest as AccessTokenRequest, mockResponse as Response, mockNext);

        expect(verifyToken).toHaveBeenCalledWith('validAccessToken', process.env.AUTH_ACCESS_TOKEN_SECRET);
        expect(mockRequest.user_id).toBe(123);
        expect(mockNext).toHaveBeenCalled();
    });

    it('should throw error if decoded token does not contain user_id', async () => {
        const decodedPayload = { some_other_field: 'value' } as JwtPayload;
        (verifyToken as jest.Mock).mockReturnValue(decodedPayload);

        await validateAccessToken(mockRequest as Request, mockResponse as Response, mockNext);

        expect(verifyToken).toHaveBeenCalledWith('validAccessToken', process.env.AUTH_ACCESS_TOKEN_SECRET);
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Invalid access token',
        }));
    });
});