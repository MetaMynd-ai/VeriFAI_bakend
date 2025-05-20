import { ApiProperty } from "@nestjs/swagger"

export interface IIssuerPayload {
    issuer: string
    nftID: string
    imageCID: string
}

export class IssuerPayload implements IIssuerPayload {
    @ApiProperty({
        type: String,
        description: 'The Issuser Name'
    })
    issuer: string

    @ApiProperty({
        type: String,
        description: 'The Issuer nftID'
    })
    nftID: string

    @ApiProperty({
        type: String,
        description: 'The Issuer imageCID'
    })
    imageCID: string

    constructor(
        issuer: string,
        nftID: string,
        imageCID: string
    ) {
        this.issuer = issuer
        this.nftID = nftID
        this.imageCID = imageCID
    }
}