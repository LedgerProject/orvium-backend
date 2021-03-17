import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { IStorageService } from './storage-service.interface';
import * as stream from 'stream';
import { Readable } from 'stream';
import { readFileSync, unlinkSync, writeFileSync, mkdirSync, existsSync } from 'fs';
@Injectable()
export class LocalStorageService implements IStorageService {
  constructor() {
  }

  get(objectKey: string): stream.Readable {
    return Readable.from(readFileSync(`/tmp/${objectKey}`));
  }

  async save(objectKey: string, buffer: Buffer): Promise<void> {
    const keys = objectKey.split('/');
    if (!existsSync(`/tmp/${keys[0]}`)) {
      mkdirSync(`/tmp/${keys[0]}`);
    }
    try {
      writeFileSync(`/tmp/${objectKey}`, buffer);
    } catch(err) {
      throw new InternalServerErrorException('Unable to upload file');
    }
    return;
  }

  async delete(objectKey: string): Promise<void> {
    try {
      unlinkSync(`/tmp/${objectKey}`)
    } catch(err) {
      throw new InternalServerErrorException('Unable to delete file');
    }
    return;
  }
}