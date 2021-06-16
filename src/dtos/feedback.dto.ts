import { IsDataURI, IsEmail, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class FeedbackDTO {
  @ValidateIf(o => !!o.email) @IsEmail()
  email?: string;

  @IsString() @IsNotEmpty() description!: string;
  @IsOptional() @IsDataURI() screenshot?: unknown;
  @IsOptional() data?: unknown;
}
