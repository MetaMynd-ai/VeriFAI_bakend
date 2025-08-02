import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'rejected';
export type WalletTransactionDocument = WalletTransaction & Document;

@Schema()
export class WalletTransaction {
    @Prop({
        required: true,
        type: String,
        array: false
    })
    @ApiProperty()
    from: string

    @Prop({
        required: true,
        type: String,
        array: false
    })
    @ApiProperty()
    to: string

    @Prop({
        required: true,
        type: Number,
        array: false
    })
    @ApiProperty()
    amount: number  
    
    @Prop({
        required: true,
        type: String,
        array: false
    })
    @ApiProperty()
    memo: string

    @Prop({
        required: true,
        type: String,
        array: false
    })
    @ApiProperty()
    date: string

    @Prop({
        required: true,
        type: String,
        array: false
    })
    @ApiProperty()
    transaction_id: string

    @Prop({
        required: true,
        type: String,
        array: false
    })
    @ApiProperty()
    status: TransactionStatus
}

export const WalletTransactionSchema = SchemaFactory.createForClass(WalletTransaction);