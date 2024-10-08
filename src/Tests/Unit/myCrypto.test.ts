import crypto from 'crypto';
import { encrypt, decrypt } from '../../Helper/myCrypto';

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
            (crypto.randomBytes as jest.Mock).mockReturnValue(mockIv);
            const mockCipher = {
                update: jest.fn().mockReturnValue(mockEncryptedBuffer),
                final: jest.fn().mockReturnValue(Buffer.alloc(0))
            };
            (crypto.createCipheriv as jest.Mock).mockReturnValue(mockCipher);

            const encryptedData = encrypt(mockText);

            expect(crypto.randomBytes).toHaveBeenCalledWith(16);
            expect(crypto.createCipheriv).toHaveBeenCalledWith('aes-256-ctr', process.env.cryptoSecretKey, mockIv);
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
            (crypto.createDecipheriv as jest.Mock).mockReturnValue(mockDecipher);

            const decryptedText = decrypt(mockHashData);

            expect(crypto.createDecipheriv).toHaveBeenCalledWith(
                'aes-256-ctr',
                process.env.cryptoSecretKey,
                Buffer.from(mockHashData.iv, 'hex')
            );
            expect(mockDecipher.update).toHaveBeenCalledWith(Buffer.from(mockHashData.content, 'hex'));
            expect(decryptedText).toEqual(mockText);
        });
    });
});