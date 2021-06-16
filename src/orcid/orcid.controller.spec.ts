import { Test, TestingModule } from '@nestjs/testing';
import { OrcidController } from './orcid.controller';
import { UsersModule } from '../users/users.module';
import { HttpModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { environment } from '../environments/environment';

describe('OrcidController', () => {
  let controller: OrcidController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        UsersModule,
        HttpModule
      ],
      controllers: [OrcidController],
    }).compile();

    controller = module.get<OrcidController>(OrcidController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
