import { Controller, Get, Param } from '@nestjs/common';
import { DomainsService } from './domains.service';
import { Domain } from './domains.schema';

@Controller('domains')
export class DomainsController {
  constructor(private readonly domainService: DomainsService) {
  }

  @Get('')
  async getDomains(): Promise<Domain[]> {
    return await this.domainService.find({});
  }

  @Get(':domain')
  async getDomain(
    @Param('domain') domain: string): Promise<Domain | null> {
    return await this.domainService.findOne({ emailDomain: domain });
  }

}
