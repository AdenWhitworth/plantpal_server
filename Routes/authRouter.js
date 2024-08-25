import express from 'express';
import { check, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
    updateUserInfo,
    createUser,
    getUserByEmail,
    updateLastLoginTime
} from '../MySQL/database.js';

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

const validateToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return res.status(422).json({ message: 'Please provide the token' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(422).json({ message: 'Please provide a valid token' });
    }
};

const registerValidation = [
    check('first_name', 'First name is required').not().isEmpty(),
    check('last_name', 'Last name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: true }),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 })
];

const loginValidation = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: true }),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 })
];

const updateUserValidation = [
    check('first_name', 'First name is required').not().isEmpty(),
    check('last_name', 'Last name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: true }),
];

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

        const token = jwt.sign({ user_id: user.user_id }, process.env.SECRET_KEY, { expiresIn: '1h' });
        const updatedUser = await updateLastLoginTime(user.user_id);

        if (!updatedUser) {
            return res.status(401).send({ message: 'Email or password is incorrect!' });
        }

        res.status(200).send({ message: 'Logged in!', token, user: updatedUser });
    } catch (error) {
        handleErrors(res, error, 'Error logging in user');
    }
});

authRouter.post('/updateUser', validateToken, validateRequest(updateUserValidation), async (req, res) => {
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

export { authRouter };
