import { Expose } from 'class-transformer';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';

export enum EVENT_TYPE {
  INVITE = 'InviteUsers',
  CONFIRM_EMAIL = 'ConfirmEmailAddress',
  REVIEW_CREATED = 'ReviewCreated',
  REVIEW_INVITATION = 'ReviewInvitation',
  REVIEW_INVITATION_EMAIL = 'ReviewInvitationEmail',
  REVIEW_INVITATION_ACCEPTED = 'ReviewInvitationAccepted',
  NEW_FILE = 'NewFile',
  USER_CREATED = 'UserCreated',
}

export class EventDto {
  @Expose() eventType: EVENT_TYPE;
  @Expose() data: any;
}

@Schema({ collection: 'events', timestamps: true })
export class Event extends Document {
  @Prop({ required: true, trim: true }) eventType: string;
  @Prop(mongoose.SchemaTypes.Mixed) data: Record<string, any>;
  @Prop() processedOn: number;
  @Prop({ required: true, default: Date.now }) createdOn: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);
