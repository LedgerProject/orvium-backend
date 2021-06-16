import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DocumentDefinition, FilterQuery, Model } from 'mongoose';
import { InviteDocument } from './invite.schema';

@Injectable()
export class InviteService {
  constructor(
    @InjectModel(InviteDocument.name) public inviteModel: Model<InviteDocument>,
  ) {
  }

  async create(filter: DocumentDefinition<InviteDocument>): Promise<InviteDocument> {
    return this.inviteModel.create(filter);
  }

  async findById(id: string): Promise<InviteDocument | null> {
    return this.inviteModel.findById(id).populate('sender', ['firstName', 'lastName', 'gravatar', 'email']).exec();
  }

  async findOne(filter: FilterQuery<InviteDocument>): Promise<InviteDocument | null> {
    return this.inviteModel.findOne(filter).populate('sender', ['firstName', 'lastName', 'gravatar', 'email']).exec();
  }

  async find(filter: FilterQuery<InviteDocument>): Promise<InviteDocument[]> {
    return this.inviteModel.find(filter)
      .populate('sender', ['firstName', 'lastName', 'gravatar', 'email'])
      .sort({ createdOn: -1 })
      .exec();
  }

  async exists(filter: FilterQuery<InviteDocument>): Promise<boolean> {
    return this.inviteModel.exists(filter);
  }
}
