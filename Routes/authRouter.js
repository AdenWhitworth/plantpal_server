import express from 'express';
import rateLimit from 'express-rate-limit';
import { check, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import {
    updateUserInfo,
    getUserById,
    createUser,
    getUserByEmail,
    updateLastLoginTime,
    updateRefreshToken,
    updateResetToken,
    updateUserPassword,
    clearResetToken
} from '../MySQL/database.js';
import { sendEmail } from '../Helper/emailManager.js';

const authRouter = express.Router();

const validateRequest = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ message: errors.array() });
        }
        next();
    };
};

const validateAccessToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return res.status(422).json({ message: 'Please provide the access token' });
    }

    const accessToken = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(accessToken, process.env.AUTH_ACCESS_TOKEN_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(422).json({ message: 'Please provide a valid access token' });
    }
};

const generateAccessToken = (user) => {
    const accessToken = jwt.sign({ 
        user_id: user.user_id 
    }, 
    process.env.AUTH_ACCESS_TOKEN_SECRET, 
    { 
        expiresIn: process.envAUTH_ACCESS_TOKEN_EXPIRY 
    });

    return accessToken;
}

const generateRefreshToken = async (user) => {
    try {
        const refreshToken = jwt.sign({ 
            user_id: user.user_id 
        }, 
        process.env.AUTH_REFRESH_TOKEN_SECRET, 
        { 
            expiresIn: process.env.AUTH_REFRESH_TOKEN_EXPIRY 
        });
    
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

        await updateRefreshToken(user.user_id, hashedRefreshToken);
    
        return refreshToken;
    
    } catch (error) {
        throw error;
    }
}

const generateResetToken = async (user) => {
    const resetTokenValue = crypto.randomBytes(20).toString("base64url");
    const resetTokenSecret = crypto.randomBytes(10).toString("hex");
    const resetToken = `${resetTokenValue}+${resetTokenSecret}`;

    const resetTokenExpiry = Date.now() + process.env.RESET_PASSWORD_TOKEN_EXPIRY_MINS * 60 * 1000;

    const hashedResetToken = await bcrypt.hash(resetToken, 10);

    await updateResetToken(user.user_id, hashedResetToken, resetTokenExpiry);

    return resetToken;
}

const registerValidation = [
    check('first_name', 'First name is required').not().isEmpty(),
    check('last_name', 'Last name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: true }),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    check('x-api-key')
        .custom((value, { req }) => {
            if (value !== process.env.API_CLIENT_KEY) {
                throw new Error('Invalid API key');
            }
            return true;
        })
        .withMessage('Forbidden')
];

const loginValidation = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: true }),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    check('x-api-key')
        .custom((value, { req }) => {
            if (value !== process.env.API_CLIENT_KEY) {
                throw new Error('Invalid API key');
            }
            return true;
        })
        .withMessage('Forbidden')
];

const updateUserValidation = [
    check('first_name', 'First name is required').not().isEmpty(),
    check('last_name', 'Last name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: true }),
];

const refreshAccessTokenValidation = [
    check('cookies.refreshToken')
        .exists({ checkFalsy: true }).withMessage('Refresh token not found, please login again')
        .isString().withMessage('Refresh token must be a string'),
];

const forgotPasswordValidation = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: true }),
    check('x-api-key')
        .custom((value, { req }) => {
            if (value !== process.env.API_CLIENT_KEY) {
                throw new Error('Invalid API key');
            }
            return true;
        })
        .withMessage('Forbidden')
];

