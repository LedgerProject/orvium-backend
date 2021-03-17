import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
import { IsOptional, IsString } from 'class-validator';

export enum INVITE_TYPE {
  review = 'review',
}

export enum INVITE_STATUS {
  pending = 'pending',
  accepted = 'accepted',
  rejected = 'rejected'
}

export class CreateInviteDto {
  @IsString() inviteType: INVITE_TYPE;
  sender: mongoose.Schema.Types.ObjectId;
  @IsString() addressee: string;
  @IsOptional() data: any;
}

export class InviteDto {
  @IsString() status: string;
}

@Schema({ collection: 'invite', timestamps: true })
export class Invite extends Document {
  @Prop({ required: true, trim: true }) inviteType: string;
  @Prop({ required: true, default: INVITE_STATUS.pending }) status?: string;
  @Prop({ required: true }) deadline: Date;
  @Prop({ required: true, ref: 'User' }) sender: mongoose.Schema.Types.ObjectId;
  @Prop({ required: true, trim: true, lowercase: true }) addressee: string;
  @Prop({ required: true, default: Date.now }) createdOn?: Date;
  @Prop(mongoose.SchemaTypes.Mixed) data: Record<string, any>;
}

export const InviteSchema = SchemaFactory.createForClass(Invite);
