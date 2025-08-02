import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class DidKey extends Document {
  @Prop({ required: true, unique: true })
  _id: string; // This is the DID

  @Prop({ required: true })
  privateKey: string;
}

export const DidKeySchema = SchemaFactory.createForClass(DidKey);
DidKeySchema.set('collection', 'did_keypair');
