import { IsOptional, IsString } from 'class-validator';
import { IsNotBlankValidator } from '../isNotBlankValidator';
import { COMMUNITY_TYPE } from '../communities/communities.schema';
import { CallForPapers } from './community-callforpapers.dto';

export class CommunityUpdateDto {
  @IsOptional() @IsString() @IsNotBlankValidator({ message: 'Name should not be empty' })
  name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() type?: COMMUNITY_TYPE;
  @IsOptional() @IsString() acknowledgement?: string;
  @IsOptional() @IsString() twitterURL?: string;
  @IsOptional() @IsString() facebookURL?: string;
  @IsOptional() @IsString() websiteURL?: string;
  @IsOptional() @IsString() logoURL?: string;
  @IsOptional() @IsString() guidelinesURL?: string;
  @IsOptional() callForPapers?: CallForPapers;
  @IsOptional() @IsString() dataciteAccountID?: string;
  @IsOptional() @IsString() datacitePassword?: string;
  @IsOptional() @IsString() datacitePrefix?: string;
}
