import { IsBoolean, IsDate, IsOptional, IsString } from 'class-validator';
import { IsNotBlankValidator } from '../../isNotBlankValidator';
import { ACCESS_RIGHT, DEPOSIT_STATUS, PUBLICATION_TYPE, REVIEW_TYPE } from '../../deposit/deposit.schema';

export class UpdateDepositDTO {
  @IsOptional() @IsString() @IsNotBlankValidator({ message: 'Title should not be empty' })
  title?: string;
  @IsOptional() @IsString() abstract?: string;
  @IsOptional() @IsString() publicationType?: PUBLICATION_TYPE;
  @IsOptional() @IsString() accessRight?: ACCESS_RIGHT;
  @IsOptional() @IsDate() publicationDate?: Date;
  @IsOptional() @IsDate() submissionDate?: Date;
  @IsOptional() @IsString() status?: DEPOSIT_STATUS;
  @IsOptional() @IsString() reviewType?: REVIEW_TYPE;
  @IsOptional() authors?: unknown;
  @IsOptional() transactions?: unknown;
  @IsOptional() @IsString() keccak256?: string;
  @IsOptional() @IsString({ each: true }) keywords?: string[];
  @IsOptional() @IsString() doi?: string;
  @IsOptional() @IsString({ each: true }) disciplines?: string[];
  @IsOptional() references?: unknown;
  @IsOptional() community?: string;
  @IsOptional() @IsBoolean() canBeReviewed?: boolean;
  @IsOptional() @IsString() gitRepository?: string;
}
