import { Exclude, Expose, Type } from 'class-transformer';
import { CommunityDTO } from './community.dto';

@Exclude()
export class UserSummaryDTO {
  @Expose() userId!: string;
  @Expose() firstName!: string;
  @Expose() lastName!: string;
  @Expose() nickname!: string;
  @Expose() @Type(() => CommunityDTO) communities!: CommunityDTO[];
  @Expose() gravatar!: string;
  @Expose() institution?: string;

  constructor(partial: Partial<UserSummaryDTO>) {
    Object.assign(this, partial);
  }
}
