import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
import { UserDocument } from '../users/user.schema';
import { DepositDocument } from '../deposit/deposit.schema';
import { InviteDocument } from '../invite/invite.schema';

export const RETRY_NUMBER = 5;

export enum EVENT_STATUS {
  PENDING = 'pending',
  PROCESSED = 'processed',
  PROCESSING = 'processing',
  FAILED = 'failed',
}

export enum EVENT_TYPE {
  INVITE = 'InviteUsers',
  FEEDBACK = 'Feedback',
  CONFIRM_EMAIL = 'ConfirmEmailAddress',
  REVIEW_CREATED = 'ReviewCreated',
  COMMENT_CREATED = 'CommentCreated',
  REVIEW_INVITATION = 'ReviewInvitation',
  REVIEW_INVITATION_EMAIL = 'ReviewInvitationEmail',
  REVIEW_INVITATION_ACCEPTED = 'ReviewInvitationAccepted',
  NEW_FILE = 'NewFile',
  USER_CREATED = 'UserCreated',
  NEW_INSTITUTION = 'NewInstitution',
  PENDING_APPROVAL = 'PendingApproval',
  DRAFT = 'Draft',
  OPENAIRE_HARVESTER = 'OpenAireHarvester',
  IMPORT_DEPOSIT_VIEWS = 'ImportDepositViews',
  IMPORT_COMMUNITY_VIEWS = 'ImportCommunityViews',
}

export class IEvent {
  eventType!: EVENT_TYPE;
  data: unknown;
  processedOn?: number;
  createdOn!: Date;
  scheduledOn!: Date;
  retryCount = 0;
  status!: EVENT_STATUS;
}

export interface ICommentCreatedData {
  userId: string;
  deposit: {
    title: string;
    _id: string;
    owner: string;
  };
}

export interface IPendingApprovalData {
  depositId: string;
}

export interface INewInstitutionEventData {
  domain: string;

}

export interface IUserCreatedEventData {
  emailConfirmed: boolean;
  email: string;
  userId: string;

}

export interface INewFileEventData {
  depositId: string;
  filename: string;
}

export interface IReviewCreatedEventData {
  deposit: {
    _id: string;
    title: string;
  }
  userId: string;
}

export interface IReviewInvitationEmailData {
  user: UserDocument;
  deposit: DepositDocument;
  email: string;
  invite: InviteDocument;
}

export interface IFeedbackEventData {
  feedbackId: string;
}

export interface IConfirmEmailData {
  email: string;
}

export interface IInviteEventData {
  emails: string[];
  userId: string;
}


export interface IReviewInvitationAcceptedData {
  userId: string;
  deposit: {
    _id: string;
    title: string;
  };
  user: {
    userId: string;

  };
}

export class EventDTO {
  eventType!: EVENT_TYPE;
  scheduledOn?: Date;
  data: ICommentCreatedData | unknown;
}

@Schema({ collection: 'events', timestamps: true })
export class EventDocument extends Document implements IEvent {
  @Prop({ required: true, trim: true }) eventType!: EVENT_TYPE;
  @Prop({ type: mongoose.SchemaTypes.Mixed }) data!: unknown;
  @Prop() processedOn?: number;
  @Prop({ required: true, default: Date.now }) createdOn!: Date;
  @Prop({ required: true, default: Date.now }) scheduledOn!: Date;
  @Prop({ required: true, default: 0 }) retryCount!: number;
  @Prop({ required: true, default: EVENT_STATUS.PENDING }) status!: EVENT_STATUS;
}

export const EventSchema = SchemaFactory.createForClass(EventDocument);
