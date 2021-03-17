import { Test, TestingModule } from '@nestjs/testing';
import { DomainsController } from './domains.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { environment } from '../environments/environment';
import { DomainsModule } from './domains.module';

describe('Domains Controller', () => {
  let controller: DomainsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        DomainsModule,
      ],
      controllers: [DomainsController],
    }).compile();

    controller = module.get<DomainsController>(DomainsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
