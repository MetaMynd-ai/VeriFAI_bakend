import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { Document } from 'mongoose';
import { IVC } from '../interfaces/ivc.namespace';
import { WalletTransaction } from './transaction.entity';

export type WalletDocument = Wallet & Document;

@Schema()
export class Wallet {
    @Prop({
        required: true,
        type: String,
        array: false
    })
    @ApiProperty()
    owner: string

    @Prop({
        required: true,
        enum: ['user', 'agent'],
        default: 'user',
        index: true
    })
    @ApiProperty({ description: 'Wallet type (user or agent)', enum: ['user', 'agent'], default: 'user' })
    type: 'user' | 'agent'

    @Prop({
        required: true,
        type: IVC.Wallet.Entity,
        array: false
    })
    @ApiProperty()
    account: IVC.Wallet.Entity
    
    @Prop([{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'WalletTransaction'        
    }])
    @ApiProperty({
        isArray: true,
        type: WalletTransaction
    })
    transactions: Array<WalletTransaction>
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
// Enforce unique user wallet per owner
WalletSchema.index({ owner: 1, type: 1 }, { unique: true, partialFilterExpression: { type: 'user' } });