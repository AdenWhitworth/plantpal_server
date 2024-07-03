import express from 'express';
const router = express.Router();
import { check } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUsers, createUser, getUserByEmail, getUserById, updateLastLoginTime } from './database.js';

const signupValidation = [
    check('name', 'Name is requied').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: true }),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 })
];

const loginValidation = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: true }),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 })
];

const fetchValidation = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: true }),
];

router.post('/register', signupValidation, async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password
    const name = req.body.name;
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
            
        const newUser = await createUser(name, email, hashPassword);

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

router.post('/login', loginValidation, async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password
    const user = await getUserByEmail(email);
    const id = user.id;

    if (user == null){
        return res.status(409).send({
            msg: 'Email or password is incorrect! 4'
        });
    }

    bcrypt.compare(password, user.password, async (bErr, bResult) => {
        if (bErr) {
            return res.status(401).send({
                msg: 'Email or password is incorrect! 1'
            });
        }

        if (bResult) {
            const token = jwt.sign({id: id},'the-super-strong-secrect', { expiresIn: '1h' });
            
            const updatedUser = await updateLastLoginTime(id);
            
            if (updatedUser == null){
                return res.status(401).send({
                    msg: 'Email or password is incorrect! 2'
                });
            }

            return res.status(200).send({
                msg: 'Logged in!',
                token,
                user: updatedUser
            });

        }

        return res.status(401).send({
            msg: 'Username or password is incorrect! 3'
        });
    });     
});

router.post('/getUser', fetchValidation, async (req, res, next) => {
    const email = req.body.email;
    
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

        const user = await getUserById(authorizedData.id);

        if (user == null){
            return res.status(401).send(
                { error: true, user: user, message: 'Fetch Unsuccessfully.' }
            );
        }

        return res.send({ error: false, user: user, message: 'Fetch Successfully.' });
        
    });
});

export {router};
