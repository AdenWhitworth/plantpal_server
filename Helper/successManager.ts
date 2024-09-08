import { Response } from 'express';

export const successHandler = (message: string, statusCode: number, res: Response, accessToken?: string) => {
    statusCode = statusCode || 200;
    message = message || 'Success';

    return res.status(statusCode).json({ message, accessToken });
    
}