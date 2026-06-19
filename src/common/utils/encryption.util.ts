import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

// stored as iv:tag:ciphertext, all hex, colon separated
export class EncryptionUtil {
  private static getKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    // SHA-256 hash of the key to get exactly 32 bytes
    return crypto.createHash('sha256').update(key).digest();
  }

  // returns hex(iv):hex(tag):hex(ciphertext)
  static encrypt(plainText: string): string {
    if (!plainText) return plainText;
    
    const key = this.getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plainText, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  // expects hex(iv):hex(tag):hex(ciphertext)
  static decrypt(encryptedText: string): string {
    if (!encryptedText) return encryptedText;

    // check if it's already encrypted (has the iv:tag:cipher format)
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      // old plain rows come back as-is
      return encryptedText;
    }

    try {
      const key = this.getKey();
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const ciphertext = Buffer.from(parts[2], 'hex');

      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      // if decryption fails, it might be unencrypted (backward compat)
      return encryptedText;
    }
  }

  /**
   * Check if a string is encrypted (has the correct format)
   */
  static isEncrypted(text: string): boolean {
    if (!text) return false;
    const parts = text.split(':');
    if (parts.length !== 3) return false;
    // check if all parts are valid hex
    return parts.every(p => /^[0-9a-f]+$/.test(p));
  }

  /**
   * Generate a random encryption key (for initial setup)
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
