import { Test, TestingModule } from '@nestjs/testing';
import { InstitutionController } from './institution.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { environment } from '../environments/environment';
import { EventModule } from '../event/event.module';
import { InstitutionModule } from './institution.module';
import { UsersModule } from '../users/users.module';

describe('Institution Controller', () => {
  let controller: InstitutionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InstitutionController],
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        EventModule,
        InstitutionModule,
        UsersModule
      ]
    }).compile();

    controller = module.get<InstitutionController>(InstitutionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
