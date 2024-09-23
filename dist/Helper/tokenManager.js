"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateResetToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwtManager_1 = require("./jwtManager");
const database_1 = require("../MySQL/database");
/**
 * Generates an access token for the given user.
 *
 * @param {User} user - The user for whom to generate the access token.
 * @returns {string} The generated access token.
 */
const generateAccessToken = (user) => {
    return (0, jwtManager_1.signToken)({ user_id: user.user_id }, process.env.AUTH_ACCESS_TOKEN_SECRET, process.env.AUTH_ACCESS_TOKEN_EXPIRY);
};
exports.generateAccessToken = generateAccessToken;
/**
 * Generates a refresh token for the given user and saves/updates it in the database..
 *
 * @param {User} user - The user for whom to generate the refresh token.
 * @returns {Promise<string>} A promise that resolves to the generated refresh token.
 * @throws {Error} If there is an error generating the refresh token.
 */
const generateRefreshToken = (user) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const refreshToken = (0, jwtManager_1.signToken)({ user_id: user.user_id }, process.env.AUTH_REFRESH_TOKEN_SECRET, process.env.AUTH_REFRESH_TOKEN_EXPIRY);
        const hashedRefreshToken = yield bcryptjs_1.default.hash(refreshToken, 10);
        yield (0, database_1.updateRefreshToken)(user.user_id, hashedRefreshToken);
        return refreshToken;
    }
    catch (error) {
        throw new Error('Error generating refresh token');
    }
});
exports.generateRefreshToken = generateRefreshToken;
/**
 * Generates a password reset token for the given user and saves/updates it in the database.
 *
 * @param {User} user - The user for whom to generate the reset token.
 * @returns {Promise<string>} A promise that resolves to the generated reset token.
 * @throws {Error} If there is an error generating the reset token.
 */
const generateResetToken = (user) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const resetTokenValue = crypto_1.default.randomBytes(20).toString('base64url');
        const resetTokenSecret = crypto_1.default.randomBytes(10).toString('hex');
        const resetToken = `${resetTokenValue}+${resetTokenSecret}`;
        const expiryMinutes = parseInt(process.env.RESET_PASSWORD_TOKEN_EXPIRY_MINS, 10);
        const resetTokenExpiryTimestamp = Date.now() + (expiryMinutes * 60 * 1000);
        const formattedResetTokenExpiry = new Date(resetTokenExpiryTimestamp).toISOString().slice(0, 19).replace('T', ' ');
        const hashedResetToken = yield bcryptjs_1.default.hash(resetToken, 10);
        yield (0, database_1.updateResetToken)(user.user_id, hashedResetToken, formattedResetTokenExpiry);
        return resetToken;
    }
    catch (error) {
        throw new Error('Error generating reset token');
    }
});
exports.generateResetToken = generateResetToken;
