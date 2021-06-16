import { Body, Controller, Get, NotFoundException, Patch, Post, Query, Req, UnauthorizedException } from '@nestjs/common';
import { InstitutionService } from './institution.service';
import { InstitutionDocument } from './institution.schema';
import { Request } from 'express';
import { Auth0UserProfile } from 'auth0-js';
import { UserDocument } from '../users/user.schema';
import { UsersService } from '../users/users.service';
import { DocumentDefinition } from 'mongoose';
import { InstitutionDTO } from '../dtos/institution/institution.dto';
import { plainToClassCustom } from '../utils/transformer';
import { CreateInstitutionDTO } from '../dtos/institution/create-institution.dto';

@Controller('institutions')
export class InstitutionController {
  constructor(
    private readonly institutionService: InstitutionService,
    private readonly userService: UsersService
  ) {
  }

  @Get('')
  async institution(
    @Query('domain') domain: string,
  ): Promise<InstitutionDTO | null> {
    const institution = await this.institutionService.findOne({ domain: domain });
    return plainToClassCustom(InstitutionDTO, institution);
  }

  @Post('')
  async createInstitution(
    @Req() req: Request,
    @Body() newInstitution: CreateInstitutionDTO,
  ): Promise<InstitutionDTO | null> {
    const auth0Profile = req.user as Auth0UserProfile;
    const user = await this.userService.findOne({ userId: auth0Profile.sub });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const hasRights = this.canCreateInstitution(user);
    if (!hasRights) {
      throw new UnauthorizedException();
    }
    if (await this.institutionService.exists({ domain: newInstitution.domain })) {
      throw new UnauthorizedException('Institution already exists');
    }
    console.log(78787);
    const query: DocumentDefinition<InstitutionDocument> = {
      domain: newInstitution.domain,
      name: newInstitution.name,
      city: newInstitution.city,
      country: newInstitution.country,
      synonym: newInstitution.synonym
    };

    const institution = await this.institutionService.create(query);
    return plainToClassCustom(InstitutionDTO, institution);
  }

  canCreateInstitution(user: UserDocument): boolean {
    let hasRights = false;
    // Admin can create version
    if (user.roles.includes('admin')) {
      hasRights = true;
    }
    return hasRights;
  }

  @Patch('')
  async updateUserInstitution(
    @Req() req: Request,
  ): Promise<void> {
    const auth0Profile = req.user as Auth0UserProfile;
    const user = await this.userService.findOne({ userId: auth0Profile.sub });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const hasRights = this.canCreateInstitution(user);
    if (!hasRights) {
      throw new UnauthorizedException();
    }
    const users = await this.userService.find({});
    for (const user of users) {
      if (user.isOnboarded && user.email) {
        const domain = user.email.replace(/.*@/, '');
        const institution = await this.institutionService.findOne({ domain: domain });
        if (institution) {
          user.institution = institution.name;
          await user.save();
        }
      }
    }
  }
}
