import express from 'express';
const router = express.Router();
import { validationResult, check } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUser, createUser } from './database.js';

const signupValidation = [
    check('name', 'Name is requied').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: true }),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 })
];

const loginValidation = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: true }),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 })
];

router.post('/register', signupValidation, async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password
    const name = req.body.name;
    const users = await getUser(email);
    
    if (users != null){
        return res.status(409).send({
            msg: 'This user is already in use!'
        });
    } else {
        bcrypt.hash(password, 10, async (err, hashPassword) => {
            if (err) {
              return res.status(500).send({
                msg: err
              });
            } else {
               
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
            }
        });
    }
});

router.post('/login', loginValidation, async (req, res, next) => {
    const email = req.body.email;
    const users = await getUser(email);
    
    res.send(users);
});

router.post('/getUser', signupValidation, async (req, res, next) => {
    
    const email = req.body.email;
    const password = req.body.password
    const name = req.body.name;
    const users = await getUser(email);
    res.send(users);
    
});

export {router};
