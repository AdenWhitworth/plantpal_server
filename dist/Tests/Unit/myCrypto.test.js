"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const myCrypto_1 = require("../../Helper/myCrypto");
/**
 * Mocking the crypto.
 */
jest.mock('crypto');
/**
 * Test suite for encryption and decryption functions.
 */
describe('Encryption and Decryption', () => {
    const mockText = 'Hello, World!';
    const mockIv = Buffer.from('mock_iv_value_16_bytes');
    const mockEncryptedBuffer = Buffer.from('encrypted_content');
    const mockDecryptedBuffer = Buffer.from(mockText);
    const mockEncryptedData = {
        iv: mockIv.toString('hex'),
        content: mockEncryptedBuffer.toString('hex')
    };
    const mockHashData = {
        iv: mockIv.toString('hex'),
        content: mockEncryptedBuffer.toString('hex')
    };
    afterEach(() => {
        jest.clearAllMocks();
    });
    /**
     * Test suite for the `encrypt` function.
     */
    describe('encrypt', () => {
        /**
         * Test case for encrypting text.
         * It verifies that the given text is encrypted and the correct data is returned.
         */
        it('should encrypt the given text and return encrypted data', () => {
            crypto_1.default.randomBytes.mockReturnValue(mockIv);
            const mockCipher = {
                update: jest.fn().mockReturnValue(mockEncryptedBuffer),
                final: jest.fn().mockReturnValue(Buffer.alloc(0))
            };
            crypto_1.default.createCipheriv.mockReturnValue(mockCipher);
            const encryptedData = (0, myCrypto_1.encrypt)(mockText);
            expect(crypto_1.default.randomBytes).toHaveBeenCalledWith(16);
            expect(crypto_1.default.createCipheriv).toHaveBeenCalledWith('aes-256-ctr', process.env.cryptoSecretKey, mockIv);
            expect(mockCipher.update).toHaveBeenCalledWith(mockText);
            expect(encryptedData).toEqual(mockEncryptedData);
        });
    });
    /**
     * Test suite for the `decrypt` function.
     */
    describe('decrypt', () => {
        /**
         * Test case for decrypting data.
         * It verifies that the given hash is decrypted and the original text is returned.
         */
        it('should decrypt the given hash and return the original text', () => {
            const mockDecipher = {
                update: jest.fn().mockReturnValue(mockDecryptedBuffer),
                final: jest.fn().mockReturnValue(Buffer.alloc(0))
            };
            crypto_1.default.createDecipheriv.mockReturnValue(mockDecipher);
            const decryptedText = (0, myCrypto_1.decrypt)(mockHashData);
            expect(crypto_1.default.createDecipheriv).toHaveBeenCalledWith('aes-256-ctr', process.env.cryptoSecretKey, Buffer.from(mockHashData.iv, 'hex'));
            expect(mockDecipher.update).toHaveBeenCalledWith(Buffer.from(mockHashData.content, 'hex'));
            expect(decryptedText).toEqual(mockText);
        });
    });
});
