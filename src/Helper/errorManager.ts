import { Response } from 'express';

export class CustomError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'CustomError';
        Error.captureStackTrace(this, this.constructor);
    }
}

export const errorHandler = (err: CustomError, res: Response) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'An unexpected error occurred';

    if (process.env.NODE_ENV === 'production') {
        return res.status(statusCode).json({ message });
    }

    return res.status(statusCode).json({
        message,
        stack: err.stack,
    });
}