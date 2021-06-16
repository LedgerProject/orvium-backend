import { IsOptional, IsString } from 'class-validator';
import { INVITE_TYPE } from '../invite/invite.schema';

export class CreateInviteDTO {
  @IsString() inviteType!: INVITE_TYPE;
  sender!: string;
  @IsString() addressee!: string;
  @IsOptional() data!: {
    depositId: string
  };
}
