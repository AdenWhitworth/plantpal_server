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
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../../app");
const tokenManager_1 = require("../../Helper/tokenManager");
const database_1 = require("../../MySQL/database");
const emailManager_1 = require("../../Helper/emailManager");
const bcryptjs_1 = require("bcryptjs");
const jwtManager_1 = require("../../Helper/jwtManager");
/**
 * Mocking the socket.
 */
jest.mock('../../Helper/emailManager', () => ({
    sendEmail: jest.fn(),
}));
/**
 * Mocking the jwtManager.
 */
jest.mock('../../Helper/jwtManager', () => ({
    verifyToken: jest.fn(),
}));
/**
 * Mocking the database.
 */
jest.mock('../../MySQL/database', () => ({
    getUserByEmail: jest.fn(),
    createUser: jest.fn(),
    updateUserInfo: jest.fn(),
    clearResetToken: jest.fn(),
    getUserById: jest.fn(),
    updateLastLoginTime: jest.fn(),
    updateUserPassword: jest.fn()
}));
/**
 * Mocking the tokenManager.
 */
jest.mock('../../Helper/tokenManager', () => ({
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    generateResetToken: jest.fn(),
}));
/**
 * Mocking the bcryptjs.
 */
jest.mock('bcryptjs', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));
/**
 * Mocking the aws-sdk.
 */
jest.mock('aws-sdk', () => {
    const mockAWS = {
        config: {
            update: jest.fn(),
        },
    };
    return Object.assign(Object.assign({}, mockAWS), { IotData: jest.fn().mockImplementation(() => ({
            publish: jest.fn((params, callback) => callback(null, {})),
        })) });
});
/**
 * Integration tests for the Auth Router.
 */
