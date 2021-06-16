import { INVITE_STATUS, INVITE_TYPE } from '../invite/invite.schema';
import { Exclude, Expose, Type } from 'class-transformer';
import { UserSummaryDTO } from './user-summary.dto';

@Exclude()
export class InviteDTO {
  @Expose() _id!: string;
  @Expose() inviteType!: INVITE_TYPE;
  @Expose() status!: INVITE_STATUS;
  @Expose() deadline!: Date;
  @Expose() @Type(() => UserSummaryDTO) sender!: UserSummaryDTO;
  @Expose() addressee!: string;
  @Expose() createdOn!: Date;
  @Expose() data?: Record<string, unknown>;
  @Expose() actions: string[] = [];
}
