import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommunitiesService } from './communities.service';
import { CommunityDocument, CommunitySchema } from './communities.schema';
import { CommunitiesController } from './communities.controller';
import { UsersModule } from '../users/users.module';
import { DepositModule } from '../deposit/deposit.module';
import { AuthorizationModule } from '../authorization/authorization.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CommunityDocument.name, schema: CommunitySchema }]),
    UsersModule,
    forwardRef(() => DepositModule),
    AuthorizationModule
  ],
  providers: [CommunitiesService],
  exports: [CommunitiesService],
  controllers: [CommunitiesController],
})

export class CommunitiesModule {
}
