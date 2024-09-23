"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwtManager_1 = require("../../Helper/jwtManager");
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
            jsonwebtoken_1.default.sign.mockReturnValue(mockToken);
            const token = (0, jwtManager_1.signToken)(mockPayload, mockSecret, mockExpiry);
            expect(jsonwebtoken_1.default.sign).toHaveBeenCalledWith(mockPayload, mockSecret, { expiresIn: mockExpiry });
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
            jsonwebtoken_1.default.verify.mockReturnValue(mockDecoded);
            const result = (0, jwtManager_1.verifyToken)(mockToken, mockSecret);
            expect(jsonwebtoken_1.default.verify).toHaveBeenCalledWith(mockToken, mockSecret);
            expect(result).toEqual(mockDecoded);
        });
        /**
         * Test case for handling invalid or expired tokens.
         * It verifies that a custom error message is thrown when the token is invalid or expired.
         */
        it('should throw an error with a custom message for invalid or expired tokens', () => {
            const mockError = new Error('jwt expired');
            jsonwebtoken_1.default.verify.mockImplementation(() => {
                throw mockError;
            });
            expect(() => (0, jwtManager_1.verifyToken)(mockToken, mockSecret)).toThrow('Invalid or expired token: jwt expired');
        });
        /**
         * Test case for handling unknown errors during token verification.
         * It verifies that a general error is thrown if token verification fails for an unknown reason.
         */
        it('should throw a general error if token verification fails for an unknown reason', () => {
            const mockUnknownError = { message: 'unknown error' };
            jsonwebtoken_1.default.verify.mockImplementation(() => {
                throw mockUnknownError;
            });
            expect(() => (0, jwtManager_1.verifyToken)(mockToken, mockSecret)).toThrow('Token verification failed');
        });
    });
});
