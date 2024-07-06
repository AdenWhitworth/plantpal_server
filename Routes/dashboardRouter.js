import express from 'express';
const dashboardRouter = express.Router();
import { check } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {  } from '../database.js';

const signupValidation = [
    check('first_name', 'First name is requied').not().isEmpty(),
    check('last_name', 'Last name is requied').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: true }),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 })
];

dashboardRouter.post('/register', signupValidation, async (req, res, next) => {
    
    
});

export {dashboardRouter};