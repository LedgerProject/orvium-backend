import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DocumentDefinition, FilterQuery, Model, UpdateQuery } from 'mongoose';
import { Author, bibtexPublicationType, COMMENT_TAGS, CommentDocument, DepositDocument } from './deposit.schema';
import { CommunityDocument } from '../communities/communities.schema';
import { readFileSync } from 'fs';
import handlebars from 'handlebars';
import { environment } from '../environments/environment';
import { join } from 'path';
import { UserDocument } from '../users/user.schema';
import { ReviewDocument } from '../review/review.schema';

const TEMPLATES_PATH = join(__dirname, '/templates');


@Injectable()
export class DepositService {
  constructor(
    @InjectModel(DepositDocument.name) public depositModel: Model<DepositDocument>
  ) {
  }

  async create(filter: DocumentDefinition<DepositDocument>): Promise<DepositDocument> {
    return this.depositModel.create(filter);
  }

  async findOne(filter: FilterQuery<DepositDocument>): Promise<DepositDocument | null> {
    return this.depositModel.findOne(filter)
      .populate('community')
      .populate('ownerProfile', ['userId', 'firstName', 'lastName', 'nickname'])
      .populate('peerReviews', ['owner', 'status', 'gravatar', 'deposit', 'wasInvited'])
      .exec();
  }

  async find(filter: FilterQuery<CommunityDocument>): Promise<DepositDocument[]> {
    return this.depositModel.find(filter)
      .populate('community')
      .populate('ownerProfile', ['userId', 'firstName', 'lastName', 'nickname'])
      .populate('peerReviews', ['owner', 'status', 'gravatar', 'deposit', 'wasInvited'])
      .exec();
  }

  async findById(id: string): Promise<DepositDocument | null> {
    return this.depositModel.findById(id)
      .populate('community')
      .populate('ownerProfile', ['userId', 'firstName', 'lastName', 'nickname'])
      .populate({
        path: 'peerReviews',
        select: ['owner', 'status', 'gravatar', 'deposit', 'wasInvited', 'ownerProfile'],
        populate: {
          path: 'ownerProfile',
          select: ['userId', 'firstName', 'lastName', 'nickname']
        }
      })
      .exec();
  }

  async exists(filter: FilterQuery<DepositDocument>): Promise<boolean> {
    return this.depositModel.exists(filter);
  }

  async findWithLimit(filter: FilterQuery<DepositDocument>, skip: number, limit = 10): Promise<DepositDocument[]> {
    return this.depositModel.find(filter)
      .sort({ createdOn: -1 })
      .skip(skip)
      .limit(limit)
      .populate('community')
      .populate('ownerProfile', ['userId', 'firstName', 'lastName', 'nickname'])
      .lean();
  }

  async findOneAndUpdate(filter: FilterQuery<DepositDocument>, update: UpdateQuery<DepositDocument>): Promise<DepositDocument | null> {
    return this.depositModel.findOneAndUpdate(filter, update, { useFindAndModify: false })
      .populate('community')
      .lean();
  }

  async aggregate(pipeline: unknown[]): Promise<unknown[]> {
    return this.depositModel.aggregate(pipeline).exec();
  }

  /**
   * Update the deposit to become the last version
   *
   * @param {DepositDocument} the deposit to update as the las version
   */
  async updateToLastVersion(deposit: DepositDocument): Promise<void> {
    const previousDeposit = await this.findOne({ parent: deposit.parent, version: deposit.version - 1, isLatestVersion: true });
    if (previousDeposit) {
      deposit.isLatestVersion = true;
      previousDeposit.isLatestVersion = false;
      await deposit.save();
      await previousDeposit.save();
    }
  }

