import { IsEmail } from 'class-validator';

export class SendInviteBody {
  @IsEmail({}, { each: true })
  emails!: string[];
}
