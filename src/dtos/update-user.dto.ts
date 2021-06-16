import { IsBoolean, IsEmail, IsNumber, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';
import { IsNotBlankValidator } from '../isNotBlankValidator';
import { USER_TYPE } from '../users/user.schema';

export class UpdateUserDTO {
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @IsNotBlankValidator() firstName?: string;
  @IsOptional() @IsString() @IsNotBlankValidator() lastName?: string;
  @IsOptional() @IsString() aboutMe?: string;
  @IsOptional() @ValidateIf(o => o.orcid !== '') @IsUrl() orcid?: string;
  @IsOptional() @ValidateIf(o => o.linkedin !== '') @IsUrl() linkedin?: string;
  @IsOptional() @ValidateIf(o => o.blog !== '') @IsUrl() blog?: string;
  @IsOptional() @IsString() role?: string;
  @IsOptional() @IsString({ each: true }) starredDeposits?: string[];
  @IsOptional() @IsBoolean() isOnboarded?: boolean;
  @IsOptional() @IsBoolean() acceptedTC?: boolean;
  @IsOptional() @IsNumber() simultaneousReviews?: number;
  @IsOptional() @IsString() userType?: USER_TYPE;
  @IsOptional() communities?: string[];
  @IsOptional() @IsString({ each: true }) disciplines?: string[];
}
