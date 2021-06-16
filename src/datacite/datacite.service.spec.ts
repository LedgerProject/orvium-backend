import { Test, TestingModule } from '@nestjs/testing';
import { DataciteService } from './datacite.service';
import { HttpModule } from '@nestjs/common';

describe('DataciteService', () => {
  let service: DataciteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule
      ],
      providers: [DataciteService],
    }).compile();

    service = module.get<DataciteService>(DataciteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
