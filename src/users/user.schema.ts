import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Exclude, Expose } from 'class-transformer';
import { createHash } from 'crypto';
import { Community } from '../communities/communities.schema';
import { Logger } from '@nestjs/common';
import { IsBoolean, IsEmail, IsNumber, IsOptional, IsString, IsUrl, ValidateIf, } from 'class-validator';
import { IsNotBlankValidator } from '../isNotBlankValidator';
import * as mongoose from 'mongoose';

export enum USER_TYPE {
  student = 'student',
  medical = 'medical',
  business = 'business',
  researcher = 'researcher',
  citizen = 'citizen'
}


@Exclude()
export class UserDto {
  @Expose() email: string;
  @Expose() firstName: string;
  @Expose() lastName: string;
  @Expose() communities: mongoose.Schema.Types.ObjectId[];

  constructor(partial: Partial<any>) {
    Object.assign(this, partial);
  }
}

@Schema({ collection: 'profile', timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  userId: string;

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
    ref: 'Community',
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    default: []
  }])
  communities: mongoose.Schema.Types.ObjectId[];

  // Internal fields
  @Prop({ required: true, default: false }) emailConfirmed: boolean;
  @Prop() emailConfirmedOn?: Date;
  @Prop() emailChangedOn?: Date;
  @Prop({ required: true, default: 20 }) invitationsAvailable: number;
  @Prop({ required: true }) inviteToken: string;
  @Prop() invitedBy?: string;
  @Prop() gravatar?: string;
  @Prop({ required: true, default: 0 }) percentageComplete: number;

  @Prop({ required: true, default: [] })
  disciplines: string[];

  @Prop() simultaneousReviews?: number;
  @Prop({ required: true, default: false })
  isReviewer: boolean;

  @Prop({ required: true, default: false })
  isOnboarded: boolean;

  @Prop({
    required: true,
    enum: Object.values(USER_TYPE),
    default: USER_TYPE.citizen
  })
  userType: USER_TYPE;

  @Prop() institution?: string;
  @Prop({ required: true, default: [] })
  roles: string[];

  @Prop({ required: true, default: [] })
  starredDeposits: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre<User>('save', function (next) {
  Logger.debug('User document pre save hook');
  if (this.email) {
    this.gravatar = createHash('md5').update(this.email).digest('hex');
  } else {
    // Without email the user is not onBoarded
    this.isOnboarded = false;
  }

  this.isReviewer = false;
  if (this.disciplines && this.simultaneousReviews && this.isOnboarded) {
    this.isReviewer = true;
  }

  // Percentage of profile complete
  this.percentageComplete = calculateProfileCompletion(this);

  next();
});


export class UpdateUserDTO {
  @IsOptional() @IsEmail() email: string;
  @IsOptional() @IsString() @IsNotBlankValidator() firstName: string;
  @IsOptional() @IsString() @IsNotBlankValidator() lastName: string;
  @IsOptional() @IsString() aboutMe: string;
  @IsOptional() @ValidateIf(o => o.orcid !== '') @IsUrl() orcid: string;
  @IsOptional() @ValidateIf(o => o.linkedin !== '') @IsUrl() linkedin: string;
  @IsOptional() @ValidateIf(o => o.blog !== '') @IsUrl() blog: string;
  @IsOptional() @IsString() role: string;
  @IsOptional() @IsString({ each: true }) starredDeposits: string[];
  @IsOptional() @IsBoolean() isOnboarded: boolean;
  @IsOptional() @IsNumber() simultaneousReviews: number;
  @IsOptional() @IsString() userType: USER_TYPE;
  @IsOptional() communities: mongoose.Schema.Types.ObjectId[];
  @IsOptional() @IsString({ each: true }) disciplines: string[];
}

function calculateProfileCompletion(user: User): number {
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
