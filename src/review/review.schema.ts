import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
import { IsBoolean, IsDate, IsJSON, IsNumber, IsOptional, IsString } from 'class-validator';
import { Deposit, REVIEW_TYPE } from '../deposit/deposit.schema';
import { IsNotBlankValidator } from '../isNotBlankValidator';

export enum REVIEW_STATUS {
  draft = 'draft',
  published = 'published'
}

export class CreateReviewDTO {
  @IsBoolean() revealReviewerIdentity: boolean;
  @IsString() deposit: string;
}


export class UpdateReviewDTO {
  @IsOptional() @IsString() @IsNotBlankValidator({ message: 'Author should not be empty' }) author: string;
  @IsOptional() @IsString() comments: string;
  @IsOptional() @IsString() status: REVIEW_STATUS;
  @IsOptional() @IsNumber() reward: number;
  @IsOptional() @IsBoolean() revealReviewerIdentity: boolean;
  @IsOptional() @IsString() decision: string;
  @IsOptional() @IsJSON() transactions: unknown;
  @IsOptional() @IsDate() publicationDate: Date;
  @IsOptional() @IsBoolean() wasInvited: boolean;
}

export class UpdatePublishedReviewDTO {
  @IsOptional() @IsNumber() reward: number;
  @IsOptional() @IsJSON() transactions: unknown;

  constructor(partial: Partial<UpdatePublishedReviewDTO>) {
    Object.assign(this, partial);
  }
}

@Schema({ collection: 'peer_review', timestamps: true })
export class Review extends Document {
  @Prop({ required: true, trim: true }) owner: string;
  @Prop({ required: true, trim: true }) author: string;
  @Prop({ trim: true }) comments?: string;
  @Prop({
    required: true,
    enum: Object.values(REVIEW_STATUS),
    default: REVIEW_STATUS.draft })
  status: REVIEW_STATUS;

  @Prop() reward?: number;
  @Prop({ required: true, ref: 'Deposit' })
  deposit: mongoose.Schema.Types.ObjectId;

  @Prop() revealReviewerIdentity?: boolean;
  @Prop() gravatar?: string;
  @Prop() decision?: string;
  @Prop(mongoose.SchemaTypes.Mixed) file?: Record<string, any>;
  @Prop(mongoose.SchemaTypes.Mixed) transactions?: any;
  @Prop({ required: true, default: Date.now }) creationDate: Date;
  @Prop() publicationDate?: Date;
  @Prop({ required: true, default: false }) wasInvited: boolean;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
