import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateQuery, FilterQuery, Model, UpdateQuery } from 'mongoose';
import { bibtexPublicationType, Deposit } from './deposit.schema';
import { Community } from '../communities/communities.schema';
import { readFileSync } from 'fs';
import handlebars from 'handlebars';
import { environment } from '../environments/environment';
import { join } from 'path';

const TEMPLATES_PATH = join(__dirname, '/templates');


@Injectable()
export class DepositService {
  constructor(
    @InjectModel(Deposit.name) public depositModel: Model<Deposit>
  ) {
  }

  async create(filter: CreateQuery<Deposit>): Promise<Deposit> {
    return this.depositModel.create(filter);
  }

  async findOne(filter: FilterQuery<Deposit>): Promise<Deposit | null> {
    return this.depositModel.findOne(filter)
      .populate('community')
      .populate('peerReviews', ['owner', 'status', 'gravatar', 'deposit', 'wasInvited'])
      .exec();
  }

  async find(filter: FilterQuery<Community>): Promise<Deposit[]> {
    return this.depositModel.find(filter)
      .populate('community')
      .populate('peerReviews', ['owner', 'status', 'gravatar', 'deposit', 'wasInvited'])
      .exec();
  }

  async findById(id: string): Promise<Deposit | null> {
    return this.depositModel.findById(id)
      .populate('community')
      .populate('peerReviews', ['owner', 'status', 'gravatar', 'deposit', 'wasInvited'])
      .exec();
  }

  async exists(filter: FilterQuery<Deposit>): Promise<boolean> {
    return this.depositModel.exists(filter);
  }

  async findWithLimit(filter: FilterQuery<Deposit>, skip: number, limit = 10): Promise<Deposit[]> {
    return this.depositModel.find(filter)
      .sort({ createdOn: -1 })
      .skip(skip)
      .limit(limit)
      .populate('community')
      .lean();
  }

  async findOneAndUpdate(filter: FilterQuery<Deposit>, update: UpdateQuery<Deposit>): Promise<Deposit | null> {
    return this.depositModel.findOneAndUpdate(filter, update, { useFindAndModify: false })
      .populate('community')
      .lean();
  }

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
    const template = await handlebars.compile(source);
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

  // https://apastyle.apa.org/style-grammar-guidelines/references/basic-principles
  async getAPACitation(deposit: Deposit): Promise<string> {
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
      const community = deposit.community as unknown as Community;
      citationAPA = citationAPA + ' ' + community.name + '.';
    }
    if (deposit.doi) {
      citationAPA = citationAPA + ' https://doi.org/' + deposit.doi;
    }
    return citationAPA;
  }

  async checkIsLastVersion(deposit: Deposit): Promise<void> {
    const previousDeposit = await this.findOne({parent: deposit.parent , version: deposit.version - 1, isLatestVersion: true});
    if(previousDeposit){
      deposit.isLatestVersion = true;
      previousDeposit.isLatestVersion = false;
      await deposit.save();
      await previousDeposit.save();
    }
  }
}
