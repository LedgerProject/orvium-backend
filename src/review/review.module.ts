import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewDocument, ReviewSchema } from './review.schema';
import { DepositModule } from '../deposit/deposit.module';
import { UsersModule } from '../users/users.module';
import { EventModule } from '../event/event.module';
import { InviteModule } from '../invite/invite.module';
import { CommonModule } from '../common/common.module';
import { AuthorizationModule } from '../authorization/authorization.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ReviewDocument.name, schema: ReviewSchema }]),
    DepositModule,
    UsersModule,
    EventModule,
    InviteModule,
    CommonModule,
    AuthorizationModule
  ],
  providers: [ReviewService],
  controllers: [ReviewController],
  exports: [ReviewService]
})
export class ReviewModule {
}
