import { HttpModule, Module } from '@nestjs/common';
import { OrcidController } from './orcid.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    HttpModule
  ],
  controllers: [OrcidController]
})
export class OrcidModule {
}
