import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WalletKey } from './entities/wallet-key.entity';

@Injectable()
export class WalletsKeyService {
  constructor(
    @InjectModel(WalletKey.name) private walletKeyModel: Model<WalletKey>,
  ) {}

  async saveKey(data: { owner: string; type: 'user' | 'agent'; accountId: string; privateKey: string }) {
    return this.walletKeyModel.create(data);
  }

  async getKeyByAccountId(accountId: string): Promise<WalletKey | null> {
    return this.walletKeyModel.findOne({ accountId });
  }
}
