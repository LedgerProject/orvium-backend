import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpService,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException
} from '@nestjs/common';
import { DepositService } from './deposit.service';
import { extname } from 'path';
import { ACCESS_RIGHT, Author, DEPOSIT_STATUS, DepositDocument, PUBLICATION_TYPE, REVIEW_TYPE, } from './deposit.schema';
import { Request, Response } from 'express';
import { UsersService } from '../users/users.service';
import { DocumentDefinition, FilterQuery } from 'mongoose';
import { EventService } from '../event/event.service';
import { EVENT_TYPE, EventDTO, ICommentCreatedData } from '../event/event.schema';
import { v4 as uuidv4 } from 'uuid';
import { Auth0UserProfile } from 'auth0-js';
import { CommunityDocument } from '../communities/communities.schema';
import { DataciteService } from '../datacite/datacite.service';
import { CommunitiesService } from '../communities/communities.service';
import { Allow } from 'class-validator';
import { parse } from 'node-html-parser';
import { CreateDepositDTO } from '../dtos/deposit/create-deposit.dto';
import { UpdateDepositDTO } from '../dtos/deposit/update-deposit.dto';
import { DepositDTO } from '../dtos/deposit/deposit.dto';
import { FileMetadata } from '../dtos/filemetadata.dto';
import { CreateCommentDTO } from '../dtos/comment-create.dto';
import { Citation } from '../dtos/citation.dto';
import { Reference } from '../dtos/reference.dto';
import { plainToClassCustom } from '../utils/transformer';
import { canDo, defineAbilityFor } from '../authorization/abilities';
import { UserDocument } from '../users/user.schema';
import { AuthorizationService } from '../authorization/authorization.service';
import { LocalStorageService } from '../common/local-storage.service';

const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.jpeg', '.jpg', '.png', '.gif', '.md', '.csv', '.tex', '.rtf'];

class AppFile {
  readonly lastModified!: number;
  readonly name!: string;
  readonly size!: number;
  readonly type!: string;
}

class CreateFileDTO {
  @Allow() file!: AppFile;
  isMainFile?: boolean;
}

@Controller('deposits')
export class DepositController {
  constructor(
    private readonly depositService: DepositService,
    private readonly userService: UsersService,
    private readonly eventService: EventService,
    private readonly dataciteService: DataciteService,
    private readonly communitiesService: CommunitiesService,
    private readonly storageService: LocalStorageService,
    private readonly httpService: HttpService,
    private readonly authorizationService: AuthorizationService
  ) {
  }

  @Post('')
  async createDeposit(
    @Req() req: Request,
    @Body() newDeposit: CreateDepositDTO,
  ): Promise<DepositDTO> {
    const auth0Profile = req.user as Auth0UserProfile;
    const user = await this.userService.findOne({ userId: auth0Profile.sub });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const ability = defineAbilityFor(user);
    canDo(ability, 'create', 'DepositDocument');
    const query: DocumentDefinition<DepositDocument> = {
      owner: user.userId,
      nickname: user.nickname,
      gravatar: user.gravatar,
      authors: [],
      comments: [],
      references: [],
      title: newDeposit.title,
      accessRight: ACCESS_RIGHT.CC0,
      // @ts-ignore
      community: newDeposit.community,
      publicationType: PUBLICATION_TYPE.article,
      disciplines: [],
      status: DEPOSIT_STATUS.draft,
      peerReviews: [],
      reviewType: REVIEW_TYPE.openReview,
      files: [],
      keywords: [],
      createdOn: new Date(),
      isLatestVersion: true,
      version: 1,
      parent: uuidv4(),
      canBeReviewed: true
    };

    const deposit = await this.depositService.create(query);
    const depositDTO = plainToClassCustom(DepositDTO, deposit, { groups: ['owner'] });
    depositDTO.actions = this.authorizationService.getSubjectActions(user, deposit);
    return depositDTO;
  }

