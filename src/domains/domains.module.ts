import { Module } from '@nestjs/common';
import { DomainsService } from './domains.service';
import { DomainsController } from './domains.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { DomainDocument, DomainSchema } from './domains.schema';

@Module({
  providers: [DomainsService],
  controllers: [DomainsController],
  imports: [
    MongooseModule.forFeature([{ name: DomainDocument.name, schema: DomainSchema }]),
  ],
  exports: [DomainsService]
})
export class DomainsModule {
}
