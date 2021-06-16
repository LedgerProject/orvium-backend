import { forwardRef, HttpModule, Module } from '@nestjs/common';
import { DepositService } from './deposit.service';
import { MongooseModule } from '@nestjs/mongoose';
import { DepositDocument, DepositSchema } from './deposit.schema';
import { DepositController } from './deposit.controller';
import { UsersModule } from '../users/users.module';
import { EventModule } from '../event/event.module';
import { DataciteModule } from '../datacite/datacite.module';
import { CommunitiesModule } from '../communities/communities.module';
import { CommonModule } from '../common/common.module';
import { AuthorizationModule } from '../authorization/authorization.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: DepositDocument.name, schema: DepositSchema }]),
    UsersModule,
    EventModule,
    DataciteModule,
    forwardRef(() => CommunitiesModule),
    CommonModule,
    HttpModule,
    AuthorizationModule,
  ],
  providers: [DepositService],
  exports: [DepositService],
  controllers: [DepositController],
})
export class DepositModule {
}
