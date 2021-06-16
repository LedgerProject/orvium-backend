import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateReviewDTO {
  @IsBoolean() revealReviewerIdentity!: boolean;
  @IsString() deposit!: string;
  @IsOptional() @IsString() invite?: string;
}