describe('Auth Router Integration Tests', () => {
    const expiryMinutes = 15;
    const resetTokenExpiryTimestamp = Date.now() + (expiryMinutes * 60 * 1000);
    const formattedResetTokenExpiry = new Date(resetTokenExpiryTimestamp).toISOString();
    const testUser = {
        user_id: 1,
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        hashPassword: 'mockHashedPassword',
        refresh_token: 'mockRefreshToken',
        reset_token_expiry: formattedResetTokenExpiry,
        reset_token: 'mockResetToken%20resetTokenSecret',
        accessToken: 'mockAccessToken',
        invalidAccessToken: 'mockInvalidAccessToken'
    };
    beforeAll(() => {
        app_1.server.close();
    });
    afterAll(() => {
        app_1.server.close();
    });
    beforeAll(() => {
        process.env.EMAIL_FROM = 'server@gmail.com';
        process.env.AUTH_ACCESS_TOKEN_SECRET = 'accessTokenSecret';
        process.env.API_CLIENT_KEY = 'apiKey';
        process.env.AUTH_REFRESH_TOKEN_SECRET = 'refreshTokenSecret';
        process.env.BASE_URL = 'http://localhost:3000';
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });
    /**
     * Test case for user registration.
     * It verifies that a user can successfully register with valid details and receive the expected response.
     */
    test('POST/register should register a new user successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        database_1.createUser.mockResolvedValue({
            first_name: testUser.first_name,
            last_name: testUser.last_name,
            email: testUser.email,
            password: testUser.hashPassword
        });
        bcryptjs_1.hash.mockResolvedValue(testUser.hashPassword);
        const response = yield (0, supertest_1.default)(app_1.app)
            .post('/users/register')
            .set('x-api-key', process.env.API_CLIENT_KEY)
            .send({
            first_name: testUser.first_name,
            last_name: testUser.last_name,
            email: testUser.email,
            password: testUser.password,
        });
        expect(response.status).toBe(201);
        expect(response.body.message).toBe('The user has been registered with us!');
        expect(database_1.createUser).toHaveBeenCalledWith(testUser.first_name, testUser.last_name, testUser.email, testUser.hashPassword);
    }));
    /**
     * Test case for user registration.
     * It verifies that a user cannot register without a valid api key.
     */
    test('POST/register should handle missing api key', () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app_1.app)
            .post('/users/register')
            .send({
            first_name: testUser.first_name,
            last_name: testUser.last_name,
            email: testUser.email,
            password: testUser.password,
        });
        expect(response.status).toBe(400);
        expect(response.body.errors).toEqual({
            "x-api-key": "Invalid API key",
        });
    }));
    /**
     * Test case for user registration.
     * It verifies that a user cannot register with invalid details and receive the expected error response.
     */
    test('POST/register should not register a user with an existing email', () => __awaiter(void 0, void 0, void 0, function* () {
        database_1.getUserByEmail.mockResolvedValue({ user_id: testUser.user_id, password: testUser.hashPassword });
        const response = yield (0, supertest_1.default)(app_1.app)
            .post('/users/register')
            .set('x-api-key', process.env.API_CLIENT_KEY)
            .send({
            first_name: testUser.first_name,
            last_name: testUser.last_name,
            email: testUser.email,
            password: testUser.password,
        });
        expect(response.status).toBe(409);
        expect(response.body.message).toBe('This user is already in use!');
    }));
    /**
     * Test case for user login.
     * It verifies that a user can successfully login with valid credentials and receive the access token in the response.
     */
    test('POST/login should login successfully and return tokens', () => __awaiter(void 0, void 0, void 0, function* () {
        database_1.getUserByEmail.mockResolvedValue({
            user_id: testUser.user_id,
            password: testUser.hashPassword
        });
        bcryptjs_1.compare.mockResolvedValue(true);
        tokenManager_1.generateAccessToken.mockImplementation(() => {
            return testUser.accessToken;
        });
        tokenManager_1.generateRefreshToken.mockResolvedValue(testUser.refresh_token);
        database_1.updateLastLoginTime.mockResolvedValue({
            user_id: testUser.user_id
        });
        const response = yield (0, supertest_1.default)(app_1.app)
            .post('/users/login')
            .set('x-api-key', process.env.API_CLIENT_KEY)
            .send({
            email: testUser.email,
            password: testUser.password,
        });
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('The user has been logged in!');
        expect(response.body.accessToken).toBe(testUser.accessToken);
        expect(response.headers['set-cookie']).toBeDefined();
    }));
    /**
     * Test case for user login.
     * It verifies that a user cannot login with invalid api key.
     */
    test('POST/login should handle missing api key', () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app_1.app)
            .post('/users/login')
            .send({
            email: testUser.email,
            password: testUser.password,
        });
        expect(response.status).toBe(400);
        expect(response.body.errors).toEqual({
            "x-api-key": "Invalid API key",
        });
    }));
    /**
     * Test case for user login.
     * It verifies that a user cannot login with invalid email and receive the error response.
     */
    test('login should handle login of user who doesnt exist', () => __awaiter(void 0, void 0, void 0, function* () {
        database_1.getUserByEmail.mockResolvedValue({
            user_id: testUser.user_id,
            password: testUser.hashPassword
        });
        bcryptjs_1.compare.mockResolvedValue(false);
        const response = yield (0, supertest_1.default)(app_1.app)
            .post('/users/login')
            .set('x-api-key', process.env.API_CLIENT_KEY)
            .send({
            email: testUser.email,
            password: testUser.password,
        });
        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Email or password is incorrect!');
    }));
    /**
     * Test case for user login.
     * It verifies that a user cannot login with invalid password and receive the error response.
     */
    test('login should handle login of user with incorrect password', () => __awaiter(void 0, void 0, void 0, function* () {
        database_1.getUserByEmail.mockResolvedValue(null);
        const response = yield (0, supertest_1.default)(app_1.app)
            .post('/users/login')
            .set('x-api-key', process.env.API_CLIENT_KEY)
            .send({
            email: testUser.email,
            password: testUser.password,
        });
        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Email or password is incorrect!');
    }));
    /**
     * Test case for updating user information.
     * It verifies that a user can update their personal information and receive the updated data in the response.
     */
    test('POST/updateUser should update user information successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        database_1.updateUserInfo.mockResolvedValue({
            user_id: testUser.user_id,
            password: testUser.hashPassword,
            first_name: testUser.first_name,
            last_name: testUser.last_name,
            email: testUser.email,
        });
        jwtManager_1.verifyToken.mockImplementation((token, secret) => {
            return { user_id: testUser.user_id };
        });
        const response = yield (0, supertest_1.default)(app_1.app)
            .post('/users/updateUser')
            .set('Authorization', `Bearer ${testUser.accessToken}`)
            .send({
            first_name: testUser.first_name,
            last_name: testUser.last_name,
            email: testUser.email
        });
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('User updated successfully');
        expect(database_1.updateUserInfo).toHaveBeenCalledWith(testUser.user_id, testUser.first_name, testUser.last_name, testUser.email);
    }));
    /**
     * Test case for updating user information.
     * It verifies that a user cannot update their personal information with invalid access token and receive the error response.
     */
    test('POST/updateUser should handle a failed update to the users information', () => __awaiter(void 0, void 0, void 0, function* () {
        jwtManager_1.verifyToken.mockImplementation((token, secret) => {
            return { user_id: null };
        });
        const response = yield (0, supertest_1.default)(app_1.app)
            .post('/users/updateUser')
            .set('Authorization', `Bearer ${testUser.accessToken}`)
            .send({
            first_name: testUser.first_name,
            last_name: testUser.last_name,
            email: testUser.email
        });
        expect(response.status).toBe(401);
        expect(response.body.message).toBe('User update unsuccessful.');
    }));
    /**
     * Test case for updating user information.
     * It verifies that a user update to the personal information matches the database and receive the error response.
     */
    test('POST/updateUser should handle database mismatch errors when updating user information', () => __awaiter(void 0, void 0, void 0, function* () {
        database_1.updateUserInfo.mockResolvedValue({
            user_id: testUser.user_id,
            password: testUser.hashPassword,
            first_name: "WrongFirst",
            last_name: "WrongLast",
            email: "WrongEmail",
        });
        jwtManager_1.verifyToken.mockImplementation((token, secret) => {
            return { user_id: testUser.user_id };
        });
        const response = yield (0, supertest_1.default)(app_1.app)
            .post('/users/updateUser')
            .set('Authorization', `Bearer ${testUser.accessToken}`)
            .send({
            first_name: testUser.first_name,
            last_name: testUser.last_name,
            email: testUser.email
        });
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('User update unsuccessful.');
    }));
    /**
     * Test case for token refresh.
     * It verifies that the refresh token can be used to obtain a new access token after the previous one expires.
     */
    test('POST/refreshAccessToken should refresh access token successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        database_1.getUserById.mockResolvedValue({
            user_id: testUser.user_id,
            refresh_token: testUser.refresh_token
        });
        jwtManager_1.verifyToken.mockImplementation((token, secret) => {
            return { user_id: testUser.user_id };
        });
        tokenManager_1.generateAccessToken.mockResolvedValue(testUser.accessToken);
        bcryptjs_1.compare.mockResolvedValue(true);
        const response = yield (0, supertest_1.default)(app_1.app)
            .post('/users/refreshAccessToken')
            .set('Cookie', `refreshToken=${testUser.refresh_token}`)
            .set('x-api-key', process.env.API_CLIENT_KEY);
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Refreshed access token');
        expect(response.body.accessToken).toBeDefined();
    }));
    /**
     * Test case for token refresh.
     * It verifies that the refresh token cannot be used to obtain a new access token without valid api key.
     */
    test('POST/refreshAccessToken should handle missing api key', () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app_1.app)
            .post('/users/refreshAccessToken')
            .set('Cookie', `refreshToken=${testUser.refresh_token}`);
        expect(response.status).toBe(400);
        expect(response.body.errors).toEqual({
            "x-api-key": "Invalid API key",
        });
    }));
    /**
     * Test case for token refresh.
     * It verifies that the refresh token cannot be used to obtain a new access token
     * without the refresh token in the cookies.
     */
    test('POST/refreshAccessToken should handle missing refresh token in cookies', () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app_1.app)
            .post('/users/refreshAccessToken')
            .set('x-api-key', process.env.API_CLIENT_KEY);
        expect(response.status).toBe(400);
        expect(response.body.errors).toEqual({ "refreshToken": "Refresh token cannot be empty" });
    }));
    /**
     * Test case for token refresh.
     * It verifies that the refresh token cannot be used to obtain a new access token
     * without a valid refresh token.
     */
    test('POST/refreshAccessToken should handle incorrect refresh token', () => __awaiter(void 0, void 0, void 0, function* () {
        database_1.getUserById.mockResolvedValue({
            user_id: testUser.user_id,
            refresh_token: testUser.refresh_token
        });
        jwtManager_1.verifyToken.mockImplementation((token, secret) => {
            return { user_id: testUser.user_id };
        });
        bcryptjs_1.compare.mockResolvedValue(false);
        const response = yield (0, supertest_1.default)(app_1.app)
            .post('/users/refreshAccessToken')
            .set('x-api-key', process.env.API_CLIENT_KEY)
            .set('Cookie', `refreshToken=${testUser.refresh_token}`);
        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Refresh token not found, please login again');
    }));
    /**
     * Test case for token refresh.
     * It verifies that the refresh token cannot be used to obtain a new access token
     * without a valid user id.
     */
    test('POST/refreshAccessToken should handle determine a user doesnt exist for the refresh token', () => __awaiter(void 0, void 0, void 0, function* () {
        database_1.getUserById.mockResolvedValue(null);
        jwtManager_1.verifyToken.mockImplementation((token, secret) => {
            return { user_id: testUser.user_id };
        });
        const response = yield (0, supertest_1.default)(app_1.app)
            .post('/users/refreshAccessToken')
            .set('Cookie', `refreshToken=${testUser.refresh_token}`)
            .set('x-api-key', process.env.API_CLIENT_KEY);
        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Refresh token not found, please login again');
    }));
    /**
     * Test case for password reset request.
     * It verifies that a password reset request can be initiated for a registered user, and the appropriate email is sent.
     */
    test('POST/forgotPassword should send a reset password email successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        database_1.getUserByEmail.mockResolvedValue({
            user_id: testUser.user_id,
            password: testUser.hashPassword
        });
        tokenManager_1.generateResetToken.mockResolvedValue(testUser.reset_token);
        const expectedEmail = {
            to: testUser.email,
            subject: 'PlantPal Password Reset Request',
            text: expect.stringContaining(`${process.env.BASE_URL}/resetPassword?resetToken=${testUser.reset_token}&user_id=${testUser.user_id}`)
        };
        emailManager_1.sendEmail.mockResolvedValue(expectedEmail);
        const response = yield (0, supertest_1.default)(app_1.app)
            .post('/users/forgotPassword')
            .set('x-api-key', process.env.API_CLIENT_KEY)
            .send({
            email: testUser.email,
        });
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Reset password email sent successfully');
        expect(emailManager_1.sendEmail).toHaveBeenCalledWith(expect.objectContaining(expectedEmail));
    }));
    /**
     * Test case for password reset request.
     * It verifies that a password reset request cannot be initiated for a registered user without valid api key.
     */
    test('POST/forgotPassword should handle missing api key', () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app_1.app)
            .post('/users/forgotPassword')
            .send({
            email: testUser.email,
        });
        expect(response.status).toBe(400);
        expect(response.body.errors).toEqual({
            "x-api-key": "Invalid API key",
        });
    }));
    /**
     * Test case for password reset request.
     * It verifies that a password reset request cannot be initiated for an unregistered user, but passes successful response.
     */
    test('POST/forgotPassword should not alert user of error if user does not exist for password reset link', () => __awaiter(void 0, void 0, void 0, function* () {
        database_1.getUserByEmail.mockResolvedValue(null);
        const response = yield (0, supertest_1.default)(app_1.app)
            .post('/users/forgotPassword')
            .set('x-api-key', process.env.API_CLIENT_KEY)
            .send({
            email: testUser.email,
        });
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Reset password email sent successfully');
    }));
    /**
     * Test case for password reset completion.
     * It verifies that a user can successfully reset their password and login with the new credentials.
     */
    test('POST/resetPassword should reset password successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        const newHashPassword = "newMockHashedPassword";
        database_1.clearResetToken;
        database_1.getUserById.mockResolvedValue({
            user_id: testUser.user_id,
            reset_token_expiry: testUser.reset_token_expiry,
            reset_token: testUser.reset_token,
            email: testUser.email
        });
        bcryptjs_1.compare.mockResolvedValue(true);
        bcryptjs_1.hash.mockResolvedValue(newHashPassword);
        const expectedEmail = {
            to: testUser.email,
            subject: 'PlantPal Password Changed',
            html: expect.stringContaining("This is a confirmation that you have changed Password for your account with PlantPal.")
        };
        emailManager_1.sendEmail.mockResolvedValue(expectedEmail);
        const response = yield (0, supertest_1.default)(app_1.app)
            .post('/users/resetPassword')
            .set('x-api-key', process.env.API_CLIENT_KEY)
            .send({
            password: 'newpassword123',
            resetToken: testUser.reset_token,
            user_id: testUser.user_id,
        });
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Password reset successfully');
        expect(emailManager_1.sendEmail).toHaveBeenCalledWith(expect.objectContaining(expectedEmail));
        expect(database_1.updateUserPassword).toHaveBeenCalledWith(testUser.user_id, newHashPassword);
    }));
    /**
     * Test case for password reset completion.
     * It verifies that a user cannot reset their password with an invalid api key.
     */
    test('POST/resetPassword should handle missing api key', () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app_1.app)
            .post('/users/resetPassword')
            .send({
            password: 'newpassword123',
            resetToken: testUser.reset_token,
            user_id: testUser.user_id,
        });
        expect(response.status).toBe(400);
        expect(response.body.errors).toEqual({
            "x-api-key": "Invalid API key",
        });
    }));
    /**
     * Test case for password reset completion.
     * It verifies that a user cannot reset their password with an expired reset token.
     */
    test('POST/resetPassword should handle invalid reset password request due to timeout', () => __awaiter(void 0, void 0, void 0, function* () {
        const expiredResetTokenDate = "2024-01-01T00:00:00Z";
        database_1.clearResetToken;
        database_1.getUserById.mockResolvedValue({
            user_id: testUser.user_id,
            reset_token_expiry: expiredResetTokenDate,
            reset_token: testUser.reset_token,
            email: testUser.email
        });
        bcryptjs_1.compare.mockResolvedValue(true);
        const response = yield (0, supertest_1.default)(app_1.app)
            .post('/users/resetPassword')
            .set('x-api-key', process.env.API_CLIENT_KEY)
            .send({
            password: 'newpassword123',
            resetToken: 'invalidtoken',
            user_id: testUser.user_id,
        });
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Invalid or expired token');
    }));
    /**
     * Test case for password reset completion.
     * It verifies that a user cannot reset their password with an incorrect reset token.
     */
    test('POST/resetPassword should handle invalid reset password request due to token mismatch', () => __awaiter(void 0, void 0, void 0, function* () {
        bcryptjs_1.compare.mockResolvedValue(false);
        database_1.clearResetToken;
        const response = yield (0, supertest_1.default)(app_1.app)
            .post('/users/resetPassword')
            .set('x-api-key', process.env.API_CLIENT_KEY)
            .send({
            password: 'newpassword123',
            resetToken: 'invalidtoken',
            user_id: testUser.user_id,
        });
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Invalid or expired token');
    }));
});
