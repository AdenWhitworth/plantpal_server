/**
 * @module CallbackManagerTests
 */
import { handleSocketCallback, extractErrorMessage } from '../../Helper/callbackManager'
import { CallbackResponse } from '../../Types/types';

/**
 * Tests for the `handleSocketCallback` function.
 * @function
 */
describe('handleSocketCallback', () => {
    const mockCallback = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

     /**
     * Test case to verify that the callback is called with the correct response
     * when a valid `user_id` is provided.
     */
    it('should call the callback with the correct response when user_id is provided', () => {
        const expectedResponse: CallbackResponse = {
            error: false,
            message: 'Success',
            user_id: 1,
        };

        handleSocketCallback(mockCallback, false, 'Success', 1);

        expect(mockCallback).toHaveBeenCalledWith(expectedResponse);
    });

    /**
     * Test case to verify that the callback is called with the correct response
     * when `user_id` is undefined.
     */
    it('should call the callback with the correct response when user_id is undefined', () => {
        const expectedResponse: CallbackResponse = {
            error: true,
            message: 'Error occurred',
        };

        handleSocketCallback(mockCallback, true, 'Error occurred');

        expect(mockCallback).toHaveBeenCalledWith(expectedResponse);
    });
});

/**
 * Tests for the `extractErrorMessage` function.
 * @function
 */
describe('extractErrorMessage', () => {
    /**
     * Test case to verify that an error message is returned when an Error object is passed.
     */
    it('should return the error message when passed an Error object', () => {
        const error = new Error('Something went wrong');
        const result = extractErrorMessage(error);
        expect(result).toBe('Something went wrong');
    });

    /**
     * Test case to verify that a string representation of the error is returned
     * when a non-Error object is passed.
     */
    it('should return the string representation of the error when passed a non-Error object', () => {
        const error = 'This is an error';
        const result = extractErrorMessage(error);
        expect(result).toBe('This is an error');
    });

    /**
     * Test case to verify that a string representation of the error is returned
     * when a number is passed.
     */
    it('should return the string representation of the error when passed a number', () => {
        const error = 404;
        const result = extractErrorMessage(error);
        expect(result).toBe('404');
    });

    /**
     * Test case to verify that a string representation of the error is returned
     * when an object is passed.
     */
    it('should return the string representation of the error when passed an object', () => {
        const error = { message: 'Custom error' };
        const result = extractErrorMessage(error);
        expect(result).toBe('[object Object]');
    });
});

