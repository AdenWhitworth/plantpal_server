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
Object.defineProperty(exports, "__esModule", { value: true });
const validateRequestManager_1 = require("../../Helper/validateRequestManager");
const jwtManager_1 = require("../../Helper/jwtManager");
const errorManager_1 = require("../../Helper/errorManager");
/**
 * Mocking the jwtManager.
 */
jest.mock('../../Helper/jwtManager', () => ({
    verifyToken: jest.fn(),
}));
/**
 * Test suite for the validateAccessToken middleware function.
 */
describe('validateAccessToken', () => {
    let mockRequest;
    let mockResponse;
    let mockNext;
    beforeEach(() => {
        mockRequest = {
            headers: {
                authorization: 'Bearer validAccessToken',
            },
            user_id: 1,
        };
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
    it('should throw error if authorization header is missing', () => __awaiter(void 0, void 0, void 0, function* () {
        mockRequest.headers = {};
        yield expect(() => (0, validateRequestManager_1.validateAccessToken)(mockRequest, mockResponse, mockNext))
            .rejects
            .toThrow(new errorManager_1.CustomError('Please provide the access token', 401));
    }));
    /**
     * Test case for handling invalid or expired tokens.
     * It verifies that the response status is set to 500 and the error message is returned.
     */
    it('should throw error if token is invalid or expired', () => __awaiter(void 0, void 0, void 0, function* () {
        jwtManager_1.verifyToken.mockImplementation(() => {
            throw new Error('Token verification failed');
        });
        yield (0, validateRequestManager_1.validateAccessToken)(mockRequest, mockResponse, mockNext);
        expect(jwtManager_1.verifyToken).toHaveBeenCalledWith('validAccessToken', process.env.AUTH_ACCESS_TOKEN_SECRET);
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Token verification failed',
        }));
    }));
    /**
     * Test case for validating a valid access token.
     * It verifies that the user_id is set on the request and the next function is called.
     */
    it('should call next function if token is valid', () => __awaiter(void 0, void 0, void 0, function* () {
        const decodedPayload = { user_id: 123 };
        jwtManager_1.verifyToken.mockReturnValue(decodedPayload);
        yield (0, validateRequestManager_1.validateAccessToken)(mockRequest, mockResponse, mockNext);
        expect(jwtManager_1.verifyToken).toHaveBeenCalledWith('validAccessToken', process.env.AUTH_ACCESS_TOKEN_SECRET);
        expect(mockRequest.user_id).toBe(123);
        expect(mockNext).toHaveBeenCalled();
    }));
    /**
     * Test case for handling decoded tokens that do not contain a user_id.
     * It verifies that a 401 status is set and an invalid token message is returned.
     */
    it('should throw error if decoded token does not contain user_id', () => __awaiter(void 0, void 0, void 0, function* () {
        const decodedPayload = { some_other_field: 'value' };
        jwtManager_1.verifyToken.mockReturnValue(decodedPayload);
        yield (0, validateRequestManager_1.validateAccessToken)(mockRequest, mockResponse, mockNext);
        expect(jwtManager_1.verifyToken).toHaveBeenCalledWith('validAccessToken', process.env.AUTH_ACCESS_TOKEN_SECRET);
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Invalid access token',
        }));
    }));
});
