import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { Document } from 'mongoose';
import { IDCredential } from '../credentials/entities/credential.entity';

export type IdentityDocument = Identity & Document;

@Schema({
    timestamps: true,
    collection: 'did_identities'
})
export class Identity {
    @Prop({
        required: true,
        type: String,
        array: false
    })
    @ApiProperty({
        required: true,
        type: String,
        description: 'The owner of the identity'
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
        description: 'The DID ID'
    })
    did_id: string

    @Prop([{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'IDCredential'        
    }])
    @ApiProperty({
        isArray: true,
        type: IDCredential
    })
    credentials: Array<IDCredential>
}

export const IdentitySchema = SchemaFactory.createForClass(Identity);