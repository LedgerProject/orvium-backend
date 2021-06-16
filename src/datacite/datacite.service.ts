import { HttpException, HttpService, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { environment } from '../environments/environment';
import { Author, DepositDocument } from '../deposit/deposit.schema';
import { DataciteCreator } from './datacite.schema';
import { CommunityDocument } from '../communities/communities.schema';
import { decryptJson } from '../utils/utils';
import { catchError } from 'rxjs/operators';

@Injectable()
export class DataciteService {
  constructor(
    private httpService: HttpService
  ) {
  }

  isEnabled(): boolean {
    return !!environment.datacite.enable;
  }

  /**
   * Generates a new DOI
   *
   * @param {DepositDocument} the deposit linked to the new DOI
   * @returns {string} the new DOI
   */
  async generateDOI(deposit: DepositDocument): Promise<string> {
    const depositCommunity = deposit.community as unknown as CommunityDocument;
    if (!depositCommunity.dataciteAccountID || !depositCommunity.datacitePassword) {
      throw new UnauthorizedException('DataCite credentials not defined');
    }
    const result = await this.httpService.post(`${environment.datacite.url}/dois`,
      {
        data: {
          type: 'dois',
          attributes: {
            event: 'publish',
            prefix: depositCommunity.datacitePrefix,
            creators: this.creators(deposit.authors),
            titles: [{
              title: deposit.title
            }],
            publisher: 'publisher',
            publicationYear: deposit.submissionDate?.getFullYear(),
            types: {
              resourceTypeGeneral: 'Text'
            },
            url: environment.publicUrl + '/deposits/' + deposit._id + '/view',
            schemaVersion: 'http://datacite.org/schema/kernel-4'
          }
        }
      },
      {
        headers: {
          'Content-Type': 'application/vnd.api+json'
        },
        auth: {
          username: depositCommunity.dataciteAccountID,
          password: decryptJson(depositCommunity.datacitePassword)
        },
      }).pipe(catchError(error => {
      throw new HttpException('DataCite DOI generation failed', HttpStatus.BAD_REQUEST);
    })).toPromise();
    return result.data.data.id;
  }

  /**
   * Updates DOI metadata
   *
   * @param {DepositDocument} the deposit linked to the DOI that we want to update
   * @returns any
   */
  async updateDOIMetadata(deposit: DepositDocument): Promise<void> {
    const depositCommunity = deposit.community as unknown as CommunityDocument;
    if (!depositCommunity.dataciteAccountID || !depositCommunity.datacitePassword) {
      throw new UnauthorizedException('DataCite credentials not defined');
    }
    this.httpService.put(`${environment.datacite.url}/dois/${deposit.doi}`,
      {
        data: {
          attributes: {
            creators: this.creators(deposit.authors),
            titles: [{
              title: deposit.title
            }],
            publicationYear: deposit.submissionDate?.getFullYear(),
            url: `${environment.publicUrl}/deposits/${deposit._id}/view`,
          }
        }
      },
      {
        headers: {
          'Content-Type': 'application/vnd.api+json'
        },
        auth: {
          username: depositCommunity.dataciteAccountID,
          password: decryptJson(depositCommunity.datacitePassword)
        },
      }).pipe(catchError(error => {
      throw new HttpException('DataCite DOI generation failed', HttpStatus.BAD_REQUEST);
    })).subscribe(response => console.log(response.data));
  }

  creators(authors: Author[]): DataciteCreator[] {
    const creators: DataciteCreator[] = [];
    authors.forEach(function (value) {
      const regex = /https:\/\/orcid\.org\/(.*)/;
      const orcid = value.orcid?.match(regex);
      if (orcid && orcid[1]) {
        creators.push({
          creatorName: value.name + ' ' + value.surname,
          givenName: value.name,
          familyName: value.surname,
          nameIdentifiers: [{
            nameIdentifier: orcid[1],
            nameIdentifierScheme: 'ORCID',
            schemeURI: 'http://orcid.org/',
          }]
        });
      } else {
        creators.push({
          creatorName: value.name + ' ' + value.surname,
          givenName: value.name,
          familyName: value.surname,
        });
      }
    });
    return creators;
  }
}
