import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpService,
  HttpStatus,
  NotFoundException,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { environment } from '../environments/environment';
import { CreateQuery } from 'mongoose';
import { UpdateUserDTO, User } from './user.schema';
import { randomBytes } from 'crypto';
import { EVENT_TYPE, EventDto } from '../event/event.schema';
import { EventService } from '../event/event.service';
import { IsEmail } from 'class-validator';
import { InstitutionService } from '../institution/institution.service';
import { Request } from 'express';
import { Community } from '../communities/communities.schema';

export class SendInviteBody {
  @IsEmail({}, { each: true })
  emails: string[];
}

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UsersService,
    private httpService: HttpService,
    private eventService: EventService,
    private institutionService: InstitutionService
  ) {
  }

  @Get('profile')
  async getMyProfile(
    @Req() req: Request,
    @Headers('Authorization') authorizationHeader: string,
  ): Promise<User> {
    let user = await this.userService.findOne({});

    if (!user) {
      const newUser = new this.userService.userModel({
        userId: '123456',
        firstName: 'Jhon',
        lastName: 'Doe',
        email: 'example@orvium.io',
        emailConfirmed: true,
        nickname: 'user-jhon',
        inviteToken: randomBytes(16).toString('hex'),
      });
  
      user = await newUser.save();
    }

    return user;
  }


  @Patch('profile')
  async updateProfile(
    @Body() payload: UpdateUserDTO,
    @Req() req: Request,
  ): Promise<User> {
    const user = await this.userService.findOne({});

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (payload.email && payload.email !== user.email) {
      if (user.emailChangedOn) {
        const difference = new Date().getTime() - user.emailChangedOn.getTime();
        const differenceInMinutes = difference / (60 * 1000);

        if (differenceInMinutes < 1) {
          throw new UnauthorizedException('Please wait some minutes before changing your email');
        }
      }

      // Email has changed, confirm again
      user.emailConfirmed = false;
      user.emailChangedOn = new Date();

      const eventPayload: EventDto = {
        eventType: EVENT_TYPE.CONFIRM_EMAIL,
        data: { email: payload.email },
      };
      await this.eventService.create(eventPayload);
    }

    // Final validations before saving the user
    if (user.email) {
      const emailDomain = user.email.split('@')[1];
      const institution = await this.institutionService.findOne({ domain: emailDomain });

      if (institution) {
        user.institution = institution.name;
      }
    }

    Object.assign(user, payload);

    return user.save();
  }

  @Post('sendConfirmationEmail')
  async sendConfirmationEmail(
    @Req() req: Request,
  ): Promise<void> {
    const user = await this.userService.findOne({});


    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.emailConfirmed) {
      const eventPayload: EventDto = {
        eventType: EVENT_TYPE.CONFIRM_EMAIL,
        data: { email: user.email },
      };
      await this.eventService.create(eventPayload);
    }

    if (user.emailConfirmed) {
      throw new UnauthorizedException('Email already confirmed');
    }
  }

  @Post('sendInvitations')
  async sendInvitations(
    @Req() req: Request,
    @Body() body: SendInviteBody): Promise<void> {

    if (body.emails.length > 5) {
      throw new HttpException('Max 5 emails', HttpStatus.BAD_REQUEST);
    }

    body.emails = Array.from(new Set(body.emails)); // Remove duplicates


    const user = await this.userService.findOne({});
    if (!user) {
      throw new NotFoundException('User not found');
    }


    const eventPayload: EventDto = {
      eventType: EVENT_TYPE.INVITE,
      data: {
        userId: user.userId,
        emails: body.emails,
      },
    };

    if (user.invitationsAvailable < body.emails.length) {
      throw new HttpException('You don\'t have enough invitations', HttpStatus.BAD_REQUEST);
    }

    user.invitationsAvailable = user.invitationsAvailable - body.emails.length;
    await user.save();
    await this.eventService.create(eventPayload);
  }

  @Get('myCommunities')
  async myCommunities(
    @Req() req: Request,
  ): Promise<Community[]> {
    const user = await this.userService.findOne({});

    console.log(user?.communities as unknown as Community[]);
    if(!user){
      throw new NotFoundException();
    }
    return user.communities as unknown as Community[];
  }

}
