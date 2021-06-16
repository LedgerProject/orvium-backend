import { Exclude, Expose, Type } from 'class-transformer';
import { CommunityDTO } from './community.dto';
import { USER_TYPE } from '../users/user.schema';

@Exclude()
export class UserPublicDTO {
  @Expose() userId!: string;
  @Expose() firstName!: string;
  @Expose() lastName!: string;
  @Expose() nickname!: string;
  @Expose() @Type(() => CommunityDTO) communities!: CommunityDTO[];
  @Expose() gravatar!: string;
  @Expose() isReviewer!: boolean;
  @Expose() institution?: string;
  @Expose() orcid?: string;
  @Expose() userType!: USER_TYPE;
  @Expose() disciplines!: string[];
  @Expose() aboutMe?: string;
  @Expose() blog?: string;
  @Expose() role?: string;
  @Expose() linkedin?: string;
  @Expose() actions: string[] = [];

  constructor(partial: Partial<UserPublicDTO>) {
    Object.assign(this, partial);
  }
}