  /**
   * Generate BIBTEXT citation
   *
   * @param {string} the deposit ID to generate the BIBTEXT citation
   * @returns {string} BIBTEXT citation
   */
  async getBibtexCitation(identifier: string): Promise<string> {
    const deposit = await this.findById(identifier);
    if (!deposit) {
      throw new NotFoundException('User not found');
    }

    const hasDoi = !!(deposit.doi);
    const authorsList: string[] = [];
    for (const author of deposit.authors) {
      authorsList.push(author.name + ' ' + author.surname);
    }

    const source = readFileSync(`${TEMPLATES_PATH}/citation/bibtex.hbs`, 'utf-8');
    const template = handlebars.compile(source);
    return template({
      publicationType: bibtexPublicationType.get(deposit.publicationType),
      citationKey: 'orvium-' + deposit.id,
      title: deposit.title,
      abstract: deposit.abstract,
      keywords: deposit.keywords.join(', '),
      authors: authorsList.join(' and '),
      hasDoi: hasDoi,
      doi: deposit.doi,
      year: (deposit.publicationDate ? new Date(deposit.publicationDate).getFullYear() : undefined),
      url: environment.publicUrl + '/deposits/' + deposit.id + '/view',
    });
  }

  /**
   * Generate APA citation
   * https://apastyle.apa.org/style-grammar-guidelines/references/basic-principles
   * @param {DepositDocument} the deposit with the data to generate the APA citation
   * @returns {string} APA citation
   */
  async getAPACitation(deposit: DepositDocument): Promise<string> {
    const authors = [];
    for (const author of deposit.authors) {
      authors.push((author.surname) + ', ' + author.name.charAt(0).toUpperCase() + '.');
    }

    let authorSection = '';

    if (authors.length > 1) {
      authorSection = authors.slice(0, -1).join(', ') + ' & ' + authors.slice(-1);
    } else {
      authorSection = authors[0];
    }

    let date = 'n.d.';
    if (deposit.publicationDate) {
      date = deposit.publicationDate.getFullYear().toString();
    }

    let citationAPA = authorSection + ' (' + date + '). ' + deposit.title + '.';
    if (deposit.community) {
      const community = deposit.community as unknown as CommunityDocument;
      citationAPA = citationAPA + ' ' + community.name + '.';
    }
    if (deposit.doi) {
      citationAPA = citationAPA + ' https://doi.org/' + deposit.doi;
    }
    return citationAPA;
  }

  async addComment(content: string, deposit: DepositDocument, user: UserDocument): Promise<DepositDocument> {
    const author: Partial<Author> = {
      userId: user.userId,
      name: user.firstName,
      surname: user.lastName,
      gravatar: user.gravatar,
      nickname: user.nickname
    };
    const comment = new CommentDocument();
    comment.content = content;
    comment.author = author as Author;
    comment.tags = [];

    if (deposit.owner === comment.author.userId) {
      comment.tags.push(COMMENT_TAGS.author);
    }

    if ((deposit.peerReviews as unknown as ReviewDocument[]).find(review => review.owner === comment.author.userId)) {
      comment.tags.push(COMMENT_TAGS.reviewer);
    }

    if (user.roles.includes('admin')) {
      comment.tags.push(COMMENT_TAGS.admin);
    }

    deposit.comments.push(comment);
    return await deposit.save();
  }

  async deleteComment(deposit: DepositDocument, commentId: string): Promise<DepositDocument> {
    console.log(deposit.comments);
    const index = deposit.comments.findIndex(comment => comment.id.toString() === commentId);
    if (index === -1) {
      throw new NotFoundException('Comment not found');
    }

    deposit.comments.splice(index, 1);

    return await deposit.save();
  }

  deleteAuthorsEmail(deposit: DepositDocument): void {
    for (const author of deposit.authors) {
      author.email = '';
    }
  }

  /**
   * Generate Binder environment URL
   * https://mybinder.org/
   * @param {string} GitHub/GitLab repository URL
   * @returns {string} Binder URL
   */
  getBinderURL(gitRepositoryURL: string): string {
    const regexGitHub = /https:\/\/github\.com\/(.+)/;
    let binderURL = 'https://mybinder.org/error';
    const repository = gitRepositoryURL.match(regexGitHub);
    if (repository) {
      binderURL = `https://mybinder.org/v2/gh/${repository?.[1]}/HEAD?urlpath=lab`;
    }
    return binderURL;
  }
}
