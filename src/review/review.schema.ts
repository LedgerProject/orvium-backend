import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
import { DepositDocument } from '../deposit/deposit.schema';
import { UserDocument } from '../users/user.schema';
import { FileMetadata } from '../dtos/filemetadata.dto';

export enum REVIEW_STATUS {
  draft = 'draft',
  published = 'published'
}

export enum REVIEW_DECISION {
  accepted = 'accepted',
  minorRevision = 'minor revision',
  mayorRevision = 'mayor revision'
}

@Schema({ collection: 'peer_review', timestamps: true, toJSON: { virtuals: true } })
export class ReviewDocument extends Document {
  @Prop({ required: true, trim: true }) owner!: string;
  @Prop({ required: true, trim: true }) author!: string;
  @Prop({ trim: true }) comments?: string;
  @Prop({
    required: true,
    enum: Object.values(REVIEW_STATUS),
    default: REVIEW_STATUS.draft
  })
  status!: REVIEW_STATUS;
  @Prop() reward?: number;
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DepositDocument'
  })
  deposit!: mongoose.Schema.Types.ObjectId | string;
  @Prop({ required: true, default: false })
  revealReviewerIdentity!: boolean;
  @Prop() gravatar?: string;
  @Prop({
    required: true,
    enum: Object.values(REVIEW_DECISION),
    default: REVIEW_DECISION.accepted
  }) decision?: REVIEW_DECISION;
  @Prop({ type: mongoose.SchemaTypes.Mixed }) file?: FileMetadata;
  @Prop({ type: mongoose.SchemaTypes.Mixed }) transactions?: unknown;
  @Prop({ required: true, default: Date.now }) creationDate!: Date;
  @Prop() publicationDate?: Date;
  @Prop({ required: true, default: false }) wasInvited!: boolean;
  @Prop() keccak256?: string;
}

export const ReviewSchema = SchemaFactory.createForClass(ReviewDocument);

ReviewSchema.virtual('ownerProfile', {
  ref: UserDocument.name,
  localField: 'owner',
  foreignField: 'userId',
  justOne: true
});

