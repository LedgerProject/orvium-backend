import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { EventModule } from './event/event.module';
import { ConfigModule } from '@nestjs/config';
import { environment } from './environments/environment';
import { BlockchainModule } from './blockchain/blockchain.module';
import { FeedbackModule } from './feedback/feedback.module';
import { CommunitiesModule } from './communities/communities.module';
import { DepositModule } from './deposit/deposit.module';
import { NotificationModule } from './notification/notification.module';
import { ReviewModule } from './review/review.module';
import { AnonymousStrategy } from './anonymous.strategy';
import { InstitutionModule } from './institution/institution.module';
import { DisciplineModule } from './discipline/discipline.module';
import { DomainsModule } from './domains/domains.module';
import { InviteModule } from './invite/invite.module';
import { PushNotificationsModule } from './push-notifications/push-notifications.module';
import { DataciteModule } from './datacite/datacite.module';
import { EmailService } from './email/email.service';
import { CommonModule } from './common/common.module';
import { OrcidModule } from './orcid/orcid.module';
import { TemplateModule } from './template/template.module';

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
    UsersModule,
    EventModule,
    BlockchainModule,
    FeedbackModule,
    CommunitiesModule,
    DepositModule,
    NotificationModule,
    ReviewModule,
    InstitutionModule,
    DisciplineModule,
    DomainsModule,
    InviteModule,
    PushNotificationsModule,
    DataciteModule,
    CommonModule,
    OrcidModule,
    TemplateModule
  ],
  controllers: [AppController],
  providers: [AnonymousStrategy, EmailService],
})
export class AppModule {
}
