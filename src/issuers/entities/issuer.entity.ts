import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export enum IDIssuerStatus {
    PENDING = 'pending',
    MINTED = 'minted',
    DELIVERED = 'delivered',
    ACTIVE = 'active'
}

export type IDIssuerDocument = IDIssuer & Document;

@Schema({
    timestamps: true,
    collection: 'did_issuers'
})
export class IDIssuer {
    @Prop({
        required: true,
        type: String,
        array: false
    })
    @ApiProperty({
        required: true,
        type: String,
        description: 'The UserID of the VC owner'
    })
    owner: string

    @Prop({
        required: true,
        type: String,
        array: false
    })
    @ApiProperty({
        required: true,
        type: String,
        description: 'The Issuser NAme'
    })
    issuer: string

    @Prop({
        required: true,
        type: String,
        array: false
    })
    @ApiProperty({
        required: true,
        type: String,
        description: 'The Issuer DID'
    })
    did_id: string

    @Prop({
        required: true,
        type: String,
        array: false
    })
    @ApiProperty({
        required: true,
        type: String,
        description: 'The Issuer nftID'
    })
    nftID: string

    @Prop({
        required: true,
        type: String,
        array: false
    })
    @ApiProperty({
        required: true,
        type: String,
        description: 'The Issuer imageCID'
    })
    imageCID: string
}

export const IDIssuerSchema = SchemaFactory.createForClass(IDIssuer);
IDIssuerSchema.index({ owner: 1, issuer: 1 }, { unique: true });