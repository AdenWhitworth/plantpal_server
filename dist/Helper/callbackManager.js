"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSocketCallback = handleSocketCallback;
exports.extractErrorMessage = extractErrorMessage;
/**
 * Handles the socket callback by constructing a CallbackResponse object
 * and invoking the provided callback function.
 *
 * @param {(response: CallbackResponse) => void} callback - A function that takes a CallbackResponse object as input.
 * @param {boolean} error - A boolean indicating if an error occurred.
 * @param {string} message - A message providing additional information about the result or error.
 * @param {number} [user_id] - An optional user ID related to the callback response.
 */
function handleSocketCallback(callback, error, message, user_id) {
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
function extractErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
