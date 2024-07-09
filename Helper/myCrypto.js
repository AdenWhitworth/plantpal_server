import crypto from 'crypto';

const algorithm = 'aes-256-ctr';
const cryptoSecretKey = process.env.cryptoSecretKey;

export function encrypt(text) {
  const iv = crypto.randomBytes(16)

  const cipher = crypto.createCipheriv(algorithm, cryptoSecretKey, iv)

  const encrypted = Buffer.concat([cipher.update(text), cipher.final()])

  return {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex')
  }
}

export function decrypt(hash) {
  const decipher = crypto.createDecipheriv(algorithm, cryptoSecretKey, Buffer.from(hash.iv, 'hex'))

  const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()])

  return decrpyted.toString()
}