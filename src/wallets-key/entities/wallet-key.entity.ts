import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class WalletKey extends Document {
  @Prop({ required: true })
  owner: string;

  @Prop({ required: true, enum: ['user', 'agent'] })
  type: 'user' | 'agent';

  @Prop({ required: true, unique: true })
  accountId: string;

  @Prop({ required: true })
  privateKey: string;
}

export const WalletKeySchema = SchemaFactory.createForClass(WalletKey);
