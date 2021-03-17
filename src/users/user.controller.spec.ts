import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { EventModule } from '../event/event.module';
import { UsersModule } from './users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { environment } from '../environments/environment';
import { HttpModule } from '@nestjs/common';
import { InstitutionModule } from '../institution/institution.module';

describe('User Controller', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        HttpModule,
        UsersModule,
        EventModule,
        InstitutionModule,
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
