import { forwardRef, Module } from '@nestjs/common';
import { InstitutionService } from './institution.service';
import { InstitutionController } from './institution.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { InstitutionDocument, InstitutionSchema } from './institution.schema';
import { EventModule } from '../event/event.module';
import { UsersModule } from '../users/users.module';

@Module({
  providers: [InstitutionService],
  controllers: [InstitutionController],
  imports: [
    MongooseModule.forFeature([{ name: InstitutionDocument.name, schema: InstitutionSchema }]),
    EventModule,
    forwardRef(() => UsersModule)
  ],
  exports: [InstitutionService]
})
export class InstitutionModule {
}
