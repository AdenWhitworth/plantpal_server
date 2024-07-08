import express from 'express';
const dashboardRouter = express.Router();
import { check } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUserDevices, getDeviceLogs, getLastDeviceLog } from '../database.js';

const deviceValidation = [
    check('cat_num', 'Catalog number is requied').not().isEmpty()
];

dashboardRouter.get('/userDevices', async (req, res, next) => {
    
    if(!req.headers.authorization || !req.headers.authorization.startsWith('Bearer') ||!req.headers.authorization.split(' ')[1]){
        return res.status(422).json({
            message: "Please provide the token 1",
        });
    }

    const theToken = req.headers.authorization.split(' ')[1];

    jwt.verify(theToken, 'the-super-strong-secrect', async (err, authorizedData) =>{
        if (err){
            return res.status(422).json({
                message: "Please provide the token 2",
            });
        }

        const devices = await getUserDevices(authorizedData.user_id);

        if (devices == null){
            return res.send({ error: false, devices: [], message: 'Fetch Successfully.' });
        }

        return res.send({ error: false, devices: devices, message: 'Fetch Successfully.' });
        
    });

});

dashboardRouter.get('/deviceLogs', deviceValidation, async (req, res, next) => {
    
    const cat_num = req.query.cat_num;

    if(!req.headers.authorization || !req.headers.authorization.startsWith('Bearer') ||!req.headers.authorization.split(' ')[1]){
        return res.status(422).json({
            message: "Please provide the token 1",
        });
    }

    const theToken = req.headers.authorization.split(' ')[1];

    jwt.verify(theToken, 'the-super-strong-secrect', async (err, authorizedData) =>{
        if (err){
            return res.status(422).json({
                message: "Please provide the token 2",
            });
        }

        const deviceLogs = await getDeviceLogs(cat_num);

        const lastLog = await getLastDeviceLog(cat_num);

        if (deviceLogs == null){
            return res.send({ error: false, deviceLogs: [], lastLog: lastLog, cat_num: cat_num, message: 'Fetch Successfully.' });
        }

        return res.send({ error: false, deviceLogs: deviceLogs, lastLog: lastLog, cat_num: cat_num, message: 'Fetch Successfully.' });
        
    });

});

export {dashboardRouter};