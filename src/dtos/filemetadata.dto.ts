export class FileMetadata {
  filename!: string;
  contentType!: string;
  contentLength!: number;
  tags!: string[];
  presignedURL?: string;
}
