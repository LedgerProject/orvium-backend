import { Test, TestingModule } from '@nestjs/testing';
import { ReviewService } from './review.service';
import { MongooseModule } from '@nestjs/mongoose';
import { environment } from '../environments/environment';
import { ReviewDocument, ReviewSchema } from './review.schema';

describe('ReviewService', () => {
  let service: ReviewService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        MongooseModule.forFeature([{ name: 'ReviewDocument', schema: ReviewSchema }]),
      ],
      providers: [ReviewService],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
