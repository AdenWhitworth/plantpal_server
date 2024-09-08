import express, { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { check, validationResult, cookie, ValidationChain } from 'express-validator';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken, generateResetToken } from '../Helper/tokenManager';
import { updateUserInfo, getUserById, createUser, getUserByEmail, updateLastLoginTime, updateUserPassword, clearResetToken } from '../MySQL/database';
import { sendEmail } from '../Helper/emailManager';
import { errorHandler, CustomError } from '../Helper/errorManager';
import { verifyToken } from '../Helper/jwtManager';
import { successHandler } from '../Helper/successManager';
import { JwtPayload } from 'jsonwebtoken';

const authRouter = express.Router();

type ValidationMiddleware = (req: Request, res: Response, next: NextFunction) => Promise<void>;

interface AccessTokenRequest extends Request {
    user_id?: number;
}

const validateRequest = (validations: ValidationChain[]): ValidationMiddleware => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorObject: Record<string, string> = {};
            errors.array().forEach(error => {
                if (error.type) {
                    errorObject[error.type] = error.msg;
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

const validateAccessToken = async (req: AccessTokenRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
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

const apiKeyValidation = check('x-api-key')
    .custom((value, { req }) => {
        if (value !== process.env.API_CLIENT_KEY) {
            throw new Error('Invalid API key');
        }
        return true;
    })
    .withMessage('Forbidden');

const registerValidation: ValidationChain[] = [
    check('first_name', 'First name is required').not().isEmpty(),
    check('last_name', 'Last name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    apiKeyValidation
];

const loginValidation: ValidationChain[] = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    apiKeyValidation
];

const updateUserValidation: ValidationChain[] = [
    check('first_name', 'First name is required').not().isEmpty(),
    check('last_name', 'Last name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
];

const refreshAccessTokenValidation: ValidationChain[] = [
    cookie('refreshToken').exists().withMessage('Refresh token not found, please login again').notEmpty().withMessage('Refresh token cannot be empty')
];

const forgotPasswordValidation: ValidationChain[] = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
    apiKeyValidation
];

const resetPasswordValidation: ValidationChain[] = [
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    check('resetToken', 'Reset token is required').not().isEmpty(),
    check('user_id', 'User Id is required').not().isEmpty(),
    apiKeyValidation
];

const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many requests from this IP, please try again later.'
});

const resetPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many requests from this IP, please try again later.'
});

authRouter.post('/register', validateRequest(registerValidation), async (req: Request, res: Response) => {
    const { email, password, first_name, last_name } = req.body;
    try {
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            throw new CustomError('This user is already in use!', 409);
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await createUser(first_name, last_name, email, hashedPassword);

        if (!newUser) {
            throw new CustomError('Error creating new user', 400);
        }

        successHandler("The user has been registered with us!", 201, res);
    } catch (error) {
        errorHandler(error as CustomError, res);
    }
});

authRouter.post('/login', validateRequest(loginValidation), async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        const user = await getUserByEmail(email);
        if (!user) {
            throw new CustomError('Email or password is incorrect!', 401);
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new CustomError('Email or password is incorrect!', 401);
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = await generateRefreshToken(user);
        const updatedUser = await updateLastLoginTime(user.user_id);

        if (!updatedUser) {
            throw new CustomError('Email or password is incorrect!', 401);
        }

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        successHandler("The user has been logged in!", 200, res, accessToken);
    } catch (error) {
        errorHandler(error as CustomError, res);
    }
});

authRouter.post('/updateUser', validateAccessToken, validateRequest(updateUserValidation), async (req: AccessTokenRequest, res: Response) => {
    const { email, first_name, last_name } = req.body;
    try {
        
        if (!req.user_id){
            throw new CustomError('User update unsuccessful.', 401);
        }

        const updatedUser = await updateUserInfo(req.user_id, first_name, last_name, email);
        
        if (!updatedUser || 
            updatedUser.first_name !== first_name || 
            updatedUser.last_name !== last_name || 
            updatedUser.email !== email) {
            throw new CustomError('User update unsuccessful.', 400);
        }

        successHandler("User updated successfully", 200, res);
    } catch (error) {
        errorHandler(error as CustomError, res);
    }
});

authRouter.post('/refreshAccessToken', validateRequest(refreshAccessTokenValidation), async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        throw new CustomError('Refresh token not found, please login again', 401);
    }

    try {

        const decoded = verifyToken(refreshToken, process.env.AUTH_REFRESH_TOKEN_SECRET as string);

        if (typeof decoded !== 'object' || !('user_id' in decoded)) {
            throw new CustomError('Invalid access token', 401);
        } 

        const user_id = (decoded as JwtPayload).user_id as number;

        const user = await getUserById(user_id);
        
        if (!user || !user.refresh_token) {
            throw new CustomError('Refresh token not found, please login again', 401);
        }

        const isMatch = await bcrypt.compare(refreshToken, user.refresh_token);
        if (!isMatch) {
            throw new CustomError('Refresh token not found, please login again', 401);
        }
        
        const accessToken = generateAccessToken(user);
        successHandler("Refreshed access token", 200, res, accessToken);
        
    } catch (error) {
        errorHandler(error as CustomError, res);
    }
});

authRouter.post('/forgotPassword', forgotPasswordLimiter, validateRequest(forgotPasswordValidation), async (req: Request, res: Response) => {
    const { email } = req.body;

    try {
        const user  = await getUserByEmail(email);
        
        if (!user) {
            return successHandler("Reset password email sent successfully", 200, res);
        }

        const resetToken = await generateResetToken(user);

        const resetUrl = `${process.env.BASE_URL}/resetPassword?resetToken=${resetToken}&user_id=${user.user_id}`;

        const mailOptions = {
            from: process.env.EMAIL_FROM as string,
            to: email,
            subject: 'PlantPal Password Reset Request',
            text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
                    Please click on the following link, or paste this into your browser to complete the process:\n\n
                    ${resetUrl}\n\n
                    If you did not request this, please ignore this email and your password will remain unchanged.\n`
        };

        await sendEmail(mailOptions);

        successHandler("Reset password email sent successfully", 200, res);

    } catch (error) {
        errorHandler(error as CustomError, res);
    }

});

authRouter.post('/resetPassword', resetPasswordLimiter, validateRequest(resetPasswordValidation), async (req: Request, res: Response) => {
    const { password, resetToken, user_id } = req.body;
    const correctToken = resetToken.replace(/%20/g, '+');

    try {

        const [resetTokenValue, resetTokenSecret] = correctToken.split('+');
        if (!resetTokenValue || !resetTokenSecret) {
            throw new CustomError('Invalid or expired token', 400);
        }

        const user = await getUserById(user_id);
        if (!user || !user.reset_token || !user.reset_token_expiry) {
            throw new CustomError('Invalid or expired token', 400);
        }

        const resetTokenExpiryTimestamp = new Date(user.reset_token_expiry).getTime();

        const isMatch = await bcrypt.compare(correctToken, user.reset_token);
        if (!isMatch || Date.now() > resetTokenExpiryTimestamp) {
            throw new CustomError('Invalid or expired token', 400);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await updateUserPassword(user.user_id, hashedPassword);
        await clearResetToken(user.user_id);

        const message = `<h3>This is a confirmation that you have changed Password for your account with PlantPal.</h3>`;

        const mailOptions = {
            from: process.env.EMAIL_FROM as string,
            to: user.email,
            subject: 'PlantPal Password Changed',
            html: message
        };

        await sendEmail(mailOptions);

        successHandler("Password reset successfully", 200, res);

    } catch (error) {
        errorHandler(error as CustomError, res);
    }
});

export { authRouter };
