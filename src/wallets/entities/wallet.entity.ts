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
        array: false,
        unique: true
    })
    @ApiProperty()
    owner: string

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