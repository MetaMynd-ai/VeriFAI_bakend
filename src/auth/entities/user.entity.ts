import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export class Tag {
  @ApiProperty() key: string;
  @ApiProperty() value: string;
}

export class TwoFactorAuth {
  @ApiProperty({ default: 'disabled' }) status: string;
  @ApiProperty({ default: '' }) factorSid: string;
  @ApiProperty({ default: '' }) identity: string;
  @ApiProperty({ default: '' }) qr_code: string;
}

@Schema({ timestamps: true })
export class User extends Document {
  
  @ApiProperty() @Prop({ required: true, unique: true }) email: string;
  @ApiProperty() @Prop({ required: true, unique: true }) username: string;
  @ApiProperty() @Prop({ required: true }) password: string; // hashed
  @ApiProperty() @Prop({ default: false }) confirmed: boolean;
  @ApiProperty() @Prop({ default: 'web2' }) type: string;
  @ApiProperty() @Prop({ default: 'user' }) role: string;
  @ApiProperty() @Prop({ default: false }) banned: boolean;
  @ApiProperty({ type: [Tag], required: false })
  @Prop({ type: [Tag], required: false })
  tags?: Tag[];
  @ApiProperty({ type: () => TwoFactorAuth })
  @Prop({ type: TwoFactorAuth, default: () => ({ status: 'disabled', factorSid: '', identity: '', qr_code: '' }) })
  twoFactorAuth: TwoFactorAuth;
  @ApiProperty() @Prop() created_at: string;
  @ApiProperty() @Prop() updated_at: string;
  @ApiProperty() @Prop({ type: String, required: false, select: false }) currentHashedRefreshToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.set('collection', 'users');
