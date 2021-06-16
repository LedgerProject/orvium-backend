import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException
} from '@nestjs/common';
import { InviteService } from './invite.service';
import { UsersService } from '../users/users.service';
import { INVITE_STATUS, INVITE_TYPE, InviteDocument } from './invite.schema';
import { DepositService } from '../deposit/deposit.service';
import { EVENT_TYPE } from '../event/event.schema';
import { EventService } from '../event/event.service';
import { Request } from 'express';
import { Auth0UserProfile } from 'auth0-js';
import { DocumentDefinition } from 'mongoose';
import { CreateInviteDTO } from '../dtos/invite-create.dto';
import { InviteDTO } from '../dtos/invite.dto';
import { plainToClassCustom } from '../utils/transformer';
import { InviteUpdateDTO } from '../dtos/invite-update.dto';
import { canDo, defineAbilityFor } from '../authorization/abilities';
import { AuthorizationService } from '../authorization/authorization.service';
import { decryptJson } from '../utils/utils';

@Controller('invites')
export class InviteController {
  constructor(
    private readonly inviteService: InviteService,
    private readonly userService: UsersService,
    private readonly depositService: DepositService,
    private readonly eventService: EventService,
    private readonly authorizationService: AuthorizationService
  ) {
  }

  /**
   * Create invitation
   * @Body CreateInviteDto object
   * @return InviteDocument object created
   */
  @Post('')
  async createInvite(
    @Req() req: Request,
    @Body() newInvite: CreateInviteDTO,
  ): Promise<InviteDTO> {
    const auth0Profile = req.user as Auth0UserProfile;

    const userSender = await this.userService.findOne({ userId: auth0Profile.sub });
    if (!userSender) {
      throw new NotFoundException('User not found');
    }

    const deposit = await this.depositService.findById(newInvite.data.depositId);
    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    const ability = defineAbilityFor(userSender);
    canDo(ability, 'inviteReviewers', deposit);

    const dateDeadline = new Date();
    // Generate invitation creation query
    dateDeadline.setMonth(dateDeadline.getMonth() + 1);
    const query: DocumentDefinition<InviteDocument> = {
      inviteType: newInvite.inviteType,
      sender: userSender._id,
      addressee: newInvite.addressee,
      data: {
        depositId: newInvite.data.depositId,
        depositTitle: deposit.title
      },
      deadline: dateDeadline,
      status: INVITE_STATUS.pending,
      createdOn: new Date()
    };
    // Check if the addressee is the owner
    if (userSender.email == newInvite.addressee) {
      throw new HttpException('You can not invite yourself', HttpStatus.FORBIDDEN);
    }
    // Check if invitation already exists
    const inviteExists = await this.inviteService.exists({
      sender: userSender._id,
      addressee: newInvite.addressee,
      'data.depositId': newInvite.data.depositId,
    });
    if (inviteExists) {
      throw new HttpException('Invitation already exists', HttpStatus.FORBIDDEN);
    }
    const invitation = await this.inviteService.create(query);

    // Send email
    await this.eventService.create({
      eventType: EVENT_TYPE.REVIEW_INVITATION_EMAIL,
      data: {
        user: userSender,
        deposit: deposit,
        email: newInvite.addressee,
        invite: invitation,
      },
    });

    return plainToClassCustom(InviteDTO, invitation);
  }

  /**
   * Returns all the invitations for the indicate deposit id if you are the owner
   * @Param deposit id
   * @return InviteDocument objects array
   */
  @Get('')
  async depositInvites(
    @Req() req: Request,
    @Query('depositId') depositId: string,
  ): Promise<InviteDTO[]> {
    const deposit = await this.depositService.findById(depositId);
    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }
    const auth0Profile = req.user as Auth0UserProfile;
    const user = await this.userService.findOne({ userId: auth0Profile.sub });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const ability = defineAbilityFor(user);
    canDo(ability, 'inviteReviewers', deposit);

    const invitations = await this.inviteService.find({
      inviteType: INVITE_TYPE.review,
      'data.depositId': depositId,
      deadline: { $gte: new Date() }
    });

