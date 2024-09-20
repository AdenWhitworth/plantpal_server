import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain, check } from 'express-validator';
import { validateRequest } from '../../Routes/authRouter';

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

describe('validateRequest middleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;
    let mockValidationChain: ValidationChain;

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
        } as any;
        
        (validationResult as unknown as jest.Mock).mockReset();
        (check as jest.Mock).mockClear();
    });

    it('should call next() if there are no validation errors', async () => {
        (validationResult as unknown as jest.Mock).mockReturnValueOnce({
            isEmpty: jest.fn().mockReturnValue(true),
        });

        const middleware = validateRequest([mockValidationChain]);
        await middleware(req as Request, res as Response, next);

        expect(validationResult).toHaveBeenCalledWith(req);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });

    it('should return 400 and validation errors if validation fails', async () => {
        (validationResult as unknown as jest.Mock).mockReturnValueOnce({
            isEmpty: jest.fn().mockReturnValue(false),
            array: jest.fn().mockReturnValue([
                { path: 'email', msg: 'Invalid email' },
                { path: 'password', msg: 'Password must be 6 characters' },
            ]),
        });

        const middleware = validateRequest([mockValidationChain]);
        await middleware(req as Request, res as Response, next);

        expect(validationResult).toHaveBeenCalledWith(req);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            errors: {
                email: 'Invalid email',
                password: 'Password must be 6 characters',
            },
        });
    });

    it('should log an error and not include it if validation error has no path', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        (validationResult as unknown as jest.Mock).mockReturnValueOnce({
            isEmpty: jest.fn().mockReturnValue(false),
            array: jest.fn().mockReturnValue([
                { path: 'email', msg: 'Invalid email' },
                { msg: 'Missing param error' }, // no path provided
            ]),
        });

        const middleware = validateRequest([mockValidationChain]);
        await middleware(req as Request, res as Response, next);

        expect(validationResult).toHaveBeenCalledWith(req);
        expect(consoleErrorSpy).toHaveBeenCalledWith('Missing param in validation error:', { msg: 'Missing param error' });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            errors: {
                email: 'Invalid email',
            },
        });
        expect(next).not.toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
    });
});







