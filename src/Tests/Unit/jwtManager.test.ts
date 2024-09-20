import jwt from 'jsonwebtoken';
import { signToken, verifyToken } from '../../Helper/jwtManager';

/**
 * Mocking the jsonwebtoken.
 */
jest.mock('jsonwebtoken');

/**
 * Test suite for the token utility functions.
 */
describe('Token Utility Functions', () => {
    const mockPayload = { user_id: 1 };
    const mockSecret = 'testSecret';
    const mockExpiry = '1h';
    const mockToken = 'mockJwtToken';

    afterEach(() => {
        jest.clearAllMocks();
    });

    /**
     * Test suite for the `signToken` function.
     */
    describe('signToken', () => {
        /**
         * Test case for signing a token.
         * It verifies that the token is signed with the correct payload, secret, and expiry.
         */
        it('should sign a token with the correct payload, secret, and expiry', () => {
            (jwt.sign as jest.Mock).mockReturnValue(mockToken);

            const token = signToken(mockPayload, mockSecret, mockExpiry);

            expect(jwt.sign).toHaveBeenCalledWith(mockPayload, mockSecret, { expiresIn: mockExpiry });
            expect(token).toBe(mockToken);
        });
    });

    /**
     * Test suite for the `verifyToken` function.
     */
    describe('verifyToken', () => {
        /**
         * Test case for verifying a valid token.
         * It checks that the decoded token payload is returned when the token is valid.
         */
        it('should return decoded token payload when token is valid', () => {
            const mockDecoded = { user_id: 123 };
            (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

            const result = verifyToken(mockToken, mockSecret);

            expect(jwt.verify).toHaveBeenCalledWith(mockToken, mockSecret);
            expect(result).toEqual(mockDecoded);
        });

        /**
         * Test case for handling invalid or expired tokens.
         * It verifies that a custom error message is thrown when the token is invalid or expired.
         */
        it('should throw an error with a custom message for invalid or expired tokens', () => {
            const mockError = new Error('jwt expired');
            (jwt.verify as jest.Mock).mockImplementation(() => {
                throw mockError;
            });

            expect(() => verifyToken(mockToken, mockSecret)).toThrow('Invalid or expired token: jwt expired');
        });

        /**
         * Test case for handling unknown errors during token verification.
         * It verifies that a general error is thrown if token verification fails for an unknown reason.
         */
        it('should throw a general error if token verification fails for an unknown reason', () => {
            const mockUnknownError = { message: 'unknown error' };
            (jwt.verify as jest.Mock).mockImplementation(() => {
                throw mockUnknownError;
            });

            expect(() => verifyToken(mockToken, mockSecret)).toThrow('Token verification failed');
        });
    });
});
