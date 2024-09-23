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
exports.authRouter = void 0;
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const tokenManager_1 = require("../Helper/tokenManager");
const database_1 = require("../MySQL/database");
const emailManager_1 = require("../Helper/emailManager");
const errorManager_1 = require("../Helper/errorManager");
const jwtManager_1 = require("../Helper/jwtManager");
const successManager_1 = require("../Helper/successManager");
const validateRequestManager_1 = require("../Helper/validateRequestManager");
const authRouter = express_1.default.Router();
exports.authRouter = authRouter;
/**
 * Rate limiter for the forgot password route.
 * Limits requests to 5 per 15 minutes from a single IP address.
 * @constant {RateLimit} forgotPasswordLimiter
 * @default {Object} - Configuration for the rate limiter.
 * @property {number} windowMs - Time window in milliseconds (15 minutes).
 * @property {number} max - Maximum number of requests allowed within the window.
 * @property {string} message - Message sent when the limit is exceeded.
 */
const forgotPasswordLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many requests from this IP, please try again later.'
});
/**
 * Rate limiter for the reset password route.
 * Limits requests to 5 per 15 minutes from a single IP address.
 * @constant {RateLimit} resetPasswordLimiter
 * @default {Object} - Configuration for the rate limiter.
 * @property {number} windowMs - Time window in milliseconds (15 minutes).
 * @property {number} max - Maximum number of requests allowed within the window.
 * @property {string} message - Message sent when the limit is exceeded.
 */
const resetPasswordLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many requests from this IP, please try again later.'
});
/**
 * POST /register
 * User registration endpoint.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
authRouter.post('/register', (0, validateRequestManager_1.validateRequest)(validateRequestManager_1.registerValidation), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, first_name, last_name } = req.body;
    try {
        const existingUser = yield (0, database_1.getUserByEmail)(email);
        if (existingUser) {
            throw new errorManager_1.CustomError('This user is already in use!', 409);
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const newUser = yield (0, database_1.createUser)(first_name, last_name, email, hashedPassword);
        if (!newUser) {
            throw new errorManager_1.CustomError('Error creating new user', 400);
        }
        (0, successManager_1.successHandler)("The user has been registered with us!", 201, res);
    }
    catch (error) {
        (0, errorManager_1.errorHandler)(error, res);
    }
}));
/**
 * POST /login
 * User login endpoint.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
authRouter.post('/login', (0, validateRequestManager_1.validateRequest)(validateRequestManager_1.loginValidation), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const user = yield (0, database_1.getUserByEmail)(email);
        if (!user) {
            throw new errorManager_1.CustomError('Email or password is incorrect!', 401);
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            throw new errorManager_1.CustomError('Email or password is incorrect!', 401);
        }
        const accessToken = (0, tokenManager_1.generateAccessToken)(user);
        const refreshToken = yield (0, tokenManager_1.generateRefreshToken)(user);
        const updatedUser = yield (0, database_1.updateLastLoginTime)(user.user_id);
        if (!updatedUser) {
            throw new errorManager_1.CustomError('Email or password is incorrect!', 401);
        }
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        (0, successManager_1.successHandler)("The user has been logged in!", 200, res, accessToken, undefined, undefined, undefined, undefined, updatedUser);
    }
    catch (error) {
        (0, errorManager_1.errorHandler)(error, res);
    }
}));
/**
 * POST /updateUser
 * Update user information endpoint.
 * @param {AccessTokenRequest} req - The request object with access token validation.
 * @param {Response} res - The response object.
 */
