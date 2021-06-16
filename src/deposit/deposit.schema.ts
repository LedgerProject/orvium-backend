import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
import { CommunityDocument } from '../communities/communities.schema';
import { v4 as uuidv4 } from 'uuid';
import { FileMetadata } from '../dtos/filemetadata.dto';
import { Reference } from '../dtos/reference.dto';
import { AuthorDTO } from '../dtos/author.dto';

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

export enum CREDIT_TYPE {
  methodology = 'methodology',
  conceptualization = 'conceptualization',
  software = 'software',
  validation = 'validation',
  formalAnalysis = 'formal analysis',
  investigation = 'investigation',
  resources = 'resources',
  dataCuration = 'data curation',
  writingOriginalDraft = 'writing original draft',
  writingReviewEditing = 'writing review and editing',
  visualization = 'visualization',
  supervision = 'supervision',
  projectAdministration = 'project administration',
  fundingAcquisition = 'funding acquisition',
}

export class Author {
  userId?: string;
  name!: string;
  surname!: string;
  nickname?: string;
  email?: string;
  orcid?: string;
  credit: CREDIT_TYPE[] = [];
  gravatar?: string;
}

export class CommentDTO {
  id!: string;
  author!: AuthorDTO;
  createdOn!: Date;
  content!: string;
  gravatar?: string;
  tags!: string[];
}

export class CommentDocument {
  id: mongoose.Types.ObjectId;
  author!: Author;
  createdOn: Date;
  content!: string;
  gravatar?: string;
  tags: string[] = [];

  constructor() {
    this.createdOn = new Date();
    this.id = new mongoose.Types.ObjectId();
  }
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

export enum COMMENT_TAGS {
  author = 'author',
  reviewer = 'reviewer',
  admin = 'admin',
  moderator = 'moderator'
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

@Schema({ collection: 'deposit', timestamps: true, toJSON: { virtuals: true } })
export class DepositDocument extends Document {
  @Prop({ required: true })
  owner!: string;
  @Prop({ required: true })
  nickname!: string;
  @Prop({ required: true, trim: true })
  title!: string;
  @Prop({ trim: true }) abstract?: string;
  @Prop({
    required: true,
    enum: Object.values(PUBLICATION_TYPE),
    default: PUBLICATION_TYPE.article
  })
  publicationType!: PUBLICATION_TYPE;
  @Prop({
    required: true,
    enum: Object.values(ACCESS_RIGHT),
    default: ACCESS_RIGHT.CC0
  })
  accessRight!: ACCESS_RIGHT;
  @Prop() submissionDate?: Date;
  @Prop() publicationDate?: Date;
  @Prop({
    required: true,
    enum: Object.values(DEPOSIT_STATUS),
    default: DEPOSIT_STATUS.draft
  })
  status!: DEPOSIT_STATUS;
  @Prop([{
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReviewDocument',
    default: []
  }])
  peerReviews!: mongoose.Schema.Types.ObjectId[];
  @Prop({
    required: true,
    enum: Object.values(REVIEW_TYPE),
    default: REVIEW_TYPE.openReview
  })
  reviewType!: REVIEW_TYPE;
  @Prop([{ required: true, type: mongoose.Schema.Types.Mixed, default: [] }])
  authors!: Author[];
  @Prop([{ type: mongoose.Schema.Types.Mixed, default: [] }])
  comments!: CommentDocument[];
  @Prop({ type: mongoose.SchemaTypes.Mixed })
  transactions?: unknown;
  @Prop({ required: true, type: Array, default: [] })
  files!: FileMetadata[];
  @Prop() gravatar?: string;
  @Prop({ required: true, default: [], trim: true })
  keywords!: string[];
  @Prop() keccak256?: string;
  @Prop({ trim: true }) doi?: string;
  @Prop({ trim: true }) url?: string;
  @Prop() pdfUrl?: string;
  @Prop() presignedPDFURL?: string;
  @Prop({ required: true, default: [] })
  disciplines!: string[];
  @Prop({ required: true, type: [mongoose.Schema.Types.Mixed], default: [], trim: true })
  references!: Reference[];
  @Prop({ required: true, default: Date.now })
  createdOn!: Date;
  @Prop() html?: string;
  @Prop() images?: string[];
  @Prop({ type: mongoose.SchemaTypes.Mixed })
  publicationFile?: FileMetadata;
  @Prop({ ref: CommunityDocument.name })
  community?: mongoose.Schema.Types.ObjectId;
  @Prop({ required: true, default: true })
  isLatestVersion!: boolean;
  @Prop({ required: true, default: 1 })
  version!: number;
  @Prop({
    required: true,
    default: uuidv4(),
  })
  parent!: string;
  @Prop({ required: true, default: true }) canBeReviewed!: boolean;
  @Prop() gitRepository?: string;
  @Prop() openAireIdentifier?: string;

  @Prop({ required:true, default: 0 })
  views?: number;
}

export const DepositSchema = SchemaFactory.createForClass(DepositDocument);


DepositSchema.virtual('ownerProfile', {
  ref: 'UserDocument',
  localField: 'owner',
  foreignField: 'userId',
  justOne: true
});

DepositSchema.index({
  title: 'text',
  abstract: 'text',
  'authors.name': 'text',
  'authors.surname': 'text',
});
