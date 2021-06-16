import { Exclude, Expose, Type } from 'class-transformer';
import { UserSummaryDTO } from './user-summary.dto';
import { COMMUNITY_TYPE } from '../communities/communities.schema';
import { CallForPapers } from './community-callforpapers.dto';
import { CommunityUser } from './community-user.dto';

@Exclude()
export class CommunityDTO {
  @Expose() _id!: string;
  @Expose() name!: string;
  @Expose() users!: CommunityUser[];
  @Expose() description?: string;
  @Expose() country?: string;
  @Expose() type!: COMMUNITY_TYPE;
  @Expose() codename?: string;
  @Expose() acknowledgement?: string;
  @Expose() twitterURL?: string;
  @Expose() facebookURL?: string;
  @Expose() websiteURL?: string;
  @Expose() logoURL?: string;
  @Expose() guidelinesURL?: string;
  @Expose() callForPapers?: CallForPapers;
  @Expose() @Type(() => UserSummaryDTO) moderators?: UserSummaryDTO[];
  @Expose() actions: string[] = [];
}
