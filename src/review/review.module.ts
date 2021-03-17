import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Review, ReviewSchema } from './review.schema';
import { DepositModule } from '../deposit/deposit.module';
import { UsersModule } from '../users/users.module';
import { EventModule } from '../event/event.module';
import { InviteModule } from '../invite/invite.module';
import { LocalStorageService } from '../local-storage.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }]),
    DepositModule,
    UsersModule,
    EventModule,
    InviteModule
  ],
  providers: [ReviewService, 
    {
      provide: 'IStorageService',
      useClass: LocalStorageService
    }
  ],
  controllers: [ReviewController],
  exports: [ReviewService]
})
export class ReviewModule {
}
