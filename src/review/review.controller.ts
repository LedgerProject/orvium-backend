import {
  Body,
  Controller,
  Delete,
  Get,
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
import { ReviewService } from './review.service';
import { environment } from '../environments/environment';
import { Request, Response } from 'express';
import { CreateReviewDTO, Review, REVIEW_STATUS, UpdatePublishedReviewDTO, UpdateReviewDTO } from './review.schema';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { createHash } from 'crypto';
import { DepositService } from '../deposit/deposit.service';
import { UsersService } from '../users/users.service';
import { Deposit, DEPOSIT_STATUS } from '../deposit/deposit.schema';
import { EventService } from '../event/event.service';
import { EVENT_TYPE } from '../event/event.schema';
import { validateOrReject } from 'class-validator';
import { FilterQuery } from 'mongoose';
import { InviteService } from '../invite/invite.service';
import { User } from '../users/user.schema';
import { IStorageService } from 'src/storage-service.interface';
import { Inject } from '@nestjs/common';

const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.jpeg', '.jpg', '.png', '.gif', '.md', '.csv', '.tex'];

@Controller('reviews')
export class ReviewController {
  constructor(
    private readonly reviewService: ReviewService,
    private readonly depositService: DepositService,
    private readonly userService: UsersService,
    private readonly eventService: EventService,
    private readonly inviteService: InviteService,
    @Inject('IStorageService') private readonly storageService: IStorageService,
  ) {
  }

  @Get('')
  async getReviews(
    @Req() req: Request,
    @Query('depositId') depositId: string,
  ): Promise<Review[]> {

    const query: FilterQuery<Review> = {
      status: REVIEW_STATUS.published,
    };

    if (depositId) {
      query.deposit = depositId as any;
    }
    return this.reviewService.reviewModel.find(query).lean();
  }

  @Get('myReviews')
  async getMyReviews(
    @Req() req: Request
  ): Promise<Review[]> {
    const user = await this.userService.findOne({});

    if (!user) {
      throw new NotFoundException('User not found');
    }    return this.reviewService.find({
      owner: user.userId,
    });
  }

  @Get(':id')
  async getReview(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<Review> {
    const user = await this.userService.findOne({});

    if (!user) {
      throw new NotFoundException('User not found');
    }
    const review = await this.reviewService.findById(id);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (!this.canReadReview(user, review)) {
      throw new UnauthorizedException();
    }

    return review;
  }

  @Post('')
  async createReview(
    @Req() req: Request,
    @Body() newReview: CreateReviewDTO,
  ): Promise<Review> {
    const user = await this.userService.findOne({});

    if (!user) {
      throw new NotFoundException('User not found');
    }    const deposit = await this.depositService.findById(newReview.deposit);

    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!this.canCreateReview(user, deposit)) {
      throw new UnauthorizedException();
    }

    // Check if reviewer was invited by the owner to review the publication
    let wasInvited = false;
    const invites = await this.inviteService.find({
      data: {
        depositId: newReview.deposit,
      },
      addressee: user.email
    });
    if (invites.length > 0) {
      wasInvited = true;
    }

    // Create review
    const review = new this.reviewService.reviewModel({
      owner: user.userId,
      gravatar: user.gravatar,
      revealReviewerIdentity: newReview.revealReviewerIdentity,
      deposit: newReview.deposit,
      author: user.firstName + ' ' + user.lastName,
      wasInvited: wasInvited,
    });

    const createdReview = await review.save();
    console.log(deposit);
    deposit.peerReviews.push(createdReview._id);
    await deposit.save();

    await this.eventService.create({
      eventType: EVENT_TYPE.REVIEW_CREATED,
      data: {
        reviewId: createdReview._id,
        userId: deposit.owner,
        deposit: {
          title: deposit.title,
          id: deposit._id,
        },
      },
    });

    return createdReview;
  }

  @Patch(':id')
  async updateReview(
    @Req() req: Request,
    @Body() payload: UpdateReviewDTO,
    @Param('id') id: string,
  ): Promise<Review> {
    const user = await this.userService.findOne({});

    if (!user) {
      throw new NotFoundException('User not found');
    }    const review = await this.reviewService.findOne({
      _id: id,
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!this.canUpdateReview(user, review)) {
      throw new UnauthorizedException();
    }

    // If review is published then restrict the update
    if (review.status === REVIEW_STATUS.published) {
      const temp = new UpdatePublishedReviewDTO(payload);
      const errors = await validateOrReject(temp, { whitelist: true, forbidNonWhitelisted: true });
    }

    Object.assign(review, payload);
    return review.save();
  }

  @Delete(':id')
  async deleteReview(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<Review> {
    const user = await this.userService.findOne({});

    if (!user) {
      throw new NotFoundException('User not found');
    }
    const review = await this.reviewService.findOne({ _id: id });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (!this.canDeleteReview(user, review)) {
      throw new UnauthorizedException();
    }

    review.depopulate('deposit');
    const deposit = await this.depositService.findById(review.deposit.toString());
    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    console.log(deposit.peerReviews.indexOf(review._id));
    deposit.peerReviews.splice(deposit.peerReviews.indexOf(review._id), 1);
    await deposit.save();

    // Delete review files
    if (review.file) {
      const s3Object = `${review.deposit}/${review._id}/${review.file.filename}`;
      this.storageService.delete(s3Object);
    }

    return review.remove();
  }

  @Post(':id/file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('id') id: string,
    @Req() req: Request,
    @UploadedFile() file: any): Promise<Review> {

    const review = await this.reviewService.findById(id);

    if (!review) {
      throw new UnauthorizedException('Review not found');
    }

    if (review.status !== REVIEW_STATUS.draft) {
      throw new UnauthorizedException('Review should be draft');
    }

    if (!ALLOWED_FILE_EXTENSIONS.includes(extname(file.originalname))) {
      throw new UnauthorizedException('File type not allowed');
    }

    // Delete previous file if exist
    review.depopulate('deposit');
    if (review.file) {
      console.log('Delete existing file');
      const previousS3Object = `${review.deposit}/${review._id}/${review.file.filename}`;
      this.storageService.delete(previousS3Object);
    }

    const hash = createHash('sha256').update(file.buffer).digest('hex');
    review.file = {
      filename: file.originalname,
      contentType: file.mimetype,
      keccak256: hash,
      contentLength: file.size,
    };

    const s3Object = `${review.deposit}/${review._id}/${review.file.filename}`;
    console.log('Saving file:', review.file);
    console.log('S3 path:', s3Object);

    this.storageService.save(s3Object, file.buffer);

    return review.save();
  }

  @Get(':id/file')
  async getReviewFile(
    @Param('id') id: string,
    @Res() response: Response,
  ): Promise<any> {
    const review = await this.reviewService.findById(id);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (!review.file) {
      throw new NotFoundException('File not found');
    }

    review.depopulate('deposit');
    const s3Object = `${review.deposit}/${review._id}/${review.file.filename}`;
    console.log('s3Object', s3Object);
    const fileStream = this.storageService.get(s3Object);

    response.setHeader(
      'Content-Type',
      review.file.contentType,
    );

    return fileStream.pipe(response);
  }


  canReadReview(user: User | null, review: Review): boolean {
    const hasRights = false;

    // owner has access
    if (user && review.owner === user.userId) {
      return true;
    }

    // admin has access
    if (user && user.roles.includes(`admin`)) {
      return true;
    }

    if (review.status === REVIEW_STATUS.published) {
      return true;
    }

    return hasRights;
  }

  canUpdateReview(user: User, review: Review): boolean {
    let hasRights = false;

    // If deposit is published then restrict the update
    if (user.userId === review.owner && review.status === REVIEW_STATUS.draft) {
      hasRights = true;
    }

    // Admin can update
    if (user.roles.includes('admin')) {
      hasRights = true;
    }

    return hasRights;
  }

  canDeleteReview(user: User, review: Review): boolean {
    let hasRights = false;

    // If deposit is published then restrict the update
    if (user.userId === review.owner && review.status === REVIEW_STATUS.draft) {
      hasRights = true;
    }

    // Admin can update
    if (user.roles.includes('admin')) {
      hasRights = true;
    }

    return hasRights;
  }

  canCreateReview(user: User, deposit: Deposit): boolean {
    // Admin can update
    if (user.roles.includes('admin')) {
      return true;
    }

    // User needs to be onboarded
    if (!user.isReviewer) {
      return false;
    }

    // Owner of the deposit cannot create review
    if (deposit.owner === user.userId) {
      return false;
    }

    // Deposits in draft cannot be reviewed yet
    if (deposit.status === DEPOSIT_STATUS.draft) {
      return false;
    }

    return true;
  }
}
