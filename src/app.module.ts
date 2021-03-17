import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { EventModule } from './event/event.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { environment } from './environments/environment';
import { BlockchainModule } from './blockchain/blockchain.module';
import { CommunitiesModule } from './communities/communities.module';
import { DepositModule } from './deposit/deposit.module';
import { NotificationModule } from './notification/notification.module';
import { ReviewModule } from './review/review.module';
import { InstitutionModule } from './institution/institution.module';
import { DisciplineModule } from './discipline/discipline.module';
import { DomainsModule } from './domains/domains.module';
import { InviteModule } from './invite/invite.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(environment.mongoUri,
      {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true
      }),
    ScheduleModule.forRoot(),
    UsersModule,
    EventModule,
    BlockchainModule,
    CommunitiesModule,
    DepositModule,
    NotificationModule,
    ReviewModule,
    InstitutionModule,
    DisciplineModule,
    DomainsModule,
    InviteModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
}
