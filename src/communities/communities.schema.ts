import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'community', timestamps: true })
export class Community extends Document {
  @Prop({ trim: true })
  name: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ trim: true })
  country: string;

  @Prop({ trim: true })
  twitterURL: string;

  @Prop({ trim: true })
  facebookURL: string;

  @Prop({ trim: true })
  websiteURL: string;

  @Prop([mongoose.Schema.Types.Mixed])
  users: CommunityUser[];

  @Prop({ trim: true })
  logoURL: string;

  @Prop({ trim: true })
  acknowledgement: string;

  @Prop({ trim: true })
  guidelinesURL: string;

  @Prop({ trim: true, maxlength: 23 })
  codename: string;
}

export class CommunityUser {
  userId: string;
  role: string;
}

export enum COMMUNITY_ROLES {
  contributor = 'contributor',
}

export const CommunitySchema = SchemaFactory.createForClass(Community);
