import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateQuery, FilterQuery, Model } from 'mongoose';
import { Invite } from './invite.schema';

@Injectable()
export class InviteService {
  constructor(
    @InjectModel(Invite.name) private inviteModel: Model<Invite>,
  ) {
  }

  async create(filter: CreateQuery<Invite>): Promise<Invite> {
    return this.inviteModel.create(filter);
  }

  async findById(id: string): Promise<Invite | null> {
    return this.inviteModel.findById(id).populate('sender', ['firstName', 'lastName', 'gravatar', 'email']).exec();
  }

  async findOne(filter: FilterQuery<Invite>): Promise<Invite | null> {
    return this.inviteModel.findOne(filter).populate('sender', ['firstName', 'lastName', 'gravatar', 'email']).exec();
  }

  async find(filter: FilterQuery<Invite>): Promise<Invite[]> {
    return this.inviteModel.find(filter).populate('sender', ['firstName', 'lastName', 'gravatar', 'email']).sort({ createdOn: -1 }).exec();
  }

  async exists(filter: FilterQuery<Invite>): Promise<boolean> {
    return this.inviteModel.exists(filter);
  }
}
