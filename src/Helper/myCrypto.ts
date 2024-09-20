import crypto from 'crypto';
import { HashData, EncryptedData } from '../Types/types';

const algorithm = 'aes-256-ctr';
const cryptoSecretKey = process.env.cryptoSecretKey as string;

/**
 * Encrypts the given text using AES-256-CTR algorithm.
 *
 * @param {string} text - The plain text to encrypt.
 * @returns {EncryptedData} An object containing the initialization vector and the encrypted content.
 */
export function encrypt(text: string): EncryptedData {
  const iv = crypto.randomBytes(16)

  const cipher = crypto.createCipheriv(algorithm, cryptoSecretKey, iv)

  const encrypted = Buffer.concat([cipher.update(text), cipher.final()])

  return {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex')
  }
}

/**
 * Decrypts the given hash data using AES-256-CTR algorithm.
 *
 * @param {HashData} hash - An object containing the initialization vector and the encrypted content.
 * @returns {string} The decrypted plain text.
 */
export function decrypt(hash: HashData): string {
  const decipher = crypto.createDecipheriv(algorithm, cryptoSecretKey, Buffer.from(hash.iv, 'hex'))

  const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()])

  return decrpyted.toString()
}