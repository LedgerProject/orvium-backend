import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { Request, Response } from 'express';
import { REVIEW_STATUS, ReviewDocument } from './review.schema';
import { extname } from 'path';
import { AuthGuard } from '@nestjs/passport';
import { DepositService } from '../deposit/deposit.service';
import { UsersService } from '../users/users.service';
import { EventService } from '../event/event.service';
import { EVENT_TYPE } from '../event/event.schema';
import { Allow, validateOrReject } from 'class-validator';
import { FilterQuery } from 'mongoose';
import { InviteService } from '../invite/invite.service';
import { Auth0UserProfile } from 'auth0-js';
import { CreateReviewDTO } from '../dtos/create-review.dto';
import { UpdateReviewDTO } from '../dtos/update-review.dto';
import { UpdatePublishedReviewDTO } from '../dtos/update-review-published.dto';
import { ReviewDTO } from '../dtos/review.dto';
import { plainToClassCustom } from '../utils/transformer';
import { canDo, defineAbilityFor } from '../authorization/abilities';
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

@Controller('reviews')
export class ReviewController {
  constructor(
    private readonly reviewService: ReviewService,
    private readonly depositService: DepositService,
    private readonly userService: UsersService,
    private readonly eventService: EventService,
    private readonly inviteService: InviteService,
    private readonly storageService: LocalStorageService,
    private readonly authorizationService: AuthorizationService
  ) {
  }

  @Get('')
  async reviews(
    @Req() req: Request,
    @Query('depositId') depositId: string,
    @Query('owner') owner: string
  ): Promise<ReviewDTO[]> {

    const query: FilterQuery<ReviewDocument> = {
      status: REVIEW_STATUS.published,
    };

    if (owner) {
      query.owner = owner;
    }

    if (depositId) {
      query.deposit = depositId;
    }

    const reviews = await this.reviewService.find(query);
    return plainToClassCustom(ReviewDTO, reviews);
  }

  @Get('myReviews')
  async getMyReviews(
    @Req() req: Request
  ): Promise<ReviewDTO[]> {
    const auth0Profile = req.user as Auth0UserProfile;
    const reviews = await this.reviewService.find({
      owner: auth0Profile.sub,
    });
    return plainToClassCustom(ReviewDTO, reviews);
  }

  @Get(':id')
  async review(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<ReviewDTO> {
    const auth0Profile = req.user as (Auth0UserProfile | undefined);

    const review = await this.reviewService.findById(id);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const user = await this.userService.findOne({ userId: auth0Profile?.sub });
    const ability = defineAbilityFor(user);
    canDo(ability, 'read', review);

    if (review.status === REVIEW_STATUS.draft && review.file) {
      review.depopulate('deposit');
      const objectKey = `${review.deposit}/${review._id}/${review.file.filename}`;
      const params = {
        Key: objectKey,
        Expires: 60
      };
      const signedUrl = this.storageService.getSignedUrl('getObject', params);
      review.file.presignedURL = signedUrl;
    }
    const reviewDTO = plainToClassCustom(ReviewDTO, review);
    reviewDTO.actions = this.authorizationService.getSubjectActions(user, review);
    return reviewDTO;
  }

  @Post('')
  async createReview(
    @Req() req: Request,
    @Body() newReview: CreateReviewDTO,
  ): Promise<ReviewDTO> {
    const auth0Profile = req.user as Auth0UserProfile;
    const user = await this.userService.findOne({ userId: auth0Profile.sub });
    const deposit = await this.depositService.findById(newReview.deposit);

    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isReviewer) {
      throw new UnauthorizedException('You need to be a reviewer');
    }

    const ability = defineAbilityFor(user);
    canDo(ability, 'review', deposit);

    // Check if reviewer was invited by the owner to review the publication
    const wasInvited = await this.inviteService.exists({
      'data.depositId': newReview.deposit,
      addressee: user.email
    });


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
    deposit.peerReviews.push(createdReview._id);
    await deposit.save();

    if (newReview.invite) {
      const invite = await this.inviteService.findById(newReview.invite);
      if (!invite || !invite.data) {
        throw new NotFoundException('Invite not found');
      }
      invite.data.reviewId = createdReview._id;
      invite.markModified('data');
      await invite.save();
    }

    await this.eventService.create({
      eventType: EVENT_TYPE.REVIEW_CREATED,
      data: {
        reviewId: createdReview._id,
        userId: deposit.owner,
        deposit: {
          title: deposit.title,
          _id: deposit._id,
        },
      },
    });
    const reviewDTO = plainToClassCustom(ReviewDTO, createdReview);
    reviewDTO.actions = this.authorizationService.getSubjectActions(user, review);
    return reviewDTO;
  }

