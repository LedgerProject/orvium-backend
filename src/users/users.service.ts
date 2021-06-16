import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { FilterQuery, Model } from 'mongoose';
import { UserDocument } from './user.schema';
import { InviteDocument } from '../invite/invite.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(UserDocument.name) public userModel: Model<UserDocument>,
  ) {
  }

  async find(filter: FilterQuery<UserDocument>): Promise<UserDocument[]> {
    return this.userModel.find(filter).exec();
  }

  async findOne(filter: FilterQuery<UserDocument>): Promise<UserDocument | null> {
    return this.userModel.findOne(filter).populate('communities').exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async addCommunity(userId: string, communityId: mongoose.Schema.Types.ObjectId): Promise<UserDocument> {
    const user = await this.findOne({ userId: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.communities.indexOf(communityId) == -1) {
      user.communities.push(communityId);
    }
    return await user.save();
  }

  async exists(filter: FilterQuery<InviteDocument>): Promise<boolean> {
    return this.userModel.exists(filter);
  }

  async userCommunities(filter: FilterQuery<UserDocument>): Promise<UserDocument | null> {
    return this.userModel.findOne(filter).populate('communities').exec();
  }
}
