import * as stream from 'stream';
import { Readable } from 'stream';

export interface IStorageService {

  get(s3Object: string): stream.Readable;

  save(s3Object: string, buffer: Buffer | Uint8Array | Blob | string | Readable): void;

  delete(objectKey: string): void;
}
