import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { DepositService } from './deposit.service';
import { extname } from 'path';
import { environment } from '../environments/environment';
import { createHash } from 'crypto';
import {
  ACCESS_RIGHT,
  Citation,
  CreateDepositDTO,
  Deposit,
  DEPOSIT_STATUS,
  PUBLICATION_TYPE,
  REVIEW_TYPE,
  UpdateDepositDTO
} from './deposit.schema';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { UsersService } from '../users/users.service';
import { CreateQuery, FilterQuery } from 'mongoose';
import { EventService } from '../event/event.service';
import { EVENT_TYPE, EventDto } from '../event/event.schema';
import { v4 as uuidv4 } from 'uuid';
import { Community } from '../communities/communities.schema';
import { User } from '../users/user.schema';
import { IStorageService } from 'src/storage-service.interface';
import { Inject } from '@nestjs/common';

const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.jpeg', '.jpg', '.png', '.gif', '.md', '.csv', '.tex'];

@Controller('deposits')
export class DepositController {
  constructor(
    private readonly depositService: DepositService,
    private readonly userService: UsersService,
    private readonly eventService: EventService,
    @Inject('IStorageService') private readonly storageService: IStorageService,
  ) {
  }

  @Post('')
  async createDeposit(
    @Req() req: Request,
    @Body() newDeposit: CreateDepositDTO,
  ): Promise<Deposit> {
    const user = await this.userService.findOne({});

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!this.canCreateDeposit(user)) {
      throw new UnauthorizedException('You need to complete your profile');
    }

    const query: CreateQuery<Deposit> = {
      owner: user.userId,
      gravatar: user.gravatar,
      authors: [],
      references: [],
      title: newDeposit.title,
      accessRight: ACCESS_RIGHT.CC0,
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
      parent: uuidv4()
    };

