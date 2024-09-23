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
exports.validateAccessToken = exports.validateRequest = exports.deviceShadowValidation = exports.shadowUpdatePumpWaterValidation = exports.updatePumpWaterValidation = exports.shadowUpdateAutoValidation = exports.presenceUpdateConnectionValidation = exports.updateAutoValidation = exports.updateWifiValidation = exports.addDeviceValidation = exports.deviceLogsValidation = exports.resetPasswordValidation = exports.forgotPasswordValidation = exports.refreshAccessTokenValidation = exports.updateUserValidation = exports.loginValidation = exports.registerValidation = exports.apiKeyValidationClient = exports.apiKeyValidation = void 0;
const express_validator_1 = require("express-validator");
const errorManager_1 = require("../Helper/errorManager");
const jwtManager_1 = require("../Helper/jwtManager");
/**
 * Validates the API key in the request header.
 *
 * @function apiKeyValidation
 * @returns {ValidationChain} The validation chain for the API key.
 * @throws {Error} If the API key does not match the expected key.
 */
exports.apiKeyValidation = (0, express_validator_1.check)('x-api-key')
    .custom((value, { req }) => {
    if (value !== process.env.API_KEY) {
        throw new Error('Invalid API key');
    }
    return true;
});
exports.apiKeyValidationClient = (0, express_validator_1.check)('x-api-key')
    .custom((value, { req }) => {
    if (value !== process.env.API_CLIENT_KEY) {
        throw new Error('Invalid API key');
    }
    return true;
});
/**
 * Validates user registration data.
 *
 * @constant {ValidationChain[]} registerValidation
 * @returns {ValidationChain[]} The validation chains for user registration.
 */
