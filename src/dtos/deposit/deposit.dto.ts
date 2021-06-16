import { Exclude, Expose, Type } from 'class-transformer';
import { ACCESS_RIGHT, CommentDTO, DEPOSIT_STATUS, PUBLICATION_TYPE, REVIEW_TYPE } from '../../deposit/deposit.schema';
import { CommunityDTO } from '../community.dto';
import { UserSummaryDTO } from '../user-summary.dto';
import { ReviewDTO } from '../review.dto';
import { AuthorDTO } from '../author.dto';
import { FileMetadata } from '../filemetadata.dto';
import { Reference } from '../reference.dto';

@Exclude()
export class DepositDTO {
  @Expose() _id!: string;
  @Expose() owner!: string;
  @Expose() @Type(() => UserSummaryDTO) ownerProfile!: UserSummaryDTO;
  @Expose() nickname!: string;
  @Expose() title!: string;
  @Expose() abstract!: string;
  @Expose() publicationType!: PUBLICATION_TYPE;
  @Expose() accessRight!: ACCESS_RIGHT;
  @Expose() submissionDate?: string;
  @Expose() publicationDate?: string;
  @Expose() status!: DEPOSIT_STATUS;
  @Expose() @Type(() => ReviewDTO) peerReviews!: ReviewDTO[];
  @Expose() reviewType!: REVIEW_TYPE;
  @Expose() @Type(() => AuthorDTO) authors!: AuthorDTO[];
  @Expose() transactions?: Record<string, unknown>;
  @Expose() publicationFile?: FileMetadata;
  @Expose() files!: FileMetadata[];
  @Expose() gravatar?: string;
  @Expose() keywords!: string[];
  @Expose() keccak256?: string;
  @Expose() doi?: string;
  @Expose() url?: string;
  @Expose() pdfUrl?: string;
  @Expose() presignedPDFURL?: string;
  @Expose() disciplines: string[] = [];
  @Expose() references?: Reference[];
  @Expose() createdOn?: Date;
  @Expose() version?: number;
  @Expose() @Type(() => CommunityDTO) community?: CommunityDTO;
  @Expose() html?: string;
  @Expose() images?: string[];
  @Expose() comments!: CommentDTO[];
  @Expose() canBeReviewed!: boolean;
  @Expose() gitRepository?: string;
  @Expose() binderURL?: string;
  @Expose() actions: string[] = [];
  @Expose() openAireIdentifier?: string;
}
