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
import { CreateInviteDto, Invite, INVITE_STATUS, InviteDto } from './invite.schema';
import { DepositService } from '../deposit/deposit.service';
import { CreateQuery } from 'mongoose';
import { EVENT_TYPE } from '../event/event.schema';
import { EventService } from '../event/event.service';
import { Request } from 'express';
import { User } from '../users/user.schema';
import { Deposit, DEPOSIT_STATUS } from '../deposit/deposit.schema';

@Controller('invites')
export class InviteController {
  constructor(
    private readonly inviteService: InviteService,
    private readonly userService: UsersService,
    private readonly depositService: DepositService,
    private readonly eventService: EventService,
  ) {
  }

  /**
   * Create invitation
   * @Body CreateInviteDto object
   * @return Invite object created
   */
  @Post('')
  async createInvite(
    @Req() req: Request,
    @Body() newInvite: CreateInviteDto,
  ): Promise<Invite> {

    const userSender = await this.userService.findOne({});
    if (!userSender) {
      throw new NotFoundException('User not found');
    }

    const deposit = await this.depositService.findById(newInvite.data.depositId);
    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    const canInvite = this.canInviteReviewers(userSender, deposit);

    if (!canInvite) {
      throw new UnauthorizedException();
    }

    const dateDeadline = new Date();
    // Generate invitation creation query
    dateDeadline.setMonth(dateDeadline.getMonth() + 1);
    const query: CreateQuery<Invite> = {
      inviteType: newInvite.inviteType,
      sender: userSender._id,
      addressee: newInvite.addressee,
      data: {
        depositId: newInvite.data.depositId,
        depositTitle: deposit.title
      },
      deadline: dateDeadline,
    };
    // Check if the addressee is the owner
    if (userSender.email == newInvite.addressee) {
      throw new HttpException('You can not invite yourself', HttpStatus.FORBIDDEN);
    }
    // Check if invitation already exists
    const inviteExists = await this.inviteService.exists({
      sender: userSender._id,
      addressee: newInvite.addressee,
      data: {
        depositId: newInvite.data.depositId,
        depositTitle: deposit.title
      },
    });
    if (inviteExists) {
      throw new HttpException('Invitation already exists', HttpStatus.FORBIDDEN);
    }
    // Send email
    await this.eventService.create({
      eventType: EVENT_TYPE.REVIEW_INVITATION_EMAIL,
      data: {
        user: userSender,
        deposit: deposit,
        email: newInvite.addressee,
      },
    });
    return await this.inviteService.create(query);
  }

  /**
   * Returns all the invitations for the indicate deposit id if you are the owner
   * @Param deposit id
   * @return Invite objects array
   */
  @Get('')
  async depositInvites(
    @Req() req: Request,
    @Query('depositId') depositId: string,
  ): Promise<Invite[]> {
    const deposit = await this.depositService.findById(depositId);
    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }
    const user = await this.userService.findOne({});


    if (!user) {
      throw new NotFoundException('User not found');
    }

    const canInvite = this.canInviteReviewers(user, deposit);

    if (!canInvite) {
      throw new UnauthorizedException();
    }

    return await this.inviteService.find(
      { data: { depositId: depositId, depositTitle: deposit.title } });
  }

  /**
   * Returns all your invitations
   * @Param user id
   * @return Invite objects array
   */
  @Get('myInvites')
  async myInvites(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<Invite[]> {
    const user = await this.userService.findOne({});

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return await this.inviteService.find(
      { addressee: user.email });
  }

  /**
   * Modify invitation status to accepted or rejected if you are the addressee
   * @Param invitation id
   * @return Invite objects
   */
  @Patch(':id')
  async updateInvite(
    @Req() req: Request,
    @Body() payload: InviteDto,
    @Param('id') id: string
  ): Promise<Invite> {
    const user = await this.userService.findOne({});

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
      const deposit = await this.depositService.findOne({ _id: invite.data.depositId });
      await this.eventService.create({
        eventType: EVENT_TYPE.REVIEW_INVITATION_ACCEPTED,
        data: {
          user: owner,
          deposit: deposit,
        },
      });
    }
    Object.assign(invite, payload);
    return invite.save();
  }

  canInviteReviewers(user: User, deposit: Deposit): boolean {
    let hasRights = false;
    // deposits in preprint, inreview and published can invite reviewers but only owners and admins
    if (deposit.status === DEPOSIT_STATUS.preprint ||
      deposit.status === DEPOSIT_STATUS.inReview ||
      deposit.status === DEPOSIT_STATUS.published) {

      if (user.roles.includes('admin')) {
        hasRights = true;
      }

      if (user && deposit.owner === user.userId){
        hasRights = true;
      }
    }
    return hasRights;
  }
}
