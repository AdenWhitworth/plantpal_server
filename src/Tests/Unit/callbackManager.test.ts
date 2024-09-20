import { handleSocketCallback, CallbackResponse, extractErrorMessage } from '../../Helper/callbackManager'

describe('handleSocketCallback', () => {
    const mockCallback = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call the callback with the correct response when user_id is provided', () => {
        const expectedResponse: CallbackResponse = {
            error: false,
            message: 'Success',
            user_id: 1,
        };

        handleSocketCallback(mockCallback, false, 'Success', 1);

        expect(mockCallback).toHaveBeenCalledWith(expectedResponse);
    });

    it('should call the callback with the correct response when user_id is undefined', () => {
        const expectedResponse: CallbackResponse = {
            error: true,
            message: 'Error occurred',
        };

        handleSocketCallback(mockCallback, true, 'Error occurred');

        expect(mockCallback).toHaveBeenCalledWith(expectedResponse);
    });
});

describe('extractErrorMessage', () => {
    it('should return the error message when passed an Error object', () => {
        const error = new Error('Something went wrong');
        const result = extractErrorMessage(error);
        expect(result).toBe('Something went wrong');
    });

    it('should return the string representation of the error when passed a non-Error object', () => {
        const error = 'This is an error';
        const result = extractErrorMessage(error);
        expect(result).toBe('This is an error');
    });

    it('should return the string representation of the error when passed a number', () => {
        const error = 404;
        const result = extractErrorMessage(error);
        expect(result).toBe('404');
    });

    it('should return the string representation of the error when passed an object', () => {
        const error = { message: 'Custom error' };
        const result = extractErrorMessage(error);
        expect(result).toBe('[object Object]');
    });
});

