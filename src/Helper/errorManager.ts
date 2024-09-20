import { Response } from 'express';

/**
 * Represents a custom error with a status code.
 */
export class CustomError extends Error {
    statusCode: number;

    /**
     * Creates an instance of CustomError.
     *
     * @param {string} message - The error message.
     * @param {number} statusCode - The HTTP status code associated with the error.
     */
    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'CustomError';
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Middleware function to handle errors.
 *
 * This function sends a JSON response with the error message and stack trace
 * depending on the environment (production or development).
 *
 * @param {CustomError} err - The error object, expected to be an instance of CustomError.
 * @param {Response} res - The Express response object used to send the error response.
 */
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