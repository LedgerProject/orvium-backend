import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
import { Logger } from '@nestjs/common';
import { CommunityUser } from '../dtos/community-user.dto';
import { CallForPapers } from '../dtos/community-callforpapers.dto';

export enum COMMUNITY_TYPE {
  university = 'university',
  business = 'business'
}

export enum COMMUNITY_ROLES {
  contributor = 'contributor',
}

@Schema({ collection: 'community', timestamps: true })
export class CommunityDocument extends Document {
  @Prop({ trim: true })
  name!: string;

  @Prop({ trim: true })
  description!: string;

  @Prop({ trim: true })
  country!: string;

  @Prop({ trim: true })
  twitterURL?: string;

  @Prop({ trim: true })
  facebookURL?: string;

  @Prop({ trim: true })
  websiteURL?: string;

  @Prop([mongoose.Schema.Types.Mixed])
  users!: CommunityUser[];

  @Prop({ trim: true })
  logoURL!: string;

  @Prop({ trim: true })
  acknowledgement!: string;

  @Prop({
    required: true,
    enum: Object.values(COMMUNITY_TYPE),
    default: COMMUNITY_TYPE.university
  })
  type!: COMMUNITY_TYPE;

  @Prop({ trim: true })
  guidelinesURL!: string;

  @Prop({ trim: true, maxlength: 23 })
  codename!: string;

  @Prop()
  callForPapers!: CallForPapers;

  @Prop({ required: true, default: false })
  dataciteEnabled!: boolean;

  @Prop({ trim: true })
  dataciteAccountID?: string;

  @Prop({ trim: true })
  datacitePassword?: string;

  @Prop({ trim: true })
  datacitePrefix?: string;

  @Prop({ required:true, default: 0 })
  views?: number;
}

export const CommunitySchema = SchemaFactory.createForClass(CommunityDocument);

CommunitySchema.pre<CommunityDocument>('save', function (next) {
  Logger.debug('Community document pre save hook');
  this.dataciteEnabled = (this.dataciteAccountID && this.datacitePassword && this.datacitePrefix) ? true : false;
  next();
});
