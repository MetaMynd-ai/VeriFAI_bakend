import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DidKey } from './entities/did-key.entity';

@Injectable()
export class DidKeyService {
  constructor(
    @InjectModel(DidKey.name) private didKeyModel: Model<DidKey>,
  ) {}

  async getPrivateKeyByDid(did: string): Promise<string | null> {
    const record = await this.didKeyModel.findById(did);
    return record ? record.privateKey : null;
  }
}
