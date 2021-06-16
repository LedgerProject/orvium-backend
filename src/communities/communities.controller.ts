import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Req, UnauthorizedException } from '@nestjs/common';
import { DEPOSIT_STATUS } from '../deposit/deposit.schema';
import { CommunitiesService } from './communities.service';
import { UsersService } from '../users/users.service';
import { DepositService } from '../deposit/deposit.service';
import { Request } from 'express';
import { Auth0UserProfile } from 'auth0-js';
import { encryptJson } from '../utils/utils';
import { CommunityDTO } from '../dtos/community.dto';
import { CommunityUpdateDto } from '../dtos/community-update.dto';
import { DepositDTO } from '../dtos/deposit/deposit.dto';
import { plainToClassCustom } from '../utils/transformer';
import { canDo, checkCanDo, defineAbilityFor } from '../authorization/abilities';
import { CommunityPrivateDTO } from '../dtos/community-private.dto';
import { AuthorizationService } from '../authorization/authorization.service';

@Controller('communities')
export class CommunitiesController {
  constructor(
    private readonly communitiesService: CommunitiesService,
    private readonly userService: UsersService,
    private readonly depositService: DepositService,
    private readonly authorizationService: AuthorizationService
  ) {
  }

  @Get('')
  async communities(): Promise<CommunityDTO[]> {
    const communities = await this.communitiesService.find({});
    return plainToClassCustom(CommunityDTO, communities);
  }

  @Get(':id')
  async community(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<CommunityDTO | CommunityPrivateDTO> {
    const auth0Profile = req.user as Auth0UserProfile;
    const community = await this.communitiesService.findById(id);
    if (!community) {
      throw new NotFoundException('Community not found');
    }
    const moderators = await this.userService.find({ roles: `moderator:${id}` });
    const user = await this.userService.findOne({ userId: auth0Profile?.sub });
    const ability = defineAbilityFor(user);
    if (ability.can( 'update', community)) {
      const communityPrivateDTO = plainToClassCustom(CommunityPrivateDTO, { ...community.toObject(), moderators });
      communityPrivateDTO.actions = this.authorizationService.getSubjectActions(user, community);
      return communityPrivateDTO
    }
    const communityDTO = plainToClassCustom(CommunityDTO, { ...community.toObject(), moderators });
    communityDTO.actions = this.authorizationService.getSubjectActions(user, community);
    return communityDTO;
  }

  @Patch(':id')
  async updateCommunity(
    @Req() req: Request,
    @Body() payload: CommunityUpdateDto,
    @Param('id') id: string,
  ): Promise<CommunityPrivateDTO> {
    const community = await this.communitiesService.findOneByFilter({
      _id: id,
    });
    if (!community) {
      throw new NotFoundException('Deposit not found');
    }
    const auth0Profile = req.user as Auth0UserProfile;
    const user = await this.userService.findOne({ userId: auth0Profile.sub });
    const ability = defineAbilityFor(user);
    canDo(ability, 'update', community);
    if (payload.datacitePassword == null) {
      delete payload.datacitePassword;
    }
    if (payload.datacitePassword) {
      payload.datacitePassword = encryptJson(payload.datacitePassword);
    }
    Object.assign(community, payload);
    const communitySaved = await community.save();
    const communityPrivateDTO = plainToClassCustom(CommunityPrivateDTO, communitySaved);
    communityPrivateDTO.actions = this.authorizationService.getSubjectActions(user, community);
    return communityPrivateDTO;
  }

  @Post(':id/join')
  async joinCommunity(
    @Req() req: Request,
    @Param('id') id: string
  ): Promise<CommunityDTO> {
    const auth0Profile = req.user as Auth0UserProfile;
    const community = await this.communitiesService.findById(id);
    await this.userService.addCommunity(auth0Profile.sub, community?._id);
    const communityUpdated = await this.communitiesService.addUser(auth0Profile.sub, id);
    return plainToClassCustom(CommunityDTO, communityUpdated);
  }

  @Get(':id/deposits')
  async communityDeposits(
    @Param('id') id: string): Promise<DepositDTO[]> {
    const deposits = await this.depositService.find({
      community: id,
      status: { $in: [DEPOSIT_STATUS.published, DEPOSIT_STATUS.inReview, DEPOSIT_STATUS.preprint] },
      isLatestVersion: true
    });

    return plainToClassCustom(DepositDTO, deposits);
  }

  @Get(':id/moderate/deposits')
  async getModeratorDeposits(
    @Param('id') communityId: string,
    @Req() req: Request,
  ): Promise<DepositDTO[]> {
    const auth0Profile = req.user as Auth0UserProfile;
    const user = await this.userService.findOne({ userId: auth0Profile.sub });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const community = await this.communitiesService.findById(communityId);
    if (!community) {
      throw new NotFoundException('Community not found');
    }
    const ability = defineAbilityFor(user);

    if (ability.cannot('moderate', community)) {
      throw new UnauthorizedException('Only moderators can access this page');
    }

    const deposits = await this.depositService.find({
      community: communityId,
      status: { $in: [DEPOSIT_STATUS.pendingApproval] },
    });

    return plainToClassCustom(DepositDTO, deposits);
  }
}
