import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LocalStorageService } from './local-storage.service';

@Module({
  providers: [LocalStorageService],
  exports: [LocalStorageService],
  imports: [ConfigModule]
})
export class CommonModule {
}
