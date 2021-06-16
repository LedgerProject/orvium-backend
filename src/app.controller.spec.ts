import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { UsersModule } from './users/users.module';
import { EventModule } from './event/event.module';
import { MongooseModule } from '@nestjs/mongoose';
import { environment } from './environments/environment';
import { BlockchainModule } from './blockchain/blockchain.module';
import { NotificationModule } from './notification/notification.module';
import { CommonModule } from './common/common.module';
import { DataciteModule } from './datacite/datacite.module';
import { TemplateModule } from './template/template.module';
import { ConfigModule } from '@nestjs/config';
import * as Joi from '@hapi/joi';
import { InviteModule } from './invite/invite.module';
import { OrcidModule } from './orcid/orcid.module';
import { ReviewModule } from './review/review.module';
import { DepositModule } from './deposit/deposit.module';
import { AppModule } from './app.module';
import { LocalStorageService } from './common/local-storage.service';

describe('App Controller', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: LocalStorageService, useValue: {} }
      ],
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          validationSchema: Joi.object({
            S3_FILES_BUCKET: Joi.string().empty('').default('fake-bucket'),
          }),
        }),
        UsersModule,
        EventModule,
        BlockchainModule,
        NotificationModule,
        CommonModule,
        DataciteModule,
        TemplateModule,
        InviteModule,
        OrcidModule,
        ReviewModule,
        DepositModule,
        AppModule
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
