"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
const crypto_1 = __importDefault(require("crypto"));
const algorithm = 'aes-256-ctr';
const cryptoSecretKey = process.env.cryptoSecretKey;
/**
 * Encrypts the given text using AES-256-CTR algorithm.
 *
 * @param {string} text - The plain text to encrypt.
 * @returns {EncryptedData} An object containing the initialization vector and the encrypted content.
 */
function encrypt(text) {
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv(algorithm, cryptoSecretKey, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex')
    };
}
/**
 * Decrypts the given hash data using AES-256-CTR algorithm.
 *
 * @param {HashData} hash - An object containing the initialization vector and the encrypted content.
 * @returns {string} The decrypted plain text.
 */
function decrypt(hash) {
    const decipher = crypto_1.default.createDecipheriv(algorithm, cryptoSecretKey, Buffer.from(hash.iv, 'hex'));
    const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);
    return decrpyted.toString();
}