    return await this.depositService.create(query);
  }

  @Post(':id/createRevision')
  async createDepositRevision(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<Deposit> {
    const user = await this.userService.findOne({});
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const deposit = await this.depositService.findOne({
      _id: id,
      owner: user.userId,
      status: { $in: [DEPOSIT_STATUS.published, DEPOSIT_STATUS.inReview, DEPOSIT_STATUS.preprint] }
    });

    if (!deposit) {
      throw new UnauthorizedException();
    }



    if (!this.canCreateVersion(user, deposit)) {
      throw new UnauthorizedException('You can not create a new version for this publication');
    }

    const existingDepositRevision = await this.depositService.findOne({
      version: deposit.version + 1,
      parent: deposit.parent,
    });

    if (existingDepositRevision) {
      throw new UnauthorizedException('There is already one new version created for this publication');
    }

    const query: CreateQuery<Deposit> = {
      owner: user.userId,
      gravatar: deposit.gravatar,
      authors: deposit.authors,
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
      files: [],
      keywords: deposit.keywords,
      createdOn: new Date(),
      isLatestVersion: false, // Set it to false until it is published
      version: deposit.version + 1,
      parent: deposit.parent
    };

    return await this.depositService.create(query);
  }

  @Get('myDeposits')
  async getMyDeposits(
    @Req() req: Request,
  ): Promise<Deposit[]> {
    const user = await this.userService.findOne({});
    return this.depositService.find({
      owner: user?.userId,
      isLatestVersion: true,
    });
  }

  @Get('preprintDeposits')
  async getPreprintDeposits(
    @Req() req: Request,
  ): Promise<Deposit[]> {
    const user = await this.userService.findOne({});
    return this.depositService.find({
      owner: { $ne: user?.userId },
      status: DEPOSIT_STATUS.preprint,
      isLatestVersion: true,
    });
  }

  @Get('pendingApprovalDeposits')
  async getPendingApprovalDeposits(
    @Req() req: Request,
  ): Promise<Deposit[]> {
    const user = await this.userService.findOne({});

    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.roles.includes('admin')) {
      throw new UnauthorizedException();
    }
    return this.depositService.find({
      status: DEPOSIT_STATUS.pendingApproval,
    });
  }

  @Get('myStarredDeposits')
  async getMyStarredDeposits(
    @Req() req: Request,
  ): Promise<Deposit[]> {
    const user = await this.userService.findOne({});

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.depositService.find({
      _id: { $in: user.starredDeposits }
    });
  }

  @Get(':id')
  async getDeposit(
    @Param('id') depositId: string,
    @Req() req: Request,
  ): Promise<Deposit> {
    const user = await this.userService.findOne({});
    const deposit = await this.depositService.findById(depositId);

    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    // Get the community
    const hasAccess = this.canReadDeposit(user, deposit);

    if (!hasAccess) {
      throw new UnauthorizedException('You do not have access to this deposit');
    }

    return deposit;
  }

  @Get(':id/versions')
  async getDepositVersions(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<Deposit[]> {
    const deposit = await this.depositService.findById(id);
    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    const user = await this.userService.findOne({});


    const allVersions = await this.depositService.depositModel
      .find({ parent: deposit.parent }).exec();
    const result: Deposit[] = [];
    for (const deposit of allVersions) {
      if (this.canReadDeposit(user, deposit)) {
        result.push(deposit);
      }
    }

    return result;
  }

  @Patch(':id')
  async updateDeposit(
    @Req() req: Request,
    @Body() payload: UpdateDepositDTO,
    @Param('id') id: string,
  ): Promise<Deposit> {
    const deposit = await this.depositService.findOne({
      _id: id,
    });

    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    const user = await this.userService.findOne({});


    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hasAccess = this.canUpdateDeposit(user, deposit);

    if (!hasAccess) {
      throw new UnauthorizedException('User cannot update this deposit');
    }

    // Check if the deposit is now the last version or not
    console.log(payload.status);
    if (payload.status && this.canCreateVersion(user, deposit)) {
      await this.depositService.checkIsLastVersion(deposit);
    }

    if (payload.status === DEPOSIT_STATUS.published) {
      deposit.publicationDate = new Date();
    }

    Object.assign(deposit, payload);
    const depositSaved = await deposit.save();
    return depositSaved.populate('community').execPopulate();
  }

  @Get('')
  async getDeposits(
    @Query('page') page: number,
    @Query('query') query: string,
  ): Promise<any> {
    const pageSize = 10;
    const skip = pageSize * (page - 1);

    const filter: FilterQuery<Deposit> = {};

    if (query) {
      filter.$text = { $search: query };
    }
    filter.status = { $in: [DEPOSIT_STATUS.published, DEPOSIT_STATUS.inReview, DEPOSIT_STATUS.preprint] };
    filter.isLatestVersion = true;

    const count = await this.depositService.depositModel.countDocuments(filter);
    const deposits = await this.depositService.findWithLimit(filter, skip, pageSize);
    return { deposits, count };
  }

  @Delete(':id')
  async deleteDeposit(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<Deposit> {
    const deposit = await this.depositService.findOne({
      _id: id,
    });

    if (!deposit) {
      throw new UnauthorizedException();
    }

    const user = await this.userService.findOne({});


    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hasRights = this.canDeleteDeposit(user, deposit);

    if (!hasRights) {
      throw new UnauthorizedException();
    }

    // Delete review files
    if (deposit.publicationFile) {
      const s3Object = `${deposit._id}/${deposit.publicationFile.filename}`;
      this.storageService.delete(s3Object);
    }

    // Delete review files
    for (const file of deposit.files) {
      const s3Object = `${deposit._id}/${file.filename}`;
      this.storageService.delete(s3Object);
    }

    return deposit.remove();
  }

  @Post(':id/files')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('id') id: string,
    @Query('isMainFile') isMainFile: boolean,
    @Req() req: Request,
    @UploadedFile() file: any
  ): Promise<Deposit> {
    const user = await this.userService.findOne({});

    const deposit = await this.depositService.findOne({
      _id: id,
      owner: user?.userId,
      status: DEPOSIT_STATUS.draft,
    });

    if (!deposit) {
      throw new UnauthorizedException();
    }

    if (deposit.status !== DEPOSIT_STATUS.draft) {
      throw new UnauthorizedException();
    }

    // File extension to lower case
    const ext = extname(file.originalname);
    file.originalname = file.originalname.replace(ext, ext.toLowerCase());

    if (!ALLOWED_FILE_EXTENSIONS.includes(extname(file.originalname))) {
      throw new UnauthorizedException('Invalid extension file');
    }

    const hash = createHash('sha256').update(file.buffer).digest('hex');
    const fileMetadata = {
      filename: file.originalname,
      contentType: file.mimetype,
      keccak256: hash,
      contentLength: file.size,
    };

    if (isMainFile) {
      // Delete previous file if exist
      if (deposit.publicationFile) {
        const previousS3Object = `${deposit._id}/${deposit.publicationFile.filename}`;
        this.storageService.delete(previousS3Object);
      }
      deposit.publicationFile = fileMetadata;
      deposit.pdfUrl = undefined;
      deposit.html = undefined;
      if (extname(file.originalname) == '.pdf') {
        deposit.pdfUrl = file.originalname;
      }
    } else {
      const index = deposit.files.findIndex((existingFile: any) => existingFile.filename === file.filename);
      if (index >= 0) {
        deposit.files.splice(index, 1);
      }

      deposit.files.push(fileMetadata);
      deposit.markModified('files');
    }


    const s3Object = `${deposit._id}/${fileMetadata.filename}`;
    this.storageService.save(s3Object, file.buffer );

    // Publish NewFile event
    if (isMainFile) {
      const eventPayload: EventDto = {
        eventType: EVENT_TYPE.NEW_FILE,
        data: {
          depositId: deposit._id,
          filename: fileMetadata.filename,
        },
      };
      await this.eventService.create(eventPayload);
    }

    return deposit.save();
  }

  @Get(':id/file')
  async getDespositFile(
    @Param('id') id: string,
    @Res() response: Response,
  ): Promise<any> {
    const deposit = await this.depositService.findById(id);
    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }
    if (!deposit.publicationFile || !deposit.publicationFile.filename) {
      throw new NotFoundException('Publication file not found');
    }

    const s3Object = `${deposit._id}/${deposit.publicationFile.filename}`;
    console.log('s3Object', s3Object);
    const fileStream = this.storageService.get(s3Object);

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
  ): Promise<any> {
    const deposit = await this.depositService.findById(id);
    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }
    const s3Object = `${deposit._id}/${deposit.pdfUrl}`;
    console.log('s3Object', s3Object);
    const fileStream = this.storageService.get(s3Object);
    response.setHeader(
      'Content-Type',
      'application/pdf',
    );
    return fileStream.pipe(response);
  }

  @Get(':id/files/:filename')
  async getDepositExtraFiles(
    @Param('id') id: string,
    @Param('filename') filename: string,
    @Res() response: Response,
  ): Promise<any> {
    const deposit = await this.depositService.findById(id);
    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    const allDespositFiles = deposit.files.concat(deposit.publicationFile);
    const storedFile = allDespositFiles.find((file: any) => file.filename === filename);

    const s3Object = `${deposit._id}/${storedFile.filename}`;
    console.log('s3Object', s3Object);
    const fileStream = this.storageService.get(s3Object);

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
  ): Promise<Deposit> {
    const user = await this.userService.findOne({});
    const deposit = await this.depositService.findOne({
      _id: id,
      owner: user?.userId,
      status: DEPOSIT_STATUS.draft,
    });
    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    const index = deposit.files.findIndex((file: any) => file.filename === filename);
    if (index === -1) {
      throw new UnauthorizedException();
    }

    const storedFile = deposit.files[index];
    const s3Object = `${deposit._id}/${storedFile.filename}`;
    console.log('s3Object', s3Object);
    this.storageService.delete(s3Object);

    deposit.files.splice(index, 1); // Removes item from files
    deposit.markModified('files');

    return deposit.save();
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

  canReadDeposit(user: User | null, deposit: Deposit): boolean {
    let hasRights = false;

    // owner has access
    if (user && deposit.owner === user.userId) {
      hasRights = true;
    }

    // admin has access
    if (user && user.roles.includes(`admin`)) {
      hasRights = true;
    }

    if (deposit.status === DEPOSIT_STATUS.preprint ||
      deposit.status === DEPOSIT_STATUS.inReview ||
      deposit.status === DEPOSIT_STATUS.published) {
      hasRights = true;
    }

    const community = deposit.community as unknown as Community;

    if (community && deposit.status === DEPOSIT_STATUS.pendingApproval) {
      // Only the owner and community moderator can access this deposit
      if (user && user.roles.includes(`moderator:${community._id}`)) {
        hasRights = true;
      }
    }

    return hasRights;
  }

  canUpdateDeposit(user: User, deposit: Deposit): boolean {
    let hasRights = false;

    const community = deposit.community as unknown as Community;

    // If deposit is published then restrict the update
    if (user.userId === deposit.owner && deposit.status === DEPOSIT_STATUS.draft) {
      hasRights = true;
    }

    // Moderator can update
    if (community && user.roles.includes(`moderator:${community._id}`)) {
      hasRights = true;
    }

    // Admin can update
    if (user.roles.includes('admin')) {
      hasRights = true;
    }

    return hasRights;
  }

  canDeleteDeposit(user: User, deposit: Deposit): boolean {
    let hasRights = false;

    // If deposit is published then restrict the update
    if (user.userId === deposit.owner && deposit.status === DEPOSIT_STATUS.draft) {
      hasRights = true;
    }

    // Admin can update
    if (user.roles.includes('admin')) {
      hasRights = true;
    }

    return hasRights;
  }

  canCreateDeposit(user: User): boolean {
    // User needs to be onboarded
    if (!user.isOnboarded) {
      return false;
    }

    return true;
  }

  canCreateVersion(user: User, deposit: Deposit): boolean {
    let hasRights = false;

    // If deposit is not
    if (user.userId === deposit.owner && deposit.status != DEPOSIT_STATUS.draft && deposit.status != DEPOSIT_STATUS.pendingApproval) {
      hasRights = true;
    }

    // Admin can create version
    if (user.roles.includes('admin')) {
      hasRights = true;
    }

    return hasRights;
  }
}
