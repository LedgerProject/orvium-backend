import { CipherGCMTypes, createCipher, createDecipher } from 'crypto';
import { environment } from '../environments/environment';

const algorithm: CipherGCMTypes = 'aes-192-gcm';

export function encryptJson(value: unknown): string {
  const cipher = createCipher(algorithm, environment.crypto.key as string);
  let buffer = cipher.update(JSON.stringify(value),
    'utf8', 'hex');
  buffer += cipher.final('hex');
  const token = buffer.toString();
  return token;
}

export function decryptJson<T>(token: string): T {
  const decipher = createDecipher(algorithm, environment.crypto.key as string);
  const tokenDecoded = decipher.update(token, 'hex', 'utf8');
  // tokenDecoded += decipher.final('utf8');
  return JSON.parse(tokenDecoded) as T;
}
