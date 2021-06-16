import { Controller, HttpService, NotFoundException, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { Auth0UserProfile } from 'auth0-js';
import { UsersService } from '../users/users.service';
import { OrcidWork } from '../dtos/orcid.dto';

@Controller('orcid')
export class OrcidController {
  constructor(
    private readonly userService: UsersService,
    private httpService: HttpService,
  ) {
  }

  /**
   * Return user Orcid works with title and DOI
   *
   * - AUTH: Log in
   * @param {Request} req the request
   * @returns {OrcidWork[]} list of works with title and doi
   */
  @Post('')
  async createWithDOI2(
    @Req() req: Request,
  ): Promise<OrcidWork[]> {
    const auth0Profile = req.user as Auth0UserProfile;
    const user = await this.userService.findOne({ userId: auth0Profile.sub });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.orcid) {
      throw new NotFoundException('User orcid found');
    }
    const regex = /https:\/\/orcid\.org\/(.*)/;
    const orcid = user.orcid.match(regex);
    const url = `https://pub.orcid.org/v3.0/${orcid?.[1]}/works`;
    const result = await this.httpService.get(url,
      {
        headers: {
          'Accept': 'application/json'
        },
      }).toPromise();
    const works: OrcidWork[] = [];
    for (const work of result.data.group) {
      for (const elem of work['external-ids']['external-id']) {
        if (elem['external-id-type'] == 'doi') {
          works.push({ title: work['work-summary'][0].title.title.value, doi: elem['external-id-value'] });
        }
      }
    }
    return works;
  }
}
