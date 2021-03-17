import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { User } from './user.schema';
import { Invite } from '../invite/invite.schema';
import mongoose from "mongoose";

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) public userModel: Model<User>,
  ) {
  }

  async findOne(filter: FilterQuery<User>): Promise<User | null> {
    return this.userModel.findOne(filter).exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async addCommunity(userId: string, communityId: mongoose.Schema.Types.ObjectId): Promise<User> {
    const user = await this.findOne({ userId: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.communities.indexOf(communityId) == -1) {
      user.communities.push(communityId);
    }
    return await user.save();
  }

  async exists(filter: FilterQuery<Invite>): Promise<boolean> {
    return this.userModel.exists(filter);
  }

  async userCommunities(filter: FilterQuery<User>): Promise<User | null> {
    return this.userModel.findOne(filter).populate('communities').exec();
  }
}
