import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
import { UserDocument } from '../users/user.schema';

export enum INVITE_TYPE {
  review = 'review',
}

export enum INVITE_STATUS {
  pending = 'pending',
  accepted = 'accepted',
  rejected = 'rejected'
}

@Schema({ collection: 'invite', timestamps: true })
export class InviteDocument extends Document {
  @Prop({ required: true, trim: true })
  inviteType!: INVITE_TYPE;
  @Prop({ required: true, default: INVITE_STATUS.pending })
  status!: INVITE_STATUS;
  @Prop({ required: true })
  deadline!: Date;
  @Prop({ required: true, ref: UserDocument.name })
  sender!: mongoose.Schema.Types.ObjectId;
  @Prop({ required: true, trim: true, lowercase: true })
  addressee!: string;
  @Prop({ required: true, default: Date.now })
  createdOn!: Date;
  @Prop({ type: mongoose.SchemaTypes.Mixed })
  data?: Record<string, unknown>;
}

export const InviteSchema = SchemaFactory.createForClass(InviteDocument);
