import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { COMMUNITY_ROLES, CommunityDocument } from './communities.schema';
import { InviteDocument } from '../invite/invite.schema';
import { CommunityUser } from '../dtos/community-user.dto';

@Injectable()
export class CommunitiesService {
  constructor(
    @InjectModel(CommunityDocument.name) public communityModel: Model<CommunityDocument>,
  ) {
  }

  async find(filter: FilterQuery<CommunityDocument>): Promise<CommunityDocument[]> {
    return this.communityModel.find(filter).exec();
  }

  async findOneByFilter(filter: FilterQuery<CommunityDocument>): Promise<CommunityDocument | null> {
    return this.communityModel.findOne(filter).exec();
  }

  async findByFilter(filter: FilterQuery<CommunityDocument>): Promise<CommunityDocument[]> {
    return this.communityModel.find(filter).exec();
  }

  async findById(id: string): Promise<CommunityDocument | null> {
    return this.communityModel.findById(id).exec();
  }

  async addUser(userId: string, communityId: string): Promise<CommunityDocument> {
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

  async exists(filter: FilterQuery<InviteDocument>): Promise<boolean> {
    return this.communityModel.exists(filter);
  }
}
