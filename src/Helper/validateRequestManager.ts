import { validationResult, ValidationChain, check, cookie } from 'express-validator';
import { ValidationMiddleware, AccessTokenRequest } from '../Types/types';
import { Request, Response, NextFunction } from 'express';
import { errorHandler, CustomError } from '../Helper/errorManager';
import { verifyToken } from '../Helper/jwtManager';
import { JwtPayload } from 'jsonwebtoken';

export const apiKeyValidation = check('x-api-key')
    .custom((value, { req }) => {
        if (value !== process.env.API_CLIENT_KEY as string) {
            throw new Error('Invalid API key');
        }
        return true;
    })

export const registerValidation: ValidationChain[] = [
    check('first_name', 'First name is required').not().isEmpty(),
    check('last_name', 'Last name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    apiKeyValidation
];

export const loginValidation: ValidationChain[] = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    apiKeyValidation
];

export const updateUserValidation: ValidationChain[] = [
    check('first_name', 'First name is required').not().isEmpty(),
    check('last_name', 'Last name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
];

export const refreshAccessTokenValidation: ValidationChain[] = [
    cookie('refreshToken').exists().withMessage('Refresh token not found, please login again').notEmpty().withMessage('Refresh token cannot be empty'),
    apiKeyValidation
];

export const forgotPasswordValidation: ValidationChain[] = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
    apiKeyValidation
];

export const resetPasswordValidation: ValidationChain[] = [
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    check('resetToken', 'Reset token is required').not().isEmpty(),
    check('user_id', 'User Id is required').not().isEmpty(),
    apiKeyValidation
];

/**
 * Middleware to validate request body using express-validator.
 * @param {ValidationChain[]} validations - An array of validation chains.
 * @returns {ValidationMiddleware} The validation middleware function.
 */
export const validateRequest = (validations: ValidationChain[]): ValidationMiddleware => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorObject: Record<string, string> = {};

            errors.array().forEach((error: any) => {
                if (error.path) {
                    errorObject[error.path] = error.msg;
                } else {
                    console.error('Missing param in validation error:', error);
                }
            });

            res.status(400).json({ errors: errorObject });
            return;
        }

        next();
    };
};

/**
 * Middleware to validate the access token.
 * @param {AccessTokenRequest} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
export const validateAccessToken = async (req: AccessTokenRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        throw new CustomError('Please provide the access token', 401);
    }

    const accessToken = authHeader.split(' ')[1];
    try {

        const decoded = verifyToken(accessToken, process.env.AUTH_ACCESS_TOKEN_SECRET as string);
        if (typeof decoded === 'object' && 'user_id' in decoded) {
            req.user_id = (decoded as JwtPayload).user_id as number;
            next();
        } else {
            throw new CustomError('Invalid access token', 401);
        }
        
    } catch (error) {
        errorHandler(error as CustomError, res);
    }
};