exports.registerValidation = [
    (0, express_validator_1.check)('first_name', 'First name is required').not().isEmpty(),
    (0, express_validator_1.check)('last_name', 'Last name is required').not().isEmpty(),
    (0, express_validator_1.check)('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
    (0, express_validator_1.check)('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    exports.apiKeyValidationClient
];
/**
 * Validates user login data.
 *
 * @constant {ValidationChain[]} loginValidation
 * @returns {ValidationChain[]} The validation chains for user login.
 */
exports.loginValidation = [
    (0, express_validator_1.check)('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
    (0, express_validator_1.check)('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    exports.apiKeyValidationClient
];
/**
 * Validates user update data.
 *
 * @constant {ValidationChain[]} updateUserValidation
 * @returns {ValidationChain[]} The validation chains for updating user data.
 */
exports.updateUserValidation = [
    (0, express_validator_1.check)('first_name', 'First name is required').not().isEmpty(),
    (0, express_validator_1.check)('last_name', 'Last name is required').not().isEmpty(),
    (0, express_validator_1.check)('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
];
/**
 * Validates refresh access token data.
 *
 * @constant {ValidationChain[]} refreshAccessTokenValidation
 * @returns {ValidationChain[]} The validation chains for refreshing access tokens.
 */
exports.refreshAccessTokenValidation = [
    (0, express_validator_1.cookie)('refreshToken').exists().withMessage('Refresh token not found, please login again').notEmpty().withMessage('Refresh token cannot be empty'),
    exports.apiKeyValidationClient
];
/**
 * Validates forgot password request data.
 *
 * @constant {ValidationChain[]} forgotPasswordValidation
 * @returns {ValidationChain[]} The validation chains for forgot password requests.
 */
exports.forgotPasswordValidation = [
    (0, express_validator_1.check)('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
    exports.apiKeyValidationClient
];
/**
 * Validates reset password request data.
 *
 * @constant {ValidationChain[]} resetPasswordValidation
 * @returns {ValidationChain[]} The validation chains for resetting passwords.
 */
exports.resetPasswordValidation = [
    (0, express_validator_1.check)('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    (0, express_validator_1.check)('resetToken', 'Reset token is required').not().isEmpty(),
    (0, express_validator_1.check)('user_id', 'User Id is required').not().isEmpty(),
    exports.apiKeyValidationClient
];
/**
 * Validates device logs request data.
 *
 * @constant {ValidationChain[]} deviceLogsValidation
 * @returns {ValidationChain[]} The validation chains for fetching device logs.
 */
exports.deviceLogsValidation = [
    (0, express_validator_1.check)('cat_num', 'Catalog number is required').not().isEmpty()
];
/**
 * Validates data for adding a new device.
 *
 * @constant {ValidationChain[]} addDeviceValidation
 * @returns {ValidationChain[]} The validation chains for adding a new device.
 */
exports.addDeviceValidation = [
    (0, express_validator_1.check)('cat_num', 'Catalog number is required').not().isEmpty(),
    (0, express_validator_1.check)('location', 'Location is required').not().isEmpty(),
    (0, express_validator_1.check)('wifi_ssid', 'Wifi_ssid is required').not().isEmpty(),
    (0, express_validator_1.check)('wifi_password', 'Wifi_password is required').not().isEmpty(),
];
/**
 * Validates Wi-Fi update data for a device.
 *
 * @constant {ValidationChain[]} updateWifiValidation
 * @returns {ValidationChain[]} The validation chains for updating device Wi-Fi.
 */
exports.updateWifiValidation = [
    (0, express_validator_1.check)('device_id', 'Device_id number is required').not().isEmpty(),
    (0, express_validator_1.check)('wifi_ssid', 'Wifi_ssid is required').not().isEmpty(),
    (0, express_validator_1.check)('wifi_password', 'Wifi_password is required').not().isEmpty(),
];
/**
 * Validates automatic control update data for a device.
 *
 * @constant {ValidationChain[]} updateAutoValidation
 * @returns {ValidationChain[]} The validation chains for updating automation settings.
 */
exports.updateAutoValidation = [
    (0, express_validator_1.check)('device_id', 'Device_id number is required').not().isEmpty(),
    (0, express_validator_1.check)('automate', 'Automate is required').not().isEmpty(),
];
/**
 * Validates presence connection update data.
 *
 * @constant {ValidationChain[]} presenceUpdateConnectionValidation
 * @returns {ValidationChain[]} The validation chains for updating presence connection.
 */
exports.presenceUpdateConnectionValidation = [
    (0, express_validator_1.check)('thingName', 'ThingName is required').not().isEmpty(),
    (0, express_validator_1.check)('presenceConnection', 'presenceConnection is required').not().isEmpty(),
    exports.apiKeyValidation
];
/**
 * Validates automatic control shadow update data.
 *
 * @constant {ValidationChain[]} shadowUpdateAutoValidation
 * @returns {ValidationChain[]} The validation chains for updating shadow automation settings.
 */
exports.shadowUpdateAutoValidation = [
    (0, express_validator_1.check)('thingName', 'ThingName is required').not().isEmpty(),
    (0, express_validator_1.check)('shadowAuto', 'shadowAuto is required').not().isEmpty(),
    exports.apiKeyValidation
];
/**
 * Validates pump water update data.
 *
 * @constant {ValidationChain[]} updatePumpWaterValidation
 * @returns {ValidationChain[]} The validation chains for updating pump water settings.
 */
exports.updatePumpWaterValidation = [
    (0, express_validator_1.check)('device_id', 'Device_id number is required').not().isEmpty(),
    (0, express_validator_1.check)('pump_water', 'Pump_water is required').not().isEmpty(),
];
/**
 * Validates pump water shadow update data.
 *
 * @constant {ValidationChain[]} shadowUpdatePumpWaterValidation
 * @returns {ValidationChain[]} The validation chains for updating shadow pump water settings.
 */
exports.shadowUpdatePumpWaterValidation = [
    (0, express_validator_1.check)('thingName', 'ThingName is required').not().isEmpty(),
    (0, express_validator_1.check)('shadowPump', 'shadowPump is required').not().isEmpty(),
    exports.apiKeyValidation
];
/**
 * Validates device shadow request data.
 *
 * @constant {ValidationChain[]} deviceShadowValidation
 * @returns {ValidationChain[]} The validation chains for fetching device shadow.
 */
exports.deviceShadowValidation = [
    (0, express_validator_1.check)('thingName', 'Thing name is required').not().isEmpty(),
];
/**
 * Middleware to validate request body using express-validator.
 * @param {ValidationChain[]} validations - An array of validation chains.
 * @returns {ValidationMiddleware} The validation middleware function.
 */
const validateRequest = (validations) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        yield Promise.all(validations.map(validation => validation.run(req)));
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            const errorObject = {};
            errors.array().forEach((error) => {
                if (error.path) {
                    errorObject[error.path] = error.msg;
                }
                else {
                    console.error('Missing param in validation error:', error);
                }
            });
            res.status(400).json({ errors: errorObject });
            return;
        }
        next();
    });
};
exports.validateRequest = validateRequest;
/**
 * Middleware to validate the access token.
 * @param {AccessTokenRequest} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
const validateAccessToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const authHeader = (_a = req.headers) === null || _a === void 0 ? void 0 : _a.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        throw new errorManager_1.CustomError('Please provide the access token', 401);
    }
    const accessToken = authHeader.split(' ')[1];
    try {
        const decoded = (0, jwtManager_1.verifyToken)(accessToken, process.env.AUTH_ACCESS_TOKEN_SECRET);
        if (typeof decoded === 'object' && 'user_id' in decoded) {
            req.user_id = decoded.user_id;
            next();
        }
        else {
            throw new errorManager_1.CustomError('Invalid access token', 401);
        }
    }
    catch (error) {
        (0, errorManager_1.errorHandler)(error, res);
    }
});
exports.validateAccessToken = validateAccessToken;