const resetPasswordValidation = [
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    check('resetToken', 'Reset token is required').not().isEmpty(),
    check('x-api-key')
        .custom((value, { req }) => {
            if (value !== process.env.API_CLIENT_KEY) {
                throw new Error('Invalid API key');
            }
            return true;
        })
        .withMessage('Forbidden')
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

const handleErrors = (res, err, msg) => res.status(500).json({ message: msg, error: err.message });

authRouter.post('/register', validateRequest(registerValidation), async (req, res) => {
    const { email, password, first_name, last_name } = req.body;
    try {
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return res.status(409).send({ message: 'This user is already in use!' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await createUser(first_name, last_name, email, hashedPassword);

        if (!newUser) {
            return res.status(400).send({ message: 'Error creating new user' });
        }

        res.status(201).send({ message: 'The user has been registered with us!' });
    } catch (error) {
        handleErrors(res, error, 'Error registering user');
    }
});

authRouter.post('/login', validateRequest(loginValidation), async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await getUserByEmail(email);
        if (!user) {
            return res.status(409).send({ message: 'Email or password is incorrect!' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).send({ message: 'Email or password is incorrect!' });
        }

        const accessToken = generateAccessToken(updatedUser.user_id);
        const refreshToken = await generateRefreshToken(updatedUser.user_id);
        const updatedUser = await updateLastLoginTime(user.user_id);

        if (!updatedUser) {
            return res.status(401).send({ message: 'Email or password is incorrect!' });
        }

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).send({ message: 'Logged in!', accessToken, user: updatedUser });
    } catch (error) {
        handleErrors(res, error, 'Error logging in user');
    }
});

authRouter.post('/updateUser', validateAccessToken, validateRequest(updateUserValidation), async (req, res) => {
    const { email, first_name, last_name } = req.body;
    try {
        const updatedUser = await updateUserInfo(req.user.user_id, first_name, last_name, email);
        
        if (!updatedUser || 
            updatedUser.first_name !== first_name || 
            updatedUser.last_name !== last_name || 
            updatedUser.email !== email) {
            return res.status(401).send({ error: true, user: updatedUser, message: 'User update unsuccessful.' });
        }

        res.send({ error: false, user: updatedUser, message: 'User updated successfully.' });
    } catch (error) {
        handleErrors(res, error, 'Error updating user');
    }
});

authRouter.post('/refreshAccessToken', validateRequest(refreshAccessTokenValidation), async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).send({ message: 'Refresh token not found, please login again' });
    }

    try {
        const { user_id } = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        
        const user = await getUserById(user_id);
        
        if (!user) {
            return res.status(401).send({ message: 'Refresh token not found, please login again' });
        }

        const isMatch = await bcrypt.compare(refreshToken, user.refresh_token);
        if (!isMatch) {
            return res.status(400).json({ message: 'Refresh token not found, please login again' });
        }
        
        const accessToken = generateAccessToken(user);
        res.status(200).send({ message: 'Refreshed access token', accessToken, user: user });
        
    } catch (error) {
        handleErrors(res, error, 'Refresh token not found, please login again');
    }
});

authRouter.post('/forgotPassword', forgotPasswordLimiter, validateRequest(forgotPasswordValidation), async (req, res) => {
    const { email } = req.body;

    try {
        const user  = await getUserByEmail(email);
        
        if (!user) {
            return res.status(200).send({message: 'Reset password email sent successfully'});
        }

        const resetToken = generateResetToken(user);

        const resetUrl = `${process.env.BASE_URL}/resetpassword?resetToken=${resetToken}&user_id=${user.user_id}`;

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'PlantPal Password Reset Request',
            text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
                    Please click on the following link, or paste this into your browser to complete the process:\n\n
                    ${resetUrl}\n\n
                    If you did not request this, please ignore this email and your password will remain unchanged.\n`
        };

        await sendEmail(mailOptions);

        return res.status(200).send({message: 'Reset password email sent successfully'});

    } catch (error) {
        handleErrors(res, error, 'Error sending password reset email');
    }

});

authRouter.post('/resetpassword', resetPasswordLimiter, validateRequest(resetPasswordValidation), async (req, res) => {
    const { password, resetToken, user_id } = req.body;

    try {

        const [resetTokenValue, resetTokenSecret] = token.split('+');
        if (!resetTokenValue || !resetTokenSecret) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const user = await getUserById(user_id);
        if (!user || !user.reset_token || !user.reset_token_expiry) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const isMatch = await bcrypt.compare(resetToken, user.reset_token);
        if (!isMatch || Date.now() > user.reset_token_expiry) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await updateUserPassword(user.user_id, hashedPassword);
        await clearResetToken(user.user_id);

        const message = `<h3>This is a confirmation that you have changed Password for your account with PlantPal.</h3>`;

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'PlantPal Password Changed',
            html: message
        };

        await sendEmail(mailOptions);

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        handleErrors(res, error, 'Error resetting password');
    }
});


export { authRouter };
