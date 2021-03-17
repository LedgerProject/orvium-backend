import { Controller, Get, NotFoundException, Param, Post, Req, UnauthorizedException } from '@nestjs/common';
import { Community } from './communities.schema';
import { Deposit, DEPOSIT_STATUS } from '../deposit/deposit.schema';
import { CommunitiesService } from './communities.service';
import { UsersService } from '../users/users.service';
import { DepositService } from '../deposit/deposit.service';
import { Request } from 'express';

@Controller('communities')
export class CommunitiesController {
  constructor(
    private readonly communitiesService: CommunitiesService,
    private readonly userService: UsersService,
    private readonly depositService: DepositService,
  ) {
  }

  @Get('')
  async getCommunities(): Promise<Community[]> {
    return this.communitiesService.find({});
  }

  @Get(':id')
  async getCommunity(@Param('id') id: string): Promise<Community | null> {
    const result = await this.communitiesService.findById(id);
    return result;
  }

  @Post(':id/join')
  async addCommunityUser(
    @Req() req: Request,
    @Param('id') id: string
  ): Promise<Community> {
    const user = await this.userService.findOne({});
    if (!user) {
      throw new NotFoundException();
    }
    const community = await this.communitiesService.findById(id);
    await this.userService.addCommunity(user.userId, community?._id);
    return await this.communitiesService.addUser(user.userId, id);
  }

  @Get(':id/deposits')
  async getCommunityDeposits(
    @Param('id') id: string): Promise<Deposit[]> {
    return this.depositService.find({
      community: id,
      status: { $in: [DEPOSIT_STATUS.published, DEPOSIT_STATUS.inReview, DEPOSIT_STATUS.preprint] },
    });
  }

  @Get(':id/moderate/deposits')
  async getModeratorDeposits(
    @Param('id') communityId: string,
    @Req() req: Request,
  ): Promise<Deposit[]> {
    const user = await this.userService.findOne({});

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.roles.includes(`moderator:${communityId}`)) {
      throw new UnauthorizedException('Only moderators can access this page');
    }

    return this.depositService.find({
      community: communityId,
      status: { $in: [DEPOSIT_STATUS.pendingApproval] },
    });
  }
}