  /**
   * Creates a new deposit importing information from metatags
   * metatags preference? Dublin core or google scholar, Zenodo integration? new DOI in zenodo = new paper in Orvium
   * - AUTH: Log in
   * @param {Request} req the request
   * @param {CreateDepositDTO} newDeposit data with the DOI
   * @returns {deposit} created
   */
  @Post('createWithDOI')
  async createWithDOI(
    @Req() req: Request,
    @Body() newDeposit: CreateDepositDTO,
  ): Promise<DepositDTO> {
    const auth0Profile = req.user as Auth0UserProfile;
    const user = await this.userService.findOne({ userId: auth0Profile.sub });
    const ability = defineAbilityFor(user);
    canDo(ability, 'create', 'DepositDocument');
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!newDeposit.doi) {
      throw new NotFoundException('DOI was not defined');
    }

    const query: DocumentDefinition<DepositDocument> = {
      owner: user.userId,
      nickname: user.nickname,
      gravatar: user.gravatar,
      title: 'Publication with DOI: ' + newDeposit.doi,
      doi: newDeposit.doi,
      authors: [],
      comments: [],
      references: [],
      accessRight: ACCESS_RIGHT.CC0,
      // @ts-ignore
      community: newDeposit.community,
      publicationType: PUBLICATION_TYPE.article,
      disciplines: [],
      status: DEPOSIT_STATUS.draft,
      peerReviews: [],
      reviewType: REVIEW_TYPE.openReview,
      files: [],
      keywords: [],
      createdOn: new Date(),
      isLatestVersion: true, // Set it to false until it is published
      version: 1,
      parent: uuidv4(),
      canBeReviewed: true,
    };
    const result = await this.httpService.get(`https://doi.org/${newDeposit.doi}`).toPromise()
      .catch((error) => {
        throw new NotFoundException('Sorry, unable to import');
      });
    const setCookie = result.request.res.headers['set-cookie'] ? result.request.res.headers['set-cookie'] : '';
    const result2 = await this.httpService.get(`https://doi.org/${newDeposit.doi}`,
      {
        headers: {
          'Cookie': setCookie
        }
      }).toPromise()
      .catch((error) => {
        throw new NotFoundException('Sorry, unable to import');
      });
    const doc = parse(result2.data);
    let pdfURL = null;
    const tags = doc.querySelectorAll('meta');
    for (let i = 0; i < tags.length; i++) {
      const metaElement = tags[i] as unknown as HTMLMetaElement;
      const content = metaElement.getAttribute('content');
      if (content) {
        switch (metaElement.getAttribute('name')) {
          case 'citation_title': {
            query.title = content;
            break;
          }
          case 'dc.Title': {
            query.title = content;
            break;
          }
          case 'description': {
            query.abstract = content;
            break;
          }
          case 'citation_abstract': {
            query.abstract = content;
            break;
          }
          case 'dc.Description': {
            query.abstract = content;
            break;
          }
          case 'keywords': {
            query.keywords = content.split(',');
            break;
          }
          case 'citation_pdf_url': {
            pdfURL = content;
            break;
          }
          case 'citation_author': {
            const splitAuthor = content.split(' ');
            // Author names can be listed either as "Smith, John" or as "John Smith".
            if (content.includes(',')) {
              const splitAuthor = content.split(',');
              const surname = splitAuthor[0];
              const name = splitAuthor[1];
              const author: Author = {
                name: name,
                surname: surname || '',
                credit: []
              };
              query.authors.push(author);
            } else {
              const name = splitAuthor[0];
              splitAuthor.shift();
              const surname = splitAuthor.join(' ');
              const author: Author = {
                name: name,
                surname: surname || '',
                credit: []
              };
              query.authors.push(author);
            }
            break;
          }
          case 'citation_reference': {
            const reference: Reference = {
              reference: this.generateReferenceFromMetaData(content),
            };
            if (reference.reference !== ' (n.d.) ') {
              query.references.push(reference);
            }
            break;
          }
          default: {
            break;
          }
        }
      }
    }
    const deposit = await this.depositService.create(query);
    if (pdfURL) {
      await this.downloadFile(pdfURL, deposit);
    }
    const depositDTO = plainToClassCustom(DepositDTO, deposit);
    depositDTO.actions = this.authorizationService.getSubjectActions(user, deposit);
    return depositDTO;
  }


  /**
   * Returns the 12 top disciplines of all the deposits in preprint, review and published
   *
   * @returns {unknown}
   */
  @Get('topDisciplines')
  async getTopDisciplines(): Promise<unknown> {
    const topDisciplines = await this.depositService.aggregate([
      { $match: { status: { $in: [DEPOSIT_STATUS.published, DEPOSIT_STATUS.inReview, DEPOSIT_STATUS.preprint] } } },
      { $unwind: '$disciplines' },
      { $sortByCount: '$disciplines' },
      { $limit: 12 }
    ]);

    return topDisciplines;
  }

  @Post(':id/createRevision')
  async createDepositRevision(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<DepositDTO> {
    const auth0Profile = req.user as Auth0UserProfile;
    const deposit = await this.depositService.findOne({
      _id: id
    });

    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    const user = await this.userService.findOne({ userId: auth0Profile.sub });
    const ability = defineAbilityFor(user);
    canDo(ability, 'createVersion', deposit);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingDepositRevision = await this.depositService.findOne({
      version: deposit.version + 1,
      parent: deposit.parent,
    });

    if (existingDepositRevision) {
      throw new UnauthorizedException('There is already one new version created for this publication');
    }

    const query: DocumentDefinition<DepositDocument> = {
      owner: user.userId,
      nickname: user.nickname,
      gravatar: deposit.gravatar,
      authors: deposit.authors,
      comments: [],
      references: deposit.references,
      title: deposit.title,
      abstract: deposit.abstract,
      accessRight: deposit.accessRight,
      community: deposit.community,
      publicationType: deposit.publicationType,
      disciplines: deposit.disciplines,
      status: DEPOSIT_STATUS.draft,
      peerReviews: [],
      reviewType: REVIEW_TYPE.openReview,
      doi: deposit.doi,
      files: [],
      keywords: deposit.keywords,
      createdOn: new Date(),
      isLatestVersion: false, // Set it to false until it is published
      version: deposit.version + 1,
      parent: deposit.parent,
      canBeReviewed: true
    };

    const depositCreated = await this.depositService.create(query);
    const depositDTO = plainToClassCustom(DepositDTO, depositCreated, { groups: ['owner'] });
    depositDTO.actions = this.authorizationService.getSubjectActions(user, deposit);
    return depositDTO;
  }

  @Get('myDeposits')
  async getMyDeposits(
    @Req() req: Request,
  ): Promise<DepositDTO[]> {
    const auth0Profile = req.user as Auth0UserProfile;
    const deposits = await this.depositService.find({
      owner: auth0Profile.sub,
      isLatestVersion: true,
    });

    return plainToClassCustom(DepositDTO, deposits, { groups: ['owner'] });
  }

  @Get('papersToReview')
  async getPapersToReview(
    @Req() req: Request,
  ): Promise<DepositDTO[]> {
    const auth0Profile = req.user as Auth0UserProfile;
    const deposits = await this.depositService.find({
      canBeReviewed: true,
      owner: { $ne: auth0Profile.sub },
      status: DEPOSIT_STATUS.preprint,
      isLatestVersion: true,
    });

    return plainToClassCustom(DepositDTO, deposits);
  }

  @Get('pendingApprovalDeposits')
  async getPendingApprovalDeposits(
    @Req() req: Request,
  ): Promise<DepositDTO[]> {
    const auth0Profile = req.user as Auth0UserProfile;
    const user = await this.userService.findOne({ userId: auth0Profile.sub });
    const ability = defineAbilityFor(user);
    canDo(ability, 'create', 'DepositDocument');
    const deposits = await this.depositService.find({
      status: DEPOSIT_STATUS.pendingApproval,
    });
    return plainToClassCustom(DepositDTO, deposits);
  }

  @Get('myStarredDeposits')
  async getMyStarredDeposits(
    @Req() req: Request,
  ): Promise<DepositDTO[]> {
    const auth0Profile = req.user as Auth0UserProfile;
    const user = await this.userService.findOne({ userId: auth0Profile.sub });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const deposits = await this.depositService.find({
      _id: { $in: user.starredDeposits }
    });

    return plainToClassCustom(DepositDTO, deposits);
  }

  @Get(':id')
  async getDeposit(
    @Param('id') depositId: string,
    @Req() req: Request,
  ): Promise<DepositDTO> {
    const auth0Profile = req.user as Auth0UserProfile;
    const deposit = await this.depositService.findById(depositId);

    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    // Get the user
    const user = await this.userService.findOne({ userId: auth0Profile?.sub });

    const ability = defineAbilityFor(user);
    canDo(ability, 'read', deposit);

    if (deposit.status === DEPOSIT_STATUS.draft) {
      if (deposit.publicationFile) {
        const objectKey = `${deposit._id}/${deposit.publicationFile.filename}`;
        const params = {
          Key: objectKey,
          Expires: 60
        };
        const signedUrl = this.storageService.getSignedUrl('getObject', params);
        deposit.publicationFile.presignedURL = signedUrl;
      }
      if (deposit.pdfUrl) {
        const objectKey = `${deposit._id}/${deposit.pdfUrl}`;
        const params = {
          Key: objectKey,
          Expires: 60
        };
        const signedUrl = this.storageService.getSignedUrl('getObject', params);
        deposit.presignedPDFURL = signedUrl;
      }
      for (const file of deposit.files) {
        const objectKey = `${deposit._id}/${file.filename}`;
        const params = {
          Key: objectKey,
          Expires: 60
        };
        const signedUrl = this.storageService.getSignedUrl('getObject', params);
        file.presignedURL = signedUrl;
      }
    }
    const depositDTO = plainToClassCustom(DepositDTO, deposit);
    depositDTO.actions = this.authorizationService.getSubjectActions(user, deposit);

    if (depositDTO.gitRepository) {
      depositDTO.binderURL = this.depositService.getBinderURL(depositDTO.gitRepository);
    }
    return depositDTO;
  }

  @Get(':id/versions')
  async getDepositVersions(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<DepositDTO[]> {
    const deposit = await this.depositService.findById(id);
    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }
    const auth0Profile = req.user as Auth0UserProfile;
    // Get the user
    const user = await this.userService.findOne({ userId: auth0Profile?.sub });
    const allVersions = await this.depositService.depositModel
      .find({ parent: deposit.parent }).exec();
    const result: DepositDocument[] = [];
    const ability = defineAbilityFor(user);
    for (const deposit of allVersions) {
      if (ability.can('read', deposit)) {
        result.push(deposit);
      }
    }

    return plainToClassCustom(DepositDTO, result);
  }

  @Patch(':id')
  async updateDeposit(
    @Req() req: Request,
    @Body() payload: UpdateDepositDTO,
    @Param('id') id: string,
  ): Promise<DepositDTO> {
    const deposit = await this.depositService.findOne({
      _id: id,
    });

    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    const auth0Profile = req.user as Auth0UserProfile;
    const user = await this.userService.findOne({ userId: auth0Profile.sub });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const ability = defineAbilityFor(user);
    canDo(ability, 'update', deposit);

    // Status update
    if (payload.status) {
      // BACK TO DRAFT STATUS UPDATE
      if (payload.status === DEPOSIT_STATUS.draft) {
        // Notify author if a deposit goes back to draft
        const eventPayload: EventDTO = {
          eventType: EVENT_TYPE.DRAFT,
          data: {
            depositId: deposit._id,
          },
        };
        await this.eventService.create(eventPayload);
      }
      // PENDING APPROVAL STATUS UPDATE
      if (payload.status === DEPOSIT_STATUS.pendingApproval) {
        // Notify admins about new pending approval deposits
        const eventPayload: EventDTO = {
          eventType: EVENT_TYPE.PENDING_APPROVAL,
          data: {
            depositId: deposit._id,
          },
        };
        await this.eventService.create(eventPayload);
      }
      // PREPRINT STATUS UPDATE
      if (payload.status === DEPOSIT_STATUS.preprint) {
        // Check if the deposit is now the last version or not
        await this.depositService.updateToLastVersion(deposit);
        if (this.dataciteService.isEnabled() && deposit.community) {
          // Generate DOI if it is part of a community
          const depositCommunity = deposit.community as unknown as CommunityDocument;
          const regexp = new RegExp(`${depositCommunity.datacitePrefix}\/.+`);
          if (depositCommunity.dataciteEnabled && !deposit.doi) {
            deposit.doi = await this.dataciteService.generateDOI(deposit);
          } else if (deposit.doi && deposit.doi.match(regexp)) {
            await this.dataciteService.updateDOIMetadata(deposit);
          }
        }
      }
      // PUBLISHED STATUS UPDATE
      if (payload.status === DEPOSIT_STATUS.published) {
        // Check if the deposit is now the last version or not
        await this.depositService.updateToLastVersion(deposit);
        deposit.publicationDate = new Date();
      }
    }
    Object.assign(deposit, payload);
    const depositSaved = await deposit.save();
    const depositPopulated = await depositSaved.populate('community').execPopulate();
    const depositDTO = plainToClassCustom(DepositDTO, depositPopulated, { groups: ['owner'] });
    depositDTO.actions = this.authorizationService.getSubjectActions(user, deposit);
    if (depositDTO.gitRepository) {
      depositDTO.binderURL = this.depositService.getBinderURL(depositDTO.gitRepository);
    }
    return depositDTO;
  }

  @Get('')
  async getDeposits(
    @Query('page') page: number,
    @Query('query') query: string,
    @Query('userId') userId: string,
    @Query('doi') doi: string,
    @Query('orcid') orcid: string,
    @Query('from') from: string,
    @Query('until') until: string,
    @Query('discipline') discipline: string,
    @Query('status') status: DEPOSIT_STATUS,
    @Req() req: Request,
  ): Promise<{ count: number; deposits: DepositDTO[] }> {
    const auth0Profile = req.user as Auth0UserProfile;
    // Get the user
    const user = await this.userService.findOne({ userId: auth0Profile?.sub });

    const pageSize = 10;
    const skip = pageSize * (page - 1);

    const filter: FilterQuery<DepositDocument> = {};

    if (query) {
      filter.$text = { $search: query };
    }
    if (userId) {
      filter.owner = userId;
    }

    if (doi) {
      filter.doi = { $eq: doi };
    }
    if (orcid) {
      filter.authors = { $elemMatch: { orcid: { $eq: orcid } } };
    }
    if (discipline) {
      filter.disciplines = { $elemMatch: { $eq: discipline } };
    }
    if (from) {
      filter.submissionDate = { $gte: from as unknown as Date };
    }
    if (until) {
      filter.submissionDate = { $lte: until as unknown as Date };
    }
    if (from && until) {
      filter.submissionDate = { $gte: from as unknown as Date, $lte: until as unknown as Date };
    }
    filter.status = { $in: [DEPOSIT_STATUS.published, DEPOSIT_STATUS.inReview, DEPOSIT_STATUS.preprint] };
    if (status) {
      filter.status = { $eq: status };
    }
    filter.isLatestVersion = true;

    const count = await this.depositService.depositModel.countDocuments(filter);
    const deposits = await this.depositService.findWithLimit(filter, skip, pageSize);

    if (!user) {
      for (const deposit of deposits) {
        this.depositService.deleteAuthorsEmail(deposit);
      }
    }

    return { deposits: plainToClassCustom(DepositDTO, deposits), count };
  }

  @Delete(':id')
  async deleteDeposit(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<DepositDTO> {
    const deposit = await this.depositService.findOne({
      _id: id,
    });

    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    const auth0Profile = req.user as Auth0UserProfile;
    const user = await this.userService.findOne({ userId: auth0Profile.sub });
    const ability = defineAbilityFor(user);
    canDo(ability, 'delete', deposit);

    // Delete review files
    if (deposit.publicationFile) {
      const objectKey = `${deposit._id}/${deposit.publicationFile.filename}`;
      await this.storageService.delete(objectKey);
    }

    // Delete review files
    for (const file of deposit.files) {
      const objectKey = `${deposit._id}/${file.filename}`;
      await this.storageService.delete(objectKey);
    }

    const depositDeleted = await deposit.remove();
    return plainToClassCustom(DepositDTO, depositDeleted);
  }

  @Post(':id/files')
  async uploadFile(
    @Param('id') id: string,
    @Body() payload: CreateFileDTO,
    @Query('isMainFile') isMainFile: boolean,
    @Req() req: Request,
  ): Promise<{ signedUrl: string }> {
    const auth0Profile = req.user as Auth0UserProfile;
    const user = await this.userService.findOne({ userId: auth0Profile.sub });
    const deposit = await this.depositService.findOne({
      _id: id,
    });
    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }
    const ability = defineAbilityFor(user);
    canDo(ability, 'update', deposit);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const file = payload.file;

    // File extension to lower case
    const fileExtension = extname(file.name).toLowerCase();
    const filename = file.name.toLowerCase();

    if (!ALLOWED_FILE_EXTENSIONS.includes(fileExtension)) {
      throw new UnauthorizedException('Invalid extension file');
    }

    const tags: string[] = [];
    const fileMetadata: FileMetadata = {
      filename: filename,
      contentType: file.type,
      contentLength: file.size,
      tags: tags
    };

    if (isMainFile) {
      // Delete previous file if exist
      if (deposit.publicationFile) {
        const previousObjectKey = `${deposit._id}/${deposit.publicationFile.filename}`;
        await this.storageService.delete(previousObjectKey);
      }
      fileMetadata.tags.push('Publication');
      deposit.publicationFile = fileMetadata;
      if (fileExtension == '.pdf') {
        deposit.pdfUrl = filename;
      }
      // If main file exists in extra files, delete from extra files
      const index = deposit.files.findIndex(existingFile => existingFile.filename === filename);
      if (index >= 0) {
        deposit.files.splice(index, 1);
        deposit.markModified('files');
      }
    } else {
      // Only upload if extra file is different from main file
      if (deposit.publicationFile?.filename != filename) {
        // If extra file already exists overwrite it
        const index = deposit.files.findIndex(existingFile => existingFile.filename === filename);
        if (index >= 0) {
          deposit.files.splice(index, 1);
        }
        deposit.files.push(fileMetadata);
        deposit.markModified('files');
      }
    }

    // Publish NewFile event
    if (isMainFile) {
      const eventPayload: EventDTO = {
        eventType: EVENT_TYPE.NEW_FILE,
        data: {
          depositId: deposit._id,
          filename: fileMetadata.filename,
        },
      };
      await this.eventService.create(eventPayload);
    }

    const objectKey = `${deposit._id}/${filename}`;
    const params = {
      Bucket: 'fake-bucket',
      Key: objectKey,
      ContentType: fileMetadata.contentType
    };

    const signedUrl = this.storageService.getSignedUrl('putObject', params);

    await deposit.save();
    return { signedUrl };
  }

  @Get(':id/file')
  async getDespositFile(
    @Param('id') id: string,
    @Res() response: Response,
  ): Promise<unknown> {
    const deposit = await this.depositService.findById(id);
    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }
    if (deposit.status == DEPOSIT_STATUS.draft) {
      throw new UnauthorizedException('Deposit should not be draft');
    }
    if (!deposit.publicationFile || !deposit.publicationFile.filename) {
      throw new NotFoundException('Publication file not found');
    }
    const objectKey = `${deposit._id}/${deposit.publicationFile.filename}`;
    const fileStream = this.storageService.get(objectKey);
    response.setHeader(
      'Content-Type',
      deposit.publicationFile.contentType,
    );
    return fileStream.pipe(response);
  }

  @Get(':id/pdf')
  async getDespositFilePdf(
    @Param('id') id: string,
    @Res() response: Response,
  ): Promise<unknown> {
    const deposit = await this.depositService.findById(id);
    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }
    if (deposit.status == DEPOSIT_STATUS.draft) {
      throw new UnauthorizedException('Deposit should not be draft');
    }
    const objectKey = `${deposit._id}/${deposit.pdfUrl}`;
    const fileStream = this.storageService.get(objectKey);
    response.setHeader(
      'Content-Type',
      'application/pdf',
    );
    return fileStream.pipe(response);
  }

  @Get(':id/media/:image/')
  async getDespositImages(
    @Param('id') id: string,
    @Param('image') image: string,
    @Res() response: Response,
  ): Promise<unknown> {
    // TODO fix this visibility check for binary files
    const deposit = await this.depositService.findById(id);
    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    const objectKey = `${deposit._id}/media/${image}`;
    const fileStream = this.storageService.get(objectKey);
    response.setHeader(
      'Content-Type',
      'image/png',
    );
    return fileStream.pipe(response);
  }

  @Get(':id/files/:filename')
  async getDepositExtraFiles(
    @Param('id') id: string,
    @Param('filename') filename: string,
    @Res() response: Response,
  ): Promise<unknown> {
    const deposit = await this.depositService.findById(id);
    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }
    // if (deposit.status == DEPOSIT_STATUS.draft) {
    //   throw new UnauthorizedException('Deposit should not be draft');
    // }
    const allDespositFiles = deposit.files.concat(deposit.publicationFile || []);
    const storedFile = allDespositFiles.find(file => file.filename === filename);

    if (!storedFile) {
      throw new NotFoundException('File not found');
    }

    const objectKey = `${deposit._id}/${storedFile.filename}`;
    const fileStream = this.storageService.get(objectKey);

    response.setHeader(
      'Content-Type',
      storedFile.contentType,
    );

    return fileStream.pipe(response);
  }

  @Delete(':id/files/:filename')
  async deleteDepositExtraFiles(
    @Param('id') id: string,
    @Param('filename') filename: string,
    @Req() req: Request,
  ): Promise<DepositDTO> {

    const auth0Profile = req.user as Auth0UserProfile;
    const user = await this.userService.findOne({ userId: auth0Profile.sub });
    const deposit = await this.depositService.findOne({
      _id: id,
    });
    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }
    const ability = defineAbilityFor(user);
    canDo(ability, 'update', deposit);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const index = deposit.files.findIndex(file => file.filename === filename);
    if (index === -1) {
      throw new NotFoundException('File not found');
    }

    const storedFile = deposit.files[index];
    const objectKey = `${deposit._id}/${storedFile.filename}`;
    await this.storageService.delete(objectKey);

    deposit.files.splice(index, 1); // Removes item from files
    deposit.markModified('files');

    const depositSaved = await deposit.save();
    const depositPopulated = await this.depositService.findById(depositSaved._id);

    const depositDTO = plainToClassCustom(DepositDTO, depositPopulated);
    depositDTO.actions = this.authorizationService.getSubjectActions(user, deposit);
    return depositDTO;
  }

  @Get(':id/citation')
  async getCitation(
    @Param('id') id: string
  ): Promise<Citation> {
    const deposit = await this.depositService.findById(id);
    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }
    const citation = new Citation();
    citation.apa = await this.depositService.getAPACitation(deposit);
    return citation;
  }

  @Get(':id/bibtex')
  @Header('Content-Type', 'text/plain')
  async getBibtex(
    @Param('id') id: string
  ): Promise<string> {
    return await this.depositService.getBibtexCitation(id);
  }

  @Post(':id/comments')
  async addComment(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() newComment: CreateCommentDTO
  ): Promise<DepositDTO> {
    const auth0Profile = req.user as Auth0UserProfile;
    const user = await this.userService.findOne({ userId: auth0Profile.sub });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const deposit = await this.depositService.findById(id);
    if (!deposit) {
      throw new NotFoundException('Deposit does not exist');
    }

    const ability = defineAbilityFor(user);
    canDo(ability, 'createComment', deposit);


    const data: ICommentCreatedData = {
      userId: deposit.owner,
      deposit: {
        title: deposit.title,
        _id: deposit._id,
        owner: deposit.owner,
      },
    };

    await this.eventService.create({
      eventType: EVENT_TYPE.COMMENT_CREATED,
      data,
    });

    const depositResult = await this.depositService.addComment(newComment.content, deposit, user);

    // Send as response the populated deposit
    const depositPopulated = await this.depositService.findById(depositResult._id);
    return plainToClassCustom(DepositDTO, depositPopulated);
  }

  @Delete(':id/comments/:commentId')
  async deleteComment(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('commentId') commentId: string
  ): Promise<DepositDTO> {
    const auth0Profile = req.user as Auth0UserProfile;
    const user = await this.userService.findOne({ userId: auth0Profile.sub });
    const deposit = await this.depositService.findById(id);

    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }
    const hasRights = this.canDeleteComment(deposit, commentId, user);

    if (!hasRights) {
      throw new UnauthorizedException();
    }

    const depositResult = await this.depositService.deleteComment(deposit, commentId);
    const depositPopulated = await this.depositService.findById(depositResult._id);
    return plainToClassCustom(DepositDTO, depositPopulated);
  }

  canDeleteComment(deposit: DepositDocument, commentId: string, user: UserDocument): boolean {
    let hasRights = false;

    const comment = deposit.comments.find(comment => comment.id.toString() === commentId);

    //If the author of the comment
    if (comment && comment.author.userId === user.userId) {
      hasRights = true;
    }

    //If admin
    if (user.roles.includes('admin')) {
      hasRights = true;
    }

    return hasRights;
  }

  /**
   * Dowloads a file from an URL and attaches it to the deposit
   *
   * @param {string} file URL
   * @param {DepositDocument} the deposit
   */
  async downloadFile(url: string, deposit: DepositDocument): Promise<void> {
    const response = await this.httpService.axiosRef({
      url: url,
      method: 'GET',
      responseType: 'stream',
    });
    const filename = 'publicationfile.pdf';
    await this.storageService.save(`${deposit._id}/${filename}`,
      response.data);
    const tags: string[] = [];
    const fileMetadata = {
      filename: filename,
      contentType: 'application/pdf',
      contentLength: response.headers['content-length'],
      tags: tags
    };
    fileMetadata.tags.push('Publication');
    deposit.publicationFile = fileMetadata;
    deposit.pdfUrl = filename;
    await deposit.save();
  }

  /**
   * Generates a reference from citation_reference meta tag used by Google Scholar
   *
   * @param {string} meta metatag content as a string
   * @returns {string} the complete reference with authors, date and title
   */
  generateReferenceFromMetaData(meta: string): string {
    const referenceSplit = meta.split(';');
    let titleReference = '';
    const authorReference: string[] = [];
    let dateReference = 'n.d.';
    for (const reference of referenceSplit) {
      const referenceSubTag = reference.split('=');
      switch (referenceSubTag[0].trim()) {
        case 'citation_title': {
          titleReference = referenceSubTag[1].trim();
          break;
        }
        case 'citation_author': {
          authorReference.push(referenceSubTag[1].trim());
          break;
        }
        case 'citation_publication_date': {
          dateReference = referenceSubTag[1].trim();
          break;
        }
        default: {
          break;
        }
      }
    }
    return authorReference.join(',') + ' (' + dateReference + ') ' + titleReference;
  }
}
