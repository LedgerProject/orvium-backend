import { Module } from '@nestjs/common';
import { InviteService } from './invite.service';
import { InviteController } from './invite.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { Invite, InviteSchema } from './invite.schema';
import { DepositModule } from '../deposit/deposit.module';
import { EventModule } from '../event/event.module';
import { LocalStorageService } from '../local-storage.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Invite.name, schema: InviteSchema }]),
    UsersModule,
    DepositModule,
    EventModule
  ],
  providers: [InviteService, 
    {
      provide: 'IStorageService',
      useClass: LocalStorageService
    }
  ],
  exports: [InviteService],
  controllers: [InviteController]
})
export class InviteModule {
}
