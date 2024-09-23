"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwtManager_1 = require("../../Helper/jwtManager");
const database_1 = require("../../MySQL/database");
const tokenManager_1 = require("../../Helper/tokenManager");
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
            jwtManager_1.signToken.mockReturnValue(mockAccessToken);
            const result = (0, tokenManager_1.generateAccessToken)(mockUser);
            expect(jwtManager_1.signToken).toHaveBeenCalledWith({ user_id: mockUser.user_id }, process.env.AUTH_ACCESS_TOKEN_SECRET, process.env.AUTH_ACCESS_TOKEN_EXPIRY);
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
        it('should generate and hash a refresh token, and update the refresh token in the database', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockRefreshToken = 'mock_refresh_token';
            const mockHashedRefreshToken = 'mock_hashed_refresh_token';
            jwtManager_1.signToken.mockReturnValue(mockRefreshToken);
            bcryptjs_1.default.hash.mockResolvedValue(mockHashedRefreshToken);
            database_1.updateRefreshToken.mockResolvedValue(true);
            const result = yield (0, tokenManager_1.generateRefreshToken)(mockUser);
            expect(jwtManager_1.signToken).toHaveBeenCalledWith({ user_id: mockUser.user_id }, process.env.AUTH_REFRESH_TOKEN_SECRET, process.env.AUTH_REFRESH_TOKEN_EXPIRY);
            expect(bcryptjs_1.default.hash).toHaveBeenCalledWith(mockRefreshToken, 10);
            expect(database_1.updateRefreshToken).toHaveBeenCalledWith(mockUser.user_id, mockHashedRefreshToken);
            expect(result).toBe(mockRefreshToken);
        }));
        /**
         * Test case for generating a refresh token.
         * It verifies that error is thrown when the hash produces an error.
         */
        it('should throw an error if there is an issue generating the refresh token', () => __awaiter(void 0, void 0, void 0, function* () {
            jwtManager_1.signToken.mockReturnValue('mock_refresh_token');
            bcryptjs_1.default.hash.mockRejectedValueOnce(new Error('Hashing error'));
            yield expect((0, tokenManager_1.generateRefreshToken)(mockUser)).rejects.toThrow('Error generating refresh token');
        }));
    });
    /**
     * Test suite for the `generateResetToken` function.
     */
    describe('generateResetToken', () => {
        /**
         * Test case for generating a reset token.
         * It verifies that the reset token is generated, hashed, and updated in the database.
         */
        it('should generate, hash, and update the reset token in the database', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockResetTokenValue = 'mock_reset_value';
            const mockResetTokenSecret = 'mock_reset_secret';
            const mockResetToken = `${mockResetTokenValue}+${mockResetTokenSecret}`;
            const mockHashedResetToken = 'mock_hashed_reset_token';
            jest.spyOn(crypto_1.default, 'randomBytes')
                .mockImplementationOnce(() => mockResetTokenValue)
                .mockImplementationOnce(() => mockResetTokenSecret);
            bcryptjs_1.default.hash.mockResolvedValue(mockHashedResetToken);
            database_1.updateResetToken.mockResolvedValue(true);
            const result = yield (0, tokenManager_1.generateResetToken)(mockUser);
            expect(crypto_1.default.randomBytes).toHaveBeenCalledTimes(2);
            expect(bcryptjs_1.default.hash).toHaveBeenCalledWith(mockResetToken, 10);
            expect(database_1.updateResetToken).toHaveBeenCalledWith(mockUser.user_id, mockHashedResetToken, expect.any(String));
            expect(result).toBe(mockResetToken);
        }));
        /**
         * Test case for generating a reset token.
         * It verifies that error is thrown when the hash produces an error.
         */
        it('should throw an error if there is an issue generating the reset token', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockResetTokenValue = 'mock_reset_value';
            const mockResetTokenSecret = 'mock_reset_secret';
            jest.spyOn(crypto_1.default, 'randomBytes')
                .mockImplementationOnce(() => mockResetTokenValue)
                .mockImplementationOnce(() => mockResetTokenSecret);
            bcryptjs_1.default.hash.mockRejectedValueOnce(new Error('Hashing error'));
            yield expect((0, tokenManager_1.generateResetToken)(mockUser)).rejects.toThrow('Error generating reset token');
        }));
    });
});
