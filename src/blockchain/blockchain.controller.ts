import { Controller, Get } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { BlockchainNetworkDTO } from './blockchain.schema';
import { plainToClass } from 'class-transformer';

@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly blochainService: BlockchainService) {
  }

  @Get()
  async findAll(): Promise<BlockchainNetworkDTO[]> {
    const blockchainNetworks = await this.blochainService.find({});
    return plainToClass(BlockchainNetworkDTO, blockchainNetworks);
  }
}
