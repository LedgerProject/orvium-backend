import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
import { Review } from '../review/review.schema';
import { IsDate, IsJSON, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Community } from '../communities/communities.schema';
import { IsNotBlankValidator } from '../isNotBlankValidator';
import { v4 as uuidv4 } from 'uuid';

export enum PUBLICATION_TYPE {
  book = 'book',
  bookSection = 'book section',
  conferencePaper = 'conference paper',
  article = 'article',
  patent = 'patent',
  preprint = 'preprint',
  report = 'report',
  softwareDocumentation = 'software documentation',
  thesis = 'thesis',
  technicalNote = 'technical note',
  workingPaper = 'working paper',
  policyReport = 'policy report',
  registeredReport = 'registered report',
  proposal = 'proposal',
  reviewArticle = 'review article',
  video = 'video',
  other = 'other'
}

export enum ACCESS_RIGHT {
  CCBY = 'cc by',
  CCBYND = 'cc by-nd',
  CC0 = 'cc0'
}

export enum REVIEW_TYPE {
  openReview = 'open review',
  // singleBlind = 'single blind',
  // doubleBlind = 'double blind'
}

export enum DEPOSIT_STATUS {
  draft = 'draft',
  pendingApproval = 'pending approval',
  inReview = 'in review',
  published = 'published',
  preprint = 'preprint'
}

export class Citation {
  apa: string;
}

export class Author {
  name: string;
  surname: string;
  email?: string;
  orcid?: string;
  credit?: string[];
}

export class Reference {
  reference: string;
  url: string;
}

export enum BIBTEX_PUBLICATION_TYPES {
  article = 'article',
  book = 'book',
  booklet = 'booklet',
  conference = 'conference',
  inbook = 'inbook',
  incollection = 'incollection',
  inproccedings = 'inproccedings',
  manual = 'manual',
  masterthesis = 'masterthesis',
  misc = 'misc',
  patent = 'patent',
  phdthesis = 'phdthesis',
  proceedings = 'proceedings',
  techreport = 'techreport',
  unpublished = 'unpublished',
}

export const bibtexPublicationType = new Map<PUBLICATION_TYPE, BIBTEX_PUBLICATION_TYPES>(
  [
    [PUBLICATION_TYPE.book, BIBTEX_PUBLICATION_TYPES.book],
    [PUBLICATION_TYPE.bookSection, BIBTEX_PUBLICATION_TYPES.inbook],
    [PUBLICATION_TYPE.conferencePaper, BIBTEX_PUBLICATION_TYPES.conference],
    [PUBLICATION_TYPE.article, BIBTEX_PUBLICATION_TYPES.article],
    [PUBLICATION_TYPE.patent, BIBTEX_PUBLICATION_TYPES.patent],
    [PUBLICATION_TYPE.preprint, BIBTEX_PUBLICATION_TYPES.unpublished],
    [PUBLICATION_TYPE.report, BIBTEX_PUBLICATION_TYPES.techreport],
    [PUBLICATION_TYPE.thesis, BIBTEX_PUBLICATION_TYPES.phdthesis],
    [PUBLICATION_TYPE.technicalNote, BIBTEX_PUBLICATION_TYPES.techreport],
    [PUBLICATION_TYPE.workingPaper, BIBTEX_PUBLICATION_TYPES.techreport],
    [PUBLICATION_TYPE.policyReport, BIBTEX_PUBLICATION_TYPES.misc],
    [PUBLICATION_TYPE.registeredReport, BIBTEX_PUBLICATION_TYPES.misc],
    [PUBLICATION_TYPE.proposal, BIBTEX_PUBLICATION_TYPES.misc],
    [PUBLICATION_TYPE.reviewArticle, BIBTEX_PUBLICATION_TYPES.misc],
    [PUBLICATION_TYPE.video, BIBTEX_PUBLICATION_TYPES.misc],
    [PUBLICATION_TYPE.softwareDocumentation, BIBTEX_PUBLICATION_TYPES.misc],
    [PUBLICATION_TYPE.other, BIBTEX_PUBLICATION_TYPES.misc],
  ]);

