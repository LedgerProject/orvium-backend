import { IsJSON, IsNumber, IsOptional } from 'class-validator';

export class UpdatePublishedReviewDTO {
  @IsOptional() @IsNumber() reward?: number;
  @IsOptional() @IsJSON() transactions?: unknown;

  constructor(partial: Partial<UpdatePublishedReviewDTO>) {
    Object.assign(this, partial);
  }
}
