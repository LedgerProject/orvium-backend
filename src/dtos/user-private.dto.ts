import { Exclude, Expose, Type } from 'class-transformer';
import { CommunityDTO } from './community.dto';
import { USER_TYPE } from '../users/user.schema';

@Exclude()
export class UserPrivateDTO {
  @Expose() userId!: string;
  @Expose() firstName!: string;
  @Expose() lastName!: string;
  @Expose() nickname!: string;
  @Expose() @Type(() => CommunityDTO) communities!: CommunityDTO[];
  @Expose() gravatar!: string;
  @Expose() starredDeposits?: string[];
  @Expose() isReviewer!: boolean;
  @Expose() isOnboarded!: boolean;
  @Expose() institution?: string;
  @Expose() email?: string;
  @Expose() emailConfirmed!: boolean;
  @Expose() orcid?: string;
  @Expose() userType!: USER_TYPE;
  @Expose() disciplines!: string[];
  @Expose() aboutMe?: string;
  @Expose() blog?: string;
  @Expose() role?: string;
  @Expose() roles!: string[];
  @Expose() linkedin?: string;
  @Expose() percentageComplete!: number;
  @Expose() inviteToken?: string;
  @Expose() simultaneousReviews?: number;
  @Expose() acceptedTC!: boolean;
  @Expose() actions: string[] = [];

  constructor(partial: Partial<UserPrivateDTO>) {
    Object.assign(this, partial);
  }
}
