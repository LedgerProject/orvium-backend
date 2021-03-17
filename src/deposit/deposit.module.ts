import { Module } from '@nestjs/common';
import { DepositService } from './deposit.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Deposit, DepositSchema } from './deposit.schema';
import { DepositController } from './deposit.controller';
import { UsersModule } from '../users/users.module';
import { EventModule } from '../event/event.module';
import { LocalStorageService } from '../local-storage.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Deposit.name, schema: DepositSchema }]),
    UsersModule,
    EventModule,
  ],
  providers: [DepositService, 
    {
      provide: 'IStorageService',
      useClass: LocalStorageService
    }
  ],
  exports: [DepositService],
  controllers: [DepositController],
})
export class DepositModule {
}
