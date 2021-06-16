import { decryptJson, encryptJson } from './utils';

describe('Utils', () => {
  it('should be encrypt and decrypt json', () => {
    const json = { test: 'any value' };
    const encrypted = encryptJson(json);
    const decrypted = decryptJson(encrypted);
    expect(decrypted).toStrictEqual(json);
  });
});