    return plainToClassCustom(InviteDTO, invitations);
  }

  /**
   * Returns all your invitations
   * @Param user id
   * @return InviteDocument objects array
   */
  @Get('myInvites')
  async myInvites(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<InviteDTO[]> {
    const auth0Profile = req.user as Auth0UserProfile;
    const user = await this.userService.findOne({ userId: auth0Profile.sub });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const invitations = await this.inviteService.find(
      { addressee: user.email, deadline: { $gt: new Date() } });

    return plainToClassCustom(InviteDTO, invitations);
  }

  /**
   * Returns if you have been invited to the deposit
   *
   * @param deposit id
   * @return {Boolean}
   */
  @Get('myInvitesForDeposit')
  async myInviteForDeposit(
    @Req() req: Request,
    @Query('id') depositId: string
  ): Promise<boolean> {
    const auth0Profile = req.user as Auth0UserProfile;
    const user = await this.userService.findOne({ userId: auth0Profile.sub });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return await this.inviteService.exists({
      addressee: user.email,
      status: INVITE_STATUS.pending,
      deadline: { $gte: new Date() },
      'data.depositId': depositId
    });
  }

  /**
   * Modify invitation status to accepted or rejected if you are the addressee
   * @Param invitation id
   * @return InviteDocument objects
   */
  @Patch(':id')
  async updateInvite(
    @Req() req: Request,
    @Body() payload: InviteUpdateDTO,
    @Param('id') id: string
  ): Promise<InviteDTO> {
    const auth0Profile = req.user as Auth0UserProfile;
    const user = await this.userService.findOne({ userId: auth0Profile.sub });
    const invite = await this.inviteService.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.addressee != user.email) {
      throw new UnauthorizedException();
    }
    // If the reviewer has accepted the invitation, we notify the owner of the deposit
    if (payload.status == INVITE_STATUS.accepted) {
      const owner = await this.userService.findOne({ _id: invite.sender });
      const deposit = await this.depositService.findOne({ _id: invite.data?.depositId });
      await this.eventService.create({
        eventType: EVENT_TYPE.REVIEW_INVITATION_ACCEPTED,
        data: {
          user: owner,
          deposit: deposit,
        },
      });
    }
    Object.assign(invite, payload);
    const inviteUpdated = await invite.save();

    const inviteDTO = plainToClassCustom(InviteDTO, inviteUpdated);
    inviteDTO.actions = this.authorizationService.getSubjectActions(user, inviteUpdated);
    return inviteDTO;
  }

  /**
   * Modify invitation status to accepted or rejected using a token
   *
   * @param {string} invite reviewer token
   * @return {string} message
   */
  @Get('inviteReviewerToken')
  async inviteReviewerToken(
    @Query('inviteReviewerToken') token: string,
  ): Promise<{ message: string }> {
    const decodedToken = decodeURIComponent(token);
    const inviteToken: { expiration: Date, id: string, status: INVITE_STATUS } = decryptJson(decodedToken);
    if (new Date() > inviteToken.expiration) {
      throw new UnauthorizedException('The invitation link has expired. Please, log in to accept or reject the invite');
    }
    const invite = await this.inviteService.findById(inviteToken.id);
    if (!invite) {
      throw new NotFoundException('Invitation not found');
    }

    switch (inviteToken.status) {
      case INVITE_STATUS.accepted: {
        const owner = await this.userService.findOne({ _id: invite.sender });
        const deposit = await this.depositService.findOne({ _id: invite.data?.depositId });
        await this.eventService.create({
          eventType: EVENT_TYPE.REVIEW_INVITATION_ACCEPTED,
          data: {
            user: owner,
            deposit: deposit,
          },
        });
        invite.status = inviteToken.status;
        await invite.save();
        return { message: 'Invite accepted' };
      }
      case INVITE_STATUS.rejected: {
        invite.status = inviteToken.status;
        await invite.save();
        return { message: 'Invite rejected' };
      }
      default: {
        return { message: 'Invalid invitation status' };
      }
    }
  }
}
