import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export enum IDCredentialStatus {
    PENDING = 'pending',
    MINTED = 'minted',
    BURNED = 'burned',
    DELIVERED = 'delivered',
    ACTIVE = "active",
    RESUMED = "resumed",
    SUSPENDED = "suspended",
    REVOKED = "revoked",
    EXPIRED = "expired"
}

export enum ChainVCStatus {
    ACTIVE = "active",
    RESUMED = "resumed",
    SUSPENDED = "suspended",
    REVOKED = "revoked",
    EXPIRED = "expired"
  }

export type IDCredentialDocument = IDCredential & Document;

@Schema({
    timestamps: true,
    collection: 'did_credentials'
})
export class IDCredential {
    @Prop({
        required: true,
        type: String,
        array: false
    })
    @ApiProperty({
        required: true,
        type: String,
        description: 'The owner of the VC'
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
        description: 'The issuer of the VC'
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
        description: 'The VC FileID'
    })
    file_id: string

    @Prop({
        required: true,
        type: Number,
        array: false
    })
    @ApiProperty({
        required: true,
        type: Number,
        description: 'The VC FileIndex'
    })
    file_index: number

    @Prop({
        required: true,
        type: String,
        array: false
    })
    @ApiProperty({
        required: true,
        type: String,
        description: 'The serial number'
    })
    serial_number: string

    @Prop({
        required: false,
        type: String,
        array: false
    })
    @ApiProperty({
        required: true,
        type: String,
        description: 'The iv of the encrypted metadata'
    })
    iv: string    

    @Prop({
        required: true,
        type: String,
        enum: IDCredentialStatus,
        array: false
    })
    @ApiProperty({
        required: true,
        type: String,
        enum: IDCredentialStatus,
        description: 'The internal status of the VC'
    })
    internal_status: string

    @Prop({
        required: true,
        type: String,
        enum: ChainVCStatus,
        array: false
    })
    @ApiProperty({
        required: true,
        type: String,
        enum: ChainVCStatus,
        description: 'The on-chain status of the VC'
    })
    chain_status: string

    @Prop({
        required: true,
        type: Date
    })
    @ApiProperty({
        required: true,
        type: Date,
        description: 'The expiration of the VC'
    })
    expiration_date: Date
}

export const IDCredentialSchema = SchemaFactory.createForClass(IDCredential);