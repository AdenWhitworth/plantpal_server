"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.signToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Signs a JWT token with the provided payload, secret, and expiry time.
 *
 * @param {TokenPayload} payload - The payload to encode in the token.
 * @param {string} secret - The secret key used to sign the token.
 * @param {string} expiry - The expiration time for the token (e.g., "1h", "2d").
 * @returns {string} The signed JWT token.
 */
const signToken = (payload, secret, expiry) => {
    const signOptions = {
        expiresIn: expiry,
    };
    return jsonwebtoken_1.default.sign(payload, secret, signOptions);
};
exports.signToken = signToken;
/**
 * Verifies a JWT token and returns the decoded payload.
 *
 * @param {string} token - The JWT token to verify.
 * @param {string} secret - The secret key used to verify the token.
 * @returns {JwtPayload|string} The decoded payload if verification is successful, or an error message if it fails.
 * @throws {Error} Throws an error if the token is invalid or expired.
 */
const verifyToken = (token, secret) => {
    try {
        return jsonwebtoken_1.default.verify(token, secret);
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error('Invalid or expired token: ' + error.message);
        }
        else {
            throw new Error('Token verification failed');
        }
    }
};
exports.verifyToken = verifyToken;
