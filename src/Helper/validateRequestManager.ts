import { validationResult, ValidationChain, check, cookie } from 'express-validator';
import { ValidationMiddleware, AccessTokenRequest } from '../Types/types';
import { Request, Response, NextFunction } from 'express';
import { errorHandler, CustomError } from '../Helper/errorManager';
import { verifyToken } from '../Helper/jwtManager';
import { JwtPayload } from 'jsonwebtoken';

/**
 * Validates the API key in the request header.
 * 
 * @function apiKeyValidation
 * @returns {ValidationChain} The validation chain for the API key.
 * @throws {Error} If the API key does not match the expected key.
 */
export const apiKeyValidation = check('x-api-key')
    .custom((value, { req }) => {
        if (value !== process.env.API_KEY as string) {
            throw new Error('Invalid API key');
        }
        return true;
    })

export const apiKeyValidationClient = check('x-api-key')
.custom((value, { req }) => {
    if (value !== process.env.API_CLIENT_KEY as string) {
        throw new Error('Invalid API key');
    }
    return true;
})


/**
 * Validates user registration data.
 * 
 * @constant {ValidationChain[]} registerValidation
 * @returns {ValidationChain[]} The validation chains for user registration.
 */
export const registerValidation: ValidationChain[] = [
    check('first_name', 'First name is required').not().isEmpty(),
    check('last_name', 'Last name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    apiKeyValidationClient
];

/**
 * Validates user login data.
 * 
 * @constant {ValidationChain[]} loginValidation
 * @returns {ValidationChain[]} The validation chains for user login.
 */
export const loginValidation: ValidationChain[] = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    apiKeyValidationClient
];

/**
 * Validates user update data.
 * 
 * @constant {ValidationChain[]} updateUserValidation
 * @returns {ValidationChain[]} The validation chains for updating user data.
 */
export const updateUserValidation: ValidationChain[] = [
    check('first_name', 'First name is required').not().isEmpty(),
    check('last_name', 'Last name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
];

/**
 * Validates refresh access token data.
 * 
 * @constant {ValidationChain[]} refreshAccessTokenValidation
 * @returns {ValidationChain[]} The validation chains for refreshing access tokens.
 */
export const refreshAccessTokenValidation: ValidationChain[] = [
    cookie('refreshToken').exists().withMessage('Refresh token not found, please login again').notEmpty().withMessage('Refresh token cannot be empty'),
    apiKeyValidationClient
];

/**
 * Validates forgot password request data.
 * 
 * @constant {ValidationChain[]} forgotPasswordValidation
 * @returns {ValidationChain[]} The validation chains for forgot password requests.
 */
export const forgotPasswordValidation: ValidationChain[] = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
    apiKeyValidationClient
];

/**
 * Validates reset password request data.
 * 
 * @constant {ValidationChain[]} resetPasswordValidation
 * @returns {ValidationChain[]} The validation chains for resetting passwords.
 */
export const resetPasswordValidation: ValidationChain[] = [
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    check('resetToken', 'Reset token is required').not().isEmpty(),
    check('user_id', 'User Id is required').not().isEmpty(),
    apiKeyValidationClient
];

/**
 * Validates device logs request data.
 * 
 * @constant {ValidationChain[]} deviceLogsValidation
 * @returns {ValidationChain[]} The validation chains for fetching device logs.
 */
export const deviceLogsValidation: ValidationChain[] = [
    check('cat_num', 'Catalog number is required').not().isEmpty()
];

/**
 * Validates data for adding a new device.
 * 
 * @constant {ValidationChain[]} addDeviceValidation
 * @returns {ValidationChain[]} The validation chains for adding a new device.
 */
export const addDeviceValidation: ValidationChain[] = [
    check('cat_num', 'Catalog number is required').not().isEmpty(),
    check('location', 'Location is required').not().isEmpty(),
    check('wifi_ssid', 'Wifi_ssid is required').not().isEmpty(),
    check('wifi_password', 'Wifi_password is required').not().isEmpty(),
];

/**
 * Validates Wi-Fi update data for a device.
 * 
 * @constant {ValidationChain[]} updateWifiValidation
 * @returns {ValidationChain[]} The validation chains for updating device Wi-Fi.
 */
export const updateWifiValidation: ValidationChain[] = [
    check('device_id', 'Device_id number is required').not().isEmpty(),
    check('wifi_ssid', 'Wifi_ssid is required').not().isEmpty(),
    check('wifi_password', 'Wifi_password is required').not().isEmpty(),
];

/**
 * Validates automatic control update data for a device.
 * 
 * @constant {ValidationChain[]} updateAutoValidation
 * @returns {ValidationChain[]} The validation chains for updating automation settings.
 */
export const updateAutoValidation: ValidationChain[] = [
    check('device_id', 'Device_id number is required').not().isEmpty(),
    check('automate', 'Automate is required').not().isEmpty(),
];

/**
 * Validates presence connection update data.
 * 
 * @constant {ValidationChain[]} presenceUpdateConnectionValidation
 * @returns {ValidationChain[]} The validation chains for updating presence connection.
 */
export const presenceUpdateConnectionValidation: ValidationChain[] = [
    check('thingName', 'ThingName is required').not().isEmpty(),
    check('presenceConnection', 'presenceConnection is required').not().isEmpty(),
    apiKeyValidation
];

/**
 * Validates automatic control shadow update data.
 * 
 * @constant {ValidationChain[]} shadowUpdateAutoValidation
 * @returns {ValidationChain[]} The validation chains for updating shadow automation settings.
 */
export const shadowUpdateAutoValidation: ValidationChain[] = [
    check('thingName', 'ThingName is required').not().isEmpty(),
    check('shadowAuto', 'shadowAuto is required').not().isEmpty(),
    apiKeyValidation
];

/**
 * Validates pump water update data.
 * 
 * @constant {ValidationChain[]} updatePumpWaterValidation
 * @returns {ValidationChain[]} The validation chains for updating pump water settings.
 */
export const updatePumpWaterValidation: ValidationChain[] = [
    check('device_id', 'Device_id number is required').not().isEmpty(),
    check('pump_water', 'Pump_water is required').not().isEmpty(),
];

/**
 * Validates pump water shadow update data.
 * 
 * @constant {ValidationChain[]} shadowUpdatePumpWaterValidation
 * @returns {ValidationChain[]} The validation chains for updating shadow pump water settings.
 */
export const shadowUpdatePumpWaterValidation: ValidationChain[] = [
    check('thingName', 'ThingName is required').not().isEmpty(),
    check('shadowPump', 'shadowPump is required').not().isEmpty(),
    apiKeyValidation
];

/**
 * Validates device shadow request data.
 * 
 * @constant {ValidationChain[]} deviceShadowValidation
 * @returns {ValidationChain[]} The validation chains for fetching device shadow.
 */
export const deviceShadowValidation: ValidationChain[] = [
    check('thingName', 'Thing name is required').not().isEmpty(),
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