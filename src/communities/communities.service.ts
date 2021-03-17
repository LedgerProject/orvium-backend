import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Community, COMMUNITY_ROLES, CommunityUser } from './communities.schema';
import { Invite } from '../invite/invite.schema';

@Injectable()
export class CommunitiesService {
  constructor(
    @InjectModel(Community.name) public communityModel: Model<Community>,
  ) {
  }

  async find(filter: FilterQuery<Community>): Promise<Community[]> {
    return this.communityModel.find(filter).exec();
  }

  async findOneByFilter(filter: FilterQuery<Community>): Promise<Community | null> {
    return this.communityModel.findOne(filter).exec();
  }

  async findByFilter(filter: FilterQuery<Community>): Promise<Community[]> {
    return this.communityModel.find(filter).exec();
  }

  async findById(id: string): Promise<Community | null> {
    return this.communityModel.findById(id).exec();
  }

  async addUser(userId: string, communityId: string): Promise<Community> {
    const community = await this.findById(communityId);
    if (!community) {
      throw new NotFoundException('Community not found');
    }

    const user = new CommunityUser();
    user.userId = userId;
    user.role = COMMUNITY_ROLES.contributor;
    community.users.push(user);
    return await community.save();
  }

  async exists(filter: FilterQuery<Invite>): Promise<boolean> {
    return this.communityModel.exists(filter);
  }
}
