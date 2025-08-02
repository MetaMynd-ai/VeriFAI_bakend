import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WalletKey, WalletKeySchema } from './entities/wallet-key.entity';
import { WalletsKeyService } from './wallets-key.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: WalletKey.name, schema: WalletKeySchema }])],
  providers: [WalletsKeyService],
  exports: [WalletsKeyService],
})
export class WalletsKeyModule {}
