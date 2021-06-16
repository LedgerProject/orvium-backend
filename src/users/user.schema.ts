import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
import { createHash } from 'crypto';
import { CommunityDocument } from '../communities/communities.schema';
import { Logger } from '@nestjs/common';

export enum USER_TYPE {
  student = 'student',
  medical = 'medical',
  business = 'business',
  researcher = 'researcher',
  citizen = 'citizen'
}


@Schema({ collection: 'profile', timestamps: true })
export class UserDocument extends Document {
  @Prop({ required: true })
  userId!: string;
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  nickname!: string;

  // Personal Details
  @Prop({ unique: true, sparse: true, trim: true, lowercase: true })
  email?: string;

  @Prop({ trim: true }) firstName?: string;
  @Prop({ trim: true }) lastName?: string;
  @Prop({ trim: true }) aboutMe?: string;
  @Prop({ trim: true }) orcid?: string;
  @Prop({ trim: true }) linkedin?: string;
  @Prop({ trim: true }) blog?: string;
  @Prop({ trim: true }) role?: string;
  @Prop([{
    ref: CommunityDocument.name,
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    default: []
  }])
  communities!: mongoose.Schema.Types.ObjectId[];

  // Internal fields
  @Prop({ required: true, default: false }) emailConfirmed!: boolean;
  @Prop() emailConfirmedOn?: Date;
  @Prop() emailChangedOn?: Date;
  @Prop({ required: true, default: 20 }) invitationsAvailable!: number;
  @Prop({ required: true }) inviteToken!: string;
  @Prop() invitedBy?: string;
  @Prop() gravatar?: string;
  @Prop({ required: true, default: 0 }) percentageComplete!: number;

  @Prop({ required: true, default: [] })
  disciplines!: string[];

  @Prop() simultaneousReviews?: number;
  @Prop({ required: true, default: false })
  isReviewer!: boolean;

  @Prop({ required: true, default: false })
  isOnboarded!: boolean;

  @Prop({
    required: true,
    enum: Object.values(USER_TYPE),
    default: USER_TYPE.citizen
  })
  userType!: USER_TYPE;

  @Prop() institution?: string;
  @Prop({ required: true, default: [] })
  roles!: string[];

  @Prop({ required: true, default: [] })
  starredDeposits!: string[];

  @Prop({ required: true, default: false })
  acceptedTC!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(UserDocument);

UserSchema.pre<UserDocument>('save', function (next) {
  Logger.debug('User document pre save hook');
  if (this.email) {
    this.gravatar = createHash('md5').update(this.email).digest('hex');
  } else {
    // Without email the user is not onBoarded
    this.isOnboarded = false;
  }

  this.isReviewer = false;
  if (this.disciplines && this.simultaneousReviews && this.isOnboarded && this.emailConfirmed) {
    this.isReviewer = true;
  }

  // Percentage of profile complete
  this.percentageComplete = calculateProfileCompletion(this);

  next();
});

function calculateProfileCompletion(user: UserDocument): number {
  let fields = ['firstName', 'lastName', 'email', 'blog', 'aboutMe'];
  if (user.userType != USER_TYPE.citizen) {
    fields = fields.concat(['role', 'orcid', 'linkedin', 'disciplines']);
  }
  let counter = 0;
  for (const field of fields) {
    if (user.get(field)) {
      counter++;
    }
  }

  return 100 * counter / fields.length;
}
