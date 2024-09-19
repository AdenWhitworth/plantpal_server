import { Response } from 'express';
import { CustomError, errorHandler } from '../../Helper/errorManager';

describe('CustomError', () => {
    it('should create a CustomError with the correct message and status code', () => {
        const error = new CustomError('Test error', 400);

        expect(error.message).toBe('Test error');
        expect(error.statusCode).toBe(400);
        expect(error.name).toBe('CustomError');
        expect(error.stack).toBeDefined();
    });
});

describe('errorHandler', () => {
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    beforeAll(() => {
        process.env.NODE_ENV = 'production';
    });

    it('should return the correct error response in production', () => {
        const error = new CustomError('Not Found', 404);
        errorHandler(error, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith({
            message: 'Not Found',
        });
    });

    it('should return the correct error response in development', () => {
        process.env.NODE_ENV = 'development';

        const error = new CustomError('Not Found', 404);
        errorHandler(error, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith({
            message: 'Not Found',
            stack: error.stack,
        });
    });

    it('should return 500 status code if no statusCode is provided', () => {
        const error = new CustomError('Internal Server Error', undefined as unknown as number);
        errorHandler(error, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Internal Server Error',
        }));
    });

    it('should return the default error message if no message is provided', () => {
        const error = new CustomError(undefined as unknown as string, 500);
        errorHandler(error, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'An unexpected error occurred',
        }));
    });
});
