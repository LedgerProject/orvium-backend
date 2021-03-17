import { Module } from '@nestjs/common';
import { InstitutionService } from './institution.service';
import { InstitutionController } from './institution.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Institution, InstitutionSchema } from './institution.schema';

@Module({
  providers: [InstitutionService],
  controllers: [InstitutionController],
  imports: [
    MongooseModule.forFeature([{ name: Institution.name, schema: InstitutionSchema }]),
  ],
  exports: [InstitutionService]
})
export class InstitutionModule {
}
