import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { DomainsService } from './domains.service';
import { DomainDTO } from '../dtos/domain.dto';
import { plainToClassCustom } from '../utils/transformer';

@Controller('domains')
export class DomainsController {
  constructor(private readonly domainService: DomainsService) {
  }

  @Get('')
  async getDomains(): Promise<DomainDTO[]> {
    const domains = await this.domainService.find({});
    return plainToClassCustom(DomainDTO, domains);
  }

  @Get(':domain')
  async getDomain(
    @Param('domain') domain: string): Promise<DomainDTO | null> {
    const domainResult = await this.domainService.findOne({ emailDomain: domain });
    if (!domainResult) {
      throw new NotFoundException('Domain not found');
    }
    return plainToClassCustom(DomainDTO, domainResult);
  }

}
