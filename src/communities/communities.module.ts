import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommunitiesService } from './communities.service';
import { Community, CommunitySchema } from './communities.schema';
import { CommunitiesController } from './communities.controller';
import { UsersModule } from '../users/users.module';
import { DepositModule } from '../deposit/deposit.module';
import { LocalStorageService } from '../local-storage.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Community.name, schema: CommunitySchema }]),
    UsersModule,
    DepositModule
  ],
  providers: [CommunitiesService,
    {
      provide: 'IStorageService',
      useClass: LocalStorageService
    }
  ],
  exports: [CommunitiesService],
  controllers: [CommunitiesController],
})

export class CommunitiesModule {
}
