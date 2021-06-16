import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsNotBlankValidator } from '../../isNotBlankValidator';

export class CreateDepositDTO {
  @IsString() @IsNotBlankValidator({ message: 'Title should not be empty' })
  title!: string;
  @IsOptional() @IsNotEmpty() community?: string;
  @IsOptional() @IsNotEmpty() doi?: string;
}
