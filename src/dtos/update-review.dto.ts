import { IsBoolean, IsDate, IsJSON, IsNumber, IsOptional, IsString } from 'class-validator';
import { IsNotBlankValidator } from '../isNotBlankValidator';
import { REVIEW_DECISION, REVIEW_STATUS } from '../review/review.schema';

export class UpdateReviewDTO {
  @IsOptional() @IsString() @IsNotBlankValidator({ message: 'Author should not be empty' })
  author?: string;
  @IsOptional() @IsString() comments?: string;
  @IsOptional() @IsString() status?: REVIEW_STATUS;
  @IsOptional() @IsNumber() reward?: number;
  @IsOptional() @IsBoolean() revealReviewerIdentity?: boolean;
  @IsOptional() @IsString() decision?: REVIEW_DECISION;
  @IsOptional() @IsJSON() transactions?: unknown;
  @IsOptional() @IsDate() publicationDate?: Date;
  @IsOptional() @IsBoolean() wasInvited?: boolean;
  @IsOptional() @IsString() keccak256?: string;
}