authRouter.post('/updateUser', validateRequestManager_1.validateAccessToken, (0, validateRequestManager_1.validateRequest)(validateRequestManager_1.updateUserValidation), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, first_name, last_name } = req.body;
    try {
        if (!req.user_id) {
            throw new errorManager_1.CustomError('User update unsuccessful.', 401);
        }
        const updatedUser = yield (0, database_1.updateUserInfo)(req.user_id, first_name, last_name, email);
        if (!updatedUser ||
            updatedUser.first_name !== first_name ||
            updatedUser.last_name !== last_name ||
            updatedUser.email !== email) {
            throw new errorManager_1.CustomError('User update unsuccessful.', 400);
        }
        (0, successManager_1.successHandler)("User updated successfully", 200, res, undefined, undefined, undefined, undefined, undefined, updatedUser);
    }
    catch (error) {
        (0, errorManager_1.errorHandler)(error, res);
    }
}));
/**
 * POST /refreshAccessToken
 * Refresh access token endpoint.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
authRouter.post('/refreshAccessToken', (0, validateRequestManager_1.validateRequest)(validateRequestManager_1.refreshAccessTokenValidation), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        throw new errorManager_1.CustomError('Refresh token not found, please login again', 401);
    }
    try {
        const decoded = (0, jwtManager_1.verifyToken)(refreshToken, process.env.AUTH_REFRESH_TOKEN_SECRET);
        if (typeof decoded !== 'object' || !('user_id' in decoded)) {
            throw new errorManager_1.CustomError('Invalid refresh token', 401);
        }
        const user_id = decoded.user_id;
        const user = yield (0, database_1.getUserById)(user_id);
        if (!user || !user.refresh_token) {
            throw new errorManager_1.CustomError('Refresh token not found, please login again', 401);
        }
        const isMatch = yield bcryptjs_1.default.compare(refreshToken, user.refresh_token);
        if (!isMatch) {
            throw new errorManager_1.CustomError('Refresh token not found, please login again', 401);
        }
        const accessToken = (0, tokenManager_1.generateAccessToken)(user);
        (0, successManager_1.successHandler)("Refreshed access token", 200, res, accessToken);
    }
    catch (error) {
        (0, errorManager_1.errorHandler)(error, res);
    }
}));
/**
 * POST /forgotPassword
 * Forgot password endpoint.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
authRouter.post('/forgotPassword', forgotPasswordLimiter, (0, validateRequestManager_1.validateRequest)(validateRequestManager_1.forgotPasswordValidation), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    try {
        const user = yield (0, database_1.getUserByEmail)(email);
        if (!user) {
            return (0, successManager_1.successHandler)("Reset password email sent successfully", 200, res);
        }
        const resetToken = yield (0, tokenManager_1.generateResetToken)(user);
        const resetUrl = `${process.env.BASE_URL}/resetPassword?resetToken=${resetToken}&user_id=${user.user_id}`;
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'PlantPal Password Reset Request',
            text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
                    Please click on the following link, or paste this into your browser to complete the process:\n\n
                    ${resetUrl}\n\n
                    If you did not request this, please ignore this email and your password will remain unchanged.\n`
        };
        yield (0, emailManager_1.sendEmail)(mailOptions);
        (0, successManager_1.successHandler)("Reset password email sent successfully", 200, res);
    }
    catch (error) {
        (0, errorManager_1.errorHandler)(error, res);
    }
}));
/**
 * POST /resetPassword
 * Reset password endpoint.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
authRouter.post('/resetPassword', resetPasswordLimiter, (0, validateRequestManager_1.validateRequest)(validateRequestManager_1.resetPasswordValidation), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { password, resetToken, user_id } = req.body;
    const correctToken = resetToken.replace(/%20/g, '+');
    try {
        const [resetTokenValue, resetTokenSecret] = correctToken.split('+');
        if (!resetTokenValue || !resetTokenSecret) {
            throw new errorManager_1.CustomError('Invalid or expired token', 400);
        }
        const user = yield (0, database_1.getUserById)(user_id);
        if (!user || !user.reset_token || !user.reset_token_expiry) {
            throw new errorManager_1.CustomError('Invalid or expired token', 400);
        }
        const resetTokenExpiryTimestamp = new Date(user.reset_token_expiry).getTime();
        const isMatch = yield bcryptjs_1.default.compare(correctToken, user.reset_token);
        if (!isMatch || Date.now() > resetTokenExpiryTimestamp) {
            throw new errorManager_1.CustomError('Invalid or expired token', 400);
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        yield (0, database_1.updateUserPassword)(user.user_id, hashedPassword);
        yield (0, database_1.clearResetToken)(user.user_id);
        const message = `<h3>This is a confirmation that you have changed Password for your account with PlantPal.</h3>`;
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: 'PlantPal Password Changed',
            html: message
        };
        yield (0, emailManager_1.sendEmail)(mailOptions);
        (0, successManager_1.successHandler)("Password reset successfully", 200, res);
    }
    catch (error) {
        (0, errorManager_1.errorHandler)(error, res);
    }
}));
/**
 * GET /error
 * Testing route to trigger error endpoint.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next object.
 */
authRouter.get('/error', (req, res, next) => {
    const error = new Error('Internal Server Error');
    next(error);
});
/**
 * GET /test
 * Test route to check user access.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
authRouter.get('/test', (req, res) => {
    res.status(200).json({ message: 'Auth route accessed' });
});