@Schema({ collection: 'deposit', timestamps: true })
export class Deposit extends Document {
  @Prop({ required: true })
  owner: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true }) abstract?: string;
  @Prop({
    required: true,
    enum: Object.values(PUBLICATION_TYPE),
    default: PUBLICATION_TYPE.article })
  publicationType: PUBLICATION_TYPE;

  @Prop({
    required: true,
    enum: Object.values(ACCESS_RIGHT),
    default: ACCESS_RIGHT.CC0 })
  accessRight: ACCESS_RIGHT;

  @Prop() submissionDate?: Date;
  @Prop() publicationDate?: Date;

  @Prop({
    required: true,
    enum: Object.values(DEPOSIT_STATUS),
    default: DEPOSIT_STATUS.draft })
  status: DEPOSIT_STATUS;

  @Prop([{
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review', default: [] }])
  peerReviews: mongoose.Schema.Types.ObjectId[];

  @Prop({
    required: true,
    enum: Object.values(REVIEW_TYPE),
    default: REVIEW_TYPE.openReview })
  reviewType: REVIEW_TYPE;

  @Prop([{ required: true, type: mongoose.Schema.Types.Mixed, default: [] }])
  authors: Author[];

  @Prop(mongoose.SchemaTypes.Mixed) transactions?: any;

  @Prop({ required: true, type: Array, default: [] })
  files: any;

  @Prop() gravatar?: string;

  @Prop({ required: true, default: [], trim: true })
  keywords: string[];

  @Prop() keccak256?: string;
  @Prop({ trim: true }) doi?: string;
  @Prop({ trim: true }) url?: string;
  @Prop() pdfUrl?: string;

  @Prop({ required: true, default: [] })
  disciplines: string[];

  @Prop({ required: true, type: [mongoose.Schema.Types.Mixed], default: [], trim: true })
  references: Reference[];

  @Prop({ required: true, default: Date.now })
  createdOn: Date;

  @Prop() html?: string;
  @Prop(mongoose.SchemaTypes.Mixed)
  publicationFile?: Record<string, any>;

  @Prop({ ref: 'Community' })
  community?: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true, default: true })
  isLatestVersion: boolean;

  @Prop({ required: true, default: 1 })
  version: number;

  @Prop({
    required: true,
    default: uuidv4(),
  })
  parent: string;
}

export class CreateDepositDTO {
  @IsString() @IsNotBlankValidator({ message: 'Title should not be empty' }) title: string;
  @IsOptional() @IsNotEmpty() community: mongoose.Schema.Types.ObjectId;
}

export class UpdateDepositDTO {
  @IsOptional() @IsString() @IsNotBlankValidator({ message: 'Title should not be empty' }) title: string;
  @IsOptional() @IsString() abstract: string;
  @IsOptional() @IsString() publicationType: PUBLICATION_TYPE;
  @IsOptional() @IsString() accessRight: ACCESS_RIGHT;
  @IsOptional() @IsDate() publicationDate: Date;
  @IsOptional() @IsDate() submissionDate: Date;
  @IsOptional() @IsString() status: DEPOSIT_STATUS;
  @IsOptional() @IsString() reviewType: REVIEW_TYPE;
  @IsOptional() authors: any;
  @IsOptional() @IsJSON() transactions: unknown;
  @IsOptional() @IsString({ each: true }) keywords: string[];
  @IsOptional() @IsString() doi: string;
  @IsOptional() @IsString({ each: true }) disciplines: string[];
  @IsOptional() references: any;
  @IsOptional() community: mongoose.Schema.Types.ObjectId;
}

export const DepositSchema = SchemaFactory.createForClass(Deposit);

DepositSchema.index({
  title: 'text',
  abstract: 'text',
  'authors.name': 'text',
  'authors.surname': 'text',
})
