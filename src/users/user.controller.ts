import {
  Body, ConflictException,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpService,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException
} from '@nestjs/common';
import { UsersService } from './users.service';
import { environment } from '../environments/environment';
import { UserDocument } from './user.schema';
import { randomBytes } from 'crypto';
import { EVENT_TYPE, EventDTO } from '../event/event.schema';
import { EventService } from '../event/event.service';
import { decryptJson } from '../utils/utils';
import { InstitutionService } from '../institution/institution.service';
import { Request } from 'express';
import { Auth0UserProfile } from 'auth0-js';
import { DocumentDefinition } from 'mongoose';
import { UpdateUserDTO } from '../dtos/update-user.dto';
import { UserPrivateDTO } from '../dtos/user-private.dto';
import { SendInviteBody } from '../dtos/invite-send.dto';
import { UserPublicDTO } from '../dtos/user-public.dto';
import { plainToClassCustom } from '../utils/transformer';
import { AuthorizationService } from '../authorization/authorization.service';
import { DepositDTO } from '../dtos/deposit/deposit.dto';
import { canDo, defineAbilityFor } from '../authorization/abilities';
import { AuthGuard } from '@nestjs/passport';

/**
 * Module for user operations
 */
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UsersService,
    private httpService: HttpService,
    private eventService: EventService,
    private institutionService: InstitutionService,
    private readonly authorizationService: AuthorizationService
  ) {
  }

  @Get('profile')
  async myProfile(
    @Req() req: Request,
    @Headers('Authorization') authorizationHeader: string,
    @Query('inviteToken') inviteToken: string,
  ): Promise<UserPrivateDTO> {
    const auth0Profile = req.user as Auth0UserProfile;
    let user = await this.userService.findOne({ userId: auth0Profile.sub });

    if (!user) {
      const newUser = new this.userService.userModel({
        userId: '123456',
        firstName: 'Jhon',
        lastName: 'Doe',
        email: 'excample@orvium.io',
        emailConfirmed: true,
        nickname: 'user-' + this.randomInt(10000, 99999),
        inviteToken: randomBytes(16).toString('hex'),
      } as DocumentDefinition<UserDocument>);

      if (newUser.userId.includes('ORCID')) {
        const regex = /oauth2\|ORCID\|(https:\/\/orcid\.org\/[\w,-]*)/;
        const orcid = newUser.userId.match(regex);
        newUser.orcid = orcid?.[1] || 'Error processing ORCID';
      }

      if (inviteToken && await this.userService.exists({ inviteToken: inviteToken })) {
        newUser.invitedBy = inviteToken;
      }
      user = await newUser.save();

      const eventPayload: EventDTO = {
        eventType: EVENT_TYPE.USER_CREATED,
        data: newUser,
      };
      await this.eventService.create(eventPayload);
    }

    const userPrivateDTO = plainToClassCustom(UserPrivateDTO, user);
    userPrivateDTO.actions = this.authorizationService.getSubjectActions(user, user);
    return userPrivateDTO;
  }

  @Get('profile/:nickname')
  async publicProfile(
    @Param('nickname') nickname: string,
    @Req() req: Request,
  ): Promise<UserPublicDTO> {
    const auth0Profile = req.user as Auth0UserProfile;
    const user = await this.userService.findOne({ userId: auth0Profile?.sub });
    const userProfile = await this.userService.userCommunities({ nickname: nickname });
    if (!userProfile) {
      throw new NotFoundException('User not found');
    }
    const userPublicDTO = plainToClassCustom(UserPublicDTO, userProfile);
    userPublicDTO.actions = this.authorizationService.getSubjectActions(user, userProfile);
    return userPublicDTO;
  }

  @Patch('profile')
  async updateProfile(
    @Body() payload: UpdateUserDTO,
    @Req() req: Request,
  ): Promise<UserPrivateDTO> {
    const auth0Profile = req.user as Auth0UserProfile;
    const user = await this.userService.findOne({ userId: auth0Profile.sub });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const ability = defineAbilityFor(user);
    canDo(ability, 'update', user);

    // Set nickname
    let number;
    if (payload.firstName && payload.lastName) {
      let isAvailable = false;
      let user_nickname = (payload.firstName + '-' + payload.lastName).replace(/\s+/g, '-');
      while (isAvailable == false) {
        const exists = await this.userService.exists({ nickname: user_nickname, userId: { $ne: user.userId } });
        if (exists == false) {
          isAvailable = true;
          user.nickname = user_nickname;
        } else {
          number = this.randomInt(1000, 9999);
          user_nickname = payload.firstName + '-' + payload.lastName + '-' + number;
          user_nickname = user_nickname.toLowerCase().replace(' ', '-');
        }
      }
      user.nickname = user_nickname.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    if (payload.email && payload.email !== user.email) {
      const existingUser = await this.userService.findOne({ email: payload.email });
      if (existingUser) {
        throw new ConflictException('Another user already registered with the same email');
      }

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

      const eventPayload: EventDTO = {
        eventType: EVENT_TYPE.CONFIRM_EMAIL,
        data: { email: payload.email },
      };
      await this.eventService.create(eventPayload);
    }
    // Final validations before saving the user
    if (payload.email) {
      const emailDomain = payload.email.split('@')[1];
      const institution = await this.institutionService.findOne({ domain: emailDomain });
      if (institution) {
        user.institution = institution.name;
      } else {
        user.institution = '';
        // Institution does not exist, then create notification
        const eventPayload: EventDTO = {
          eventType: EVENT_TYPE.NEW_INSTITUTION,
          data: {
            domain: emailDomain,
          },
        };
        await this.eventService.create(eventPayload);
      }
    }

    Object.assign(user, payload);

    const userUpdated = await user.save();
    const userPrivateDTO = plainToClassCustom(UserPrivateDTO, userUpdated);
    userPrivateDTO.actions = this.authorizationService.getSubjectActions(user, userUpdated);
    return userPrivateDTO;
  }

  @Post('sendConfirmationEmail')
  async sendConfirmationEmail(
    @Req() req: Request,
  ): Promise<void> {
    const auth0Profile = req.user as Auth0UserProfile;
    const user = await this.userService.findOne({ userId: auth0Profile.sub });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.emailConfirmed) {
      const eventPayload: EventDTO = {
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
    const auth0Profile = req.user as Auth0UserProfile;

    if (body.emails.length > 5) {
      throw new HttpException('Max 5 emails', HttpStatus.BAD_REQUEST);
    }

    body.emails = Array.from(new Set(body.emails)); // Remove duplicates

    const eventPayload: EventDTO = {
      eventType: EVENT_TYPE.INVITE,
      data: {
        userId: auth0Profile.sub,
        emails: body.emails,
      },
    };

    const user = await this.userService.findOne({ userId: auth0Profile.sub });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.invitationsAvailable < body.emails.length) {
      throw new HttpException('You don\'t have enough invitations', HttpStatus.BAD_REQUEST);
    }

    user.invitationsAvailable = user.invitationsAvailable - body.emails.length;
    await user.save();
    await this.eventService.create(eventPayload);
  }

  @Get('confirmEmail')
  async confirmEmail(
    @Query('token') token: string): Promise<{ message: string }> {
    const decodedToken = decodeURIComponent(token);
    const jsonToken = decryptJson<{ expiration: Date, email: string }>(decodedToken);
    if (new Date() > jsonToken.expiration) {
      throw new UnauthorizedException('The confirmation link is invalid or has expired.');
    }

    const user = await this.userService.findOne({ email: jsonToken.email.toLowerCase() });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailConfirmed) {
      return { message: 'Account already confirmed. Please login.' };
    } else {
      user.emailConfirmed = true;
      user.emailConfirmedOn = new Date();
      await user.save();
      return { message: 'Thank you for confirming your email address! Please reload the page.' };
    }
  }

  randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
