import { Exclude, Expose, Type } from 'class-transformer';
import { COMMUNITY_TYPE } from '../communities/communities.schema';
import { UserSummaryDTO } from './user-summary.dto';
import { CommunityUser } from './community-user.dto';
import { CallForPapers } from './community-callforpapers.dto';

@Exclude()
export class CommunityPrivateDTO {
  @Expose() _id!: string;
  @Expose() name!: string;
  @Expose() users!: CommunityUser[];
  @Expose() description?: string;
  @Expose() country?: string;
  @Expose() type?: COMMUNITY_TYPE;
  @Expose() codename?: string;
  @Expose() acknowledgement?: string;
  @Expose() twitterURL?: string;
  @Expose() facebookURL?: string;
  @Expose() websiteURL?: string;
  @Expose() logoURL?: string;
  @Expose() guidelinesURL?: string;
  @Expose() dataciteEnabled!: boolean;
  @Expose() callForPapers?: CallForPapers;
  @Expose() dataciteAccountID?: string;
  @Expose() datacitePrefix?: string;
  @Expose() @Type(() => UserSummaryDTO) moderators?: UserSummaryDTO[];
  @Expose() actions: string[] = [];
}