  @Patch(':id')
  async updateReview(
    @Req() req: Request,
    @Body() payload: UpdateReviewDTO,
    @Param('id') id: string,
  ): Promise<ReviewDTO> {
    const auth0Profile = req.user as Auth0UserProfile;
    const review = await this.reviewService.findOne({
      _id: id,
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const user = await this.userService.findOne({ userId: auth0Profile.sub });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const ability = defineAbilityFor(user);
    canDo(ability, 'update', review);

    // If review is published then restrict the update
    if (review.status === REVIEW_STATUS.published) {
      const temp = new UpdatePublishedReviewDTO(payload);
      const errors = await validateOrReject(temp, { whitelist: true, forbidNonWhitelisted: true });
    }

    Object.assign(review, payload);
    const reviewUpdated = await review.save();
    const reviewDTO = plainToClassCustom(ReviewDTO, reviewUpdated, { groups: ['owner'] });
    reviewDTO.actions = this.authorizationService.getSubjectActions(user, review);
    return reviewDTO;
  }

  @Delete(':id')
  async deleteReview(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<ReviewDTO> {
    const auth0Profile = req.user as Auth0UserProfile;
    const review = await this.reviewService.findOne({ _id: id });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const user = await this.userService.findOne({ userId: auth0Profile.sub });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const ability = defineAbilityFor(user);
    canDo(ability, 'delete', review);

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
      const objectKey = `${review.deposit}/${review._id}/${review.file.filename}`;
      await this.storageService.delete(objectKey);
    }

    const reviewDeleted = await review.remove();
    return plainToClassCustom(ReviewDTO, reviewDeleted);
  }

  @Post(':id/file')
  async uploadFile(
    @Param('id') id: string,
    @Body() payload: CreateFileDTO,
    @Req() req: Request
  ): Promise<{ signedUrl: string }> {
    const review = await this.reviewService.findById(id);

    if (!review) {
      throw new UnauthorizedException('Review not found');
    }

    if (review.status !== REVIEW_STATUS.draft) {
      throw new UnauthorizedException('Review should be draft');
    }

    const file = payload.file;

    // File extension to lower case
    const fileExtension = extname(file.name).toLowerCase();
    const filename = file.name.toLowerCase();

    if (!ALLOWED_FILE_EXTENSIONS.includes(fileExtension)) {
      throw new UnauthorizedException('Invalid extension file');
    }

    const fileMetadata = {
      filename: filename,
      contentType: file.type,
      contentLength: file.size,
      tags: []
    };

    // Delete previous file if exist
    review.depopulate('deposit');
    if (review.file) {
      console.log('Delete existing file');
      const previousObjectKey = `${review.deposit}/${review._id}/${review.file.filename}`;
      await this.storageService.delete(previousObjectKey);
    }

    review.file = fileMetadata;

    const objectKey = `${review.deposit}/${review._id}/${review.file.filename}`;
    const params = {
      Key: objectKey
    };

    const signedUrl = this.storageService.getSignedUrl('putObject', params);

    await review.save();
    return { signedUrl };
  }

  // TODO filename parameter is unnecessary but file-list component (UI) uses it like when it is a publication file.
  @Get(':id/file/:filename')
  async getReviewFile(
    @Param('id') id: string,
    @Param('filename') filename: string,
    @Res() response: Response,
  ): Promise<unknown> {
    const review = await this.reviewService.findById(id);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (!review.file) {
      throw new NotFoundException('File not found');
    }

    if (review.status == REVIEW_STATUS.draft) {
      throw new UnauthorizedException('Review should not be draft');
    }

    review.depopulate('deposit');
    const objectKey = `${review.deposit}/${review._id}/${review.file.filename}`;
    const fileStream = this.storageService.get(objectKey);

    response.setHeader(
      'Content-Type',
      review.file.contentType,
    );

    return fileStream.pipe(response);
  }
}
