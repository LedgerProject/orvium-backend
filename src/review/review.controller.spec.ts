import { Test, TestingModule } from '@nestjs/testing';
import { ReviewController } from './review.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { environment } from '../environments/environment';
import { ReviewService } from './review.service';
import { Review, ReviewSchema } from './review.schema';
import { of } from 'rxjs';
import * as mongoose from 'mongoose';
import { DepositModule } from '../deposit/deposit.module';
import { UsersModule } from '../users/users.module';
import { EventModule } from '../event/event.module';
import { ReviewModule } from './review.module';
import { InviteModule } from '../invite/invite.module';
import { LocalStorageService } from '../local-storage.service';


describe('Review Controller', () => {
  let controller: ReviewController;
  let service: ReviewService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        InviteModule,
        ReviewModule,
        DepositModule,
        UsersModule,
        EventModule,
      ],
      providers: [
        {
          provide: 'IStorageService',
          useClass: LocalStorageService
        }
      ],
      controllers: [ReviewController],
    }).compile();

    controller = module.get<ReviewController>(ReviewController);
    service = module.get<ReviewService>(ReviewService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get review file', async () => {
    const reviewModel = mongoose.model<Review>(Review.name, ReviewSchema);
    const review = new reviewModel({
      _id: 'reviewTest',
      deposit: 'depositTest',
      file: {
        filename: 'myfile',
        contentType: 'text/plain',
      },
    });

    jest.spyOn(service, 'findById').mockImplementation(() => of(review).toPromise());
    const s3Object = `${review.deposit}/${review._id}/${review.file?.filename}`;
  });
});
