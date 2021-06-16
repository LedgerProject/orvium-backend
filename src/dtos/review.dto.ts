import { Exclude, Expose, Type } from 'class-transformer';
import { REVIEW_DECISION, REVIEW_STATUS } from '../review/review.schema';
import { DepositDTO } from './deposit/deposit.dto';
import { UserSummaryDTO } from './user-summary.dto';
import { FileMetadata } from './filemetadata.dto';

@Exclude()
export class ReviewDTO {
  @Expose() _id!: string;
  @Expose() owner!: string;
  @Expose() @Type(() => UserSummaryDTO) ownerProfile!: UserSummaryDTO;
  @Expose() author?: string;
  @Expose() comments?: string;
  @Expose() decision?: REVIEW_DECISION;
  @Expose() file?: FileMetadata;
  @Expose() transactions?: Record<string, unknown>;
  @Expose() url?: string;
  @Expose() fileUrl?: string;
  @Expose() status!: REVIEW_STATUS;
  @Expose() gravatar?: string;
  @Expose() reward?: number;
  @Expose() revealReviewerIdentity!: boolean;
  @Expose() @Type(() => DepositDTO) deposit!: DepositDTO;
  @Expose() creationDate!: string;
  @Expose() publicationDate!: string;
  @Expose() wasInvited?: boolean;
  @Expose() keccak256?: string;
  @Expose() actions: string[] = [];
}
