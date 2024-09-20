import { validateAccessToken } from '../../Helper/validateRequestManager';
import { verifyToken } from '../../Helper/jwtManager'; 
import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../../Helper/errorManager';
import { JwtPayload } from 'jsonwebtoken';
import { AccessTokenRequest } from '../../Types/types';

/**
 * Mocking the jwtManager.
 */
jest.mock('../../Helper/jwtManager', () => ({
    verifyToken: jest.fn(),
}));

/**
 * Extending Express's Request interface to include user_id property.
 */
declare module 'express' {
    interface Request {
        user_id?: number;
    }
}

/**
 * Test suite for the validateAccessToken middleware function.
 */
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

    /**
     * Test case for handling missing authorization header.
     * It verifies that a CustomError is thrown with a 401 status.
     */
    it('should throw error if authorization header is missing', async () => {
        mockRequest.headers = {};

        await expect(() => validateAccessToken(mockRequest as Request, mockResponse as Response, mockNext))
            .rejects
            .toThrow(new CustomError('Please provide the access token', 401));
    });

    /**
     * Test case for handling invalid or expired tokens.
     * It verifies that the response status is set to 500 and the error message is returned.
     */
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

    /**
     * Test case for validating a valid access token.
     * It verifies that the user_id is set on the request and the next function is called.
     */
    it('should call next function if token is valid', async () => {
        const decodedPayload = { user_id: 123 } as JwtPayload;
        (verifyToken as jest.Mock).mockReturnValue(decodedPayload);

        await validateAccessToken(mockRequest as AccessTokenRequest, mockResponse as Response, mockNext);

        expect(verifyToken).toHaveBeenCalledWith('validAccessToken', process.env.AUTH_ACCESS_TOKEN_SECRET);
        expect(mockRequest.user_id).toBe(123);
        expect(mockNext).toHaveBeenCalled();
    });

    /**
     * Test case for handling decoded tokens that do not contain a user_id.
     * It verifies that a 401 status is set and an invalid token message is returned.
     */
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