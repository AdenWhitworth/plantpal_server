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
const express_validator_1 = require("express-validator");
const validateRequestManager_1 = require("../../Helper/validateRequestManager");
/**
 * Mocking the express-validator.
 */
jest.mock('express-validator', () => {
    return {
        check: jest.fn(() => {
            return {
                not: jest.fn(() => ({
                    isEmpty: jest.fn(() => ({
                        run: jest.fn(),
                    })),
                })),
                isEmail: jest.fn(() => ({
                    normalizeEmail: jest.fn(() => ({
                        run: jest.fn(),
                    })),
                    run: jest.fn(),
                })),
                isLength: jest.fn(() => ({
                    run: jest.fn(),
                })),
                custom: jest.fn(() => ({
                    run: jest.fn(),
                })),
            };
        }),
        cookie: jest.fn(() => ({
            exists: jest.fn(() => ({
                withMessage: jest.fn(() => ({
                    notEmpty: jest.fn(() => ({
                        withMessage: jest.fn(() => ({
                            run: jest.fn(),
                        })),
                    })),
                })),
            })),
        })),
        validationResult: jest.fn(),
        body: jest.fn(),
    };
});
/**
 * Test suite for the validateRequest middleware function.
 */
describe('validateRequest middleware', () => {
    let req;
    let res;
    let next;
    let mockValidationChain;
    beforeEach(() => {
        process.env.API_CLIENT_KEY = 'apiClientKey';
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
        mockValidationChain = {
            run: jest.fn().mockResolvedValue(null),
        };
        express_validator_1.validationResult.mockReset();
        express_validator_1.check.mockClear();
    });
    /**
     * Test case for handling successful validation.
     * It verifies that the next function is called if there are no validation errors.
     */
    it('should call next() if there are no validation errors', () => __awaiter(void 0, void 0, void 0, function* () {
        express_validator_1.validationResult.mockReturnValueOnce({
            isEmpty: jest.fn().mockReturnValue(true),
        });
        const middleware = (0, validateRequestManager_1.validateRequest)([mockValidationChain]);
        yield middleware(req, res, next);
        expect(express_validator_1.validationResult).toHaveBeenCalledWith(req);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    }));
    /**
     * Test case for handling validation failures.
     * It verifies that a 400 status is returned along with the validation errors.
     */
    it('should return 400 and validation errors if validation fails', () => __awaiter(void 0, void 0, void 0, function* () {
        express_validator_1.validationResult.mockReturnValueOnce({
            isEmpty: jest.fn().mockReturnValue(false),
            array: jest.fn().mockReturnValue([
                { path: 'email', msg: 'Invalid email' },
                { path: 'password', msg: 'Password must be 6 characters' },
            ]),
        });
        const middleware = (0, validateRequestManager_1.validateRequest)([mockValidationChain]);
        yield middleware(req, res, next);
        expect(express_validator_1.validationResult).toHaveBeenCalledWith(req);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            errors: {
                email: 'Invalid email',
                password: 'Password must be 6 characters',
            },
        });
    }));
    /**
     * Test case for handling validation errors that lack a path.
     * It verifies that an error is logged and only relevant validation errors are returned.
     */
    it('should log an error and not include it if validation error has no path', () => __awaiter(void 0, void 0, void 0, function* () {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        express_validator_1.validationResult.mockReturnValueOnce({
            isEmpty: jest.fn().mockReturnValue(false),
            array: jest.fn().mockReturnValue([
                { path: 'email', msg: 'Invalid email' },
                { msg: 'Missing param error' }, // no path provided
            ]),
        });
        const middleware = (0, validateRequestManager_1.validateRequest)([mockValidationChain]);
        yield middleware(req, res, next);
        expect(express_validator_1.validationResult).toHaveBeenCalledWith(req);
        expect(consoleErrorSpy).toHaveBeenCalledWith('Missing param in validation error:', { msg: 'Missing param error' });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            errors: {
                email: 'Invalid email',
            },
        });
        expect(next).not.toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    }));
});
