import { CallbackResponse } from "../Types/types";

/**
 * Handles the socket callback by constructing a CallbackResponse object
 * and invoking the provided callback function.
 *
 * @param {(response: CallbackResponse) => void} callback - A function that takes a CallbackResponse object as input.
 * @param {boolean} error - A boolean indicating if an error occurred.
 * @param {string} message - A message providing additional information about the result or error.
 * @param {number} [user_id] - An optional user ID related to the callback response.
 */
export function handleSocketCallback(callback: (response: CallbackResponse) => void, error: boolean, message: string, user_id?: number) {
    callback({
        error,
        message,
        user_id,
    });
}

/**
 * Extracts an error message from an unknown error object.
 *
 * If the error is an instance of Error, the function returns its message.
 * Otherwise, it converts the error to a string.
 *
 * @param {unknown} error - The error object from which to extract the message.
 * @returns {string} The extracted error message as a string.
 */
export function extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}