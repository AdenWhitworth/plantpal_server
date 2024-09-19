import jwt from 'jsonwebtoken';
import { signToken, verifyToken } from '../../Helper/jwtManager';

jest.mock('jsonwebtoken');

describe('Token Utility Functions', () => {
    const mockPayload = { user_id: 1 };
    const mockSecret = 'testSecret';
    const mockExpiry = '1h';
    const mockToken = 'mockJwtToken';

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('signToken', () => {
        it('should sign a token with the correct payload, secret, and expiry', () => {
            (jwt.sign as jest.Mock).mockReturnValue(mockToken);

            const token = signToken(mockPayload, mockSecret, mockExpiry);

            expect(jwt.sign).toHaveBeenCalledWith(mockPayload, mockSecret, { expiresIn: mockExpiry });
            expect(token).toBe(mockToken);
        });
    });

    describe('verifyToken', () => {
        it('should return decoded token payload when token is valid', () => {
            const mockDecoded = { user_id: 123 };
            (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

            const result = verifyToken(mockToken, mockSecret);

            expect(jwt.verify).toHaveBeenCalledWith(mockToken, mockSecret);
            expect(result).toEqual(mockDecoded);
        });

        it('should throw an error with a custom message for invalid or expired tokens', () => {
            const mockError = new Error('jwt expired');
            (jwt.verify as jest.Mock).mockImplementation(() => {
                throw mockError;
            });

            expect(() => verifyToken(mockToken, mockSecret)).toThrow('Invalid or expired token: jwt expired');
        });

        it('should throw a general error if token verification fails for an unknown reason', () => {
            const mockUnknownError = { message: 'unknown error' };
            (jwt.verify as jest.Mock).mockImplementation(() => {
                throw mockUnknownError;
            });

            expect(() => verifyToken(mockToken, mockSecret)).toThrow('Token verification failed');
        });
    });
});
