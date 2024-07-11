import express from 'express';
const authRouter = express.Router();
import { check } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { updateUserInfo, createUser, getUserByEmail, getUserById, updateLastLoginTime } from '../database.js';

const signupValidation = [
    check('first_name', 'First name is requied').not().isEmpty(),
    check('last_name', 'Last name is requied').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: true }),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 })
];

const loginValidation = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: true }),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 })
];

const updateValidation = [
    check('first_name', 'First name is requied').not().isEmpty(),
    check('last_name', 'Last name is requied').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: true }),
];

authRouter.post('/register', signupValidation, async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const firt_name = req.body.first_name;
    const last_name = req.body.last_name;
    const users = await getUserByEmail(email);
    
    if (users != null){
        return res.status(409).send({
            msg: 'This user is already in use!'
        });
    } 
    
    bcrypt.hash(password, 10, async (err, hashPassword) => {
        if (err) {
            return res.status(500).send({
            msg: err
            });
        } 
            
        const newUser = await createUser(firt_name, last_name, email, hashPassword);

        if (newUser == null){
            return res.status(400).send({
                msg: 'Error creating new user'
            });
        } else {
            return res.status(201).send({
                msg: 'The user has been registerd with us!'
            });
        }
        
    });
    
});

authRouter.post('/login', loginValidation, async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const user = await getUserByEmail(email);
    
    if (user == null){
        return res.status(409).send({
            msg: 'Email or password is incorrect!'
        });
    }

    const user_id = user.user_id;

    bcrypt.compare(password, user.password, async (bErr, bResult) => {
        if (bErr) {
            return res.status(401).send({
                msg: 'Email or password is incorrect!'
            });
        }

        if (bResult) {
            const token = jwt.sign({user_id: user_id},'the-super-strong-secrect', { expiresIn: '1h' });
            
            const updatedUser = await updateLastLoginTime(user_id);
            
            if (updatedUser == null){
                return res.status(401).send({
                    msg: 'Email or password is incorrect!'
                });
            }

            return res.status(200).send({
                msg: 'Logged in!',
                token,
                user: updatedUser
            });

        }

        return res.status(401).send({
            msg: 'Username or password is incorrect!'
        });
    });     
});

authRouter.post('/updateUser', updateValidation, async (req, res, next) => {
    const email = req.body.email;
    const first_name = req.body.first_name;
    const last_name = req.body.last_name;

    if(!req.headers.authorization || !req.headers.authorization.startsWith('Bearer') ||!req.headers.authorization.split(' ')[1]){
        return res.status(422).json({
            message: "Please provide the token",
        });
    }

    const theToken = req.headers.authorization.split(' ')[1];

    jwt.verify(theToken, 'the-super-strong-secrect', async (err, authorizedData) =>{
        if (err){
            return res.status(422).json({
                message: "Please provide the token",
            });
        }

        const updatedUser = await updateUserInfo(authorizedData.user_id, first_name, last_name, email);

        if (updatedUser.first_name !== first_name || updatedUser.last_name !== last_name || updatedUser.email !== email){
            return res.status(401).send(
                { error: true, user: updatedUser, message: 'User Update Unsuccessfully.' }
            );
        }

        return res.send({ error: false, user: updatedUser, message: 'User Update Successfully.' });
        
    });
});

export {authRouter};
