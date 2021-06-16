import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class BlockchainNetworkDTO {
  @Expose() name!: string;
  @Expose() displayName!: string;
  @Expose() networkId!: number;
  @Expose() appAddress!: string;
  @Expose() escrowAddress!: string;
  @Expose() tokenAddress!: string;
  @Expose() explorerUrl!: string;
}
