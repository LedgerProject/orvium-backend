import { Controller, Get, Query } from '@nestjs/common';
import { InstitutionService } from './institution.service';
import { Institution } from './institution.schema';

@Controller('institutions')
export class InstitutionController {
  constructor(
    private readonly institutionService: InstitutionService,
  ) {
  }

  @Get('')
  async getInstitution(
    @Query('domain') domain: string,
  ): Promise<Institution | null> {
    return await this.institutionService.findOne({ domain: domain });
  }
}
