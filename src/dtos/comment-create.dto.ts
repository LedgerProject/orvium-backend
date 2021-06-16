import { IsString } from 'class-validator';
import { IsNotBlankValidator } from '../isNotBlankValidator';

export class CreateCommentDTO {
  @IsString() @IsNotBlankValidator({ message: 'Comment should not be empty' })
  content!: string;
}
