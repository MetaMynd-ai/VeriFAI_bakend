import { IAuth, Auth, IHedera } from "@hsuite/types"
import { WalletTransaction } from "../entities/transaction.entity"
import { ApiProperty } from "@nestjs/swagger"

// NAMESPACE FOR INTERFACES
export namespace I_IVC {
    export namespace IWallet {
        export interface IEntity {
            id: string
            balance: IHedera.IAccountBalance
        }

        export interface IHistory extends I_IVC.IWallet.IEntity {
            transactions: Array<WalletTransaction>
        }

        export namespace IRequest {
            export interface IWithdrawToken {
                id: string
                decimals: number
            }

            export interface IWithdraw extends IAuth.ITwoFactor.ISecurity {
                userId: string
                amount: number
                wallet: string
                token: I_IVC.IWallet.IRequest.IWithdrawToken
            }

            export interface ICreate {
                userId: string
            }

            export interface IAssociate {
                walletId: string
                tokenId: string                
            }

            export interface IDelete {
                transferAccountId: string
            }
        }

        export namespace IResponse {
            export enum IWthdrawStatus {
                PENDING = 'pending',
                PROCESSING = 'processing',
                COMPLETED = 'completed',
                REJECTED = 'rejected'
            }

            export interface IWithdraw {
                amount: number
                date: number
                transactionId: string
                status: IWthdrawStatus
            }
        }
    }
}

// NAMESPACE FOR CLASSES
export namespace IVC {
    export namespace Wallet {
        export class Entity implements I_IVC.IWallet.IEntity {
            @ApiProperty({
                type: String,
                description: 'The wallet ID'
            })
            id: string

            @ApiProperty({
                type: Object,
                description: 'The balance of the wallet'
            })
            balance: IHedera.IAccountBalance
        }

        export class History extends IVC.Wallet.Entity implements I_IVC.IWallet.IHistory {
            @ApiProperty({
                isArray: true,
                type: WalletTransaction,
                description: 'The transactions of the wallet'
            })
            transactions: Array<WalletTransaction>
        }

        export namespace Request {
            export class WithdrawToken implements I_IVC.IWallet.IRequest.IWithdrawToken {
                @ApiProperty({
                    type: String,
                    description: 'The token ID'
                })
                id: string

                @ApiProperty({
                    type: Number,
                    description: 'The decimals of the token'
                })
                decimals: number
            }

            export class Withdraw extends Auth.TwoFactor.Security implements I_IVC.IWallet.IRequest.IWithdraw {
                @ApiProperty({
                    type: String,
                    description: 'The user ID'
                })
                userId: string

                @ApiProperty({
                    type: Number,
                    description: 'The amount of the withdraw'
                })
                amount: number

                @ApiProperty({
                    type: String,
                    description: 'The wallet ID'
                })
                wallet: string

                @ApiProperty({
                    type: WithdrawToken,
                    description: 'The token of the withdraw'
                })
                token: IVC.Wallet.Request.WithdrawToken
            }

            export class Create implements I_IVC.IWallet.IRequest.ICreate {
                @ApiProperty({
                    type: String,
                    description: 'The user ID'
                })
                userId: string
            }

            export class Associate implements I_IVC.IWallet.IRequest.IAssociate {
                @ApiProperty({
                    type: String,
                    description: 'The wallet ID'
                })
                walletId: string

                @ApiProperty({
                    type: String,
                    description: 'The token ID'
                })
                tokenId: string                
            }

            export class Delete implements I_IVC.IWallet.IRequest.IDelete {
                @ApiProperty({
                    type: String,
                    description: 'The transfer account ID'
                })
                transferAccountId: string
            }
        }

        export namespace Response {
            export class Withdraw implements I_IVC.IWallet.IResponse.IWithdraw {
                @ApiProperty({
                    type: Number,
                    description: 'The amount of the withdraw'
                })
                amount: number

                @ApiProperty({
                    type: Number,
                    description: 'The date of the withdraw'
                })
                date: number

                @ApiProperty({
                    type: String,
                    description: 'The transaction ID of the withdraw'
                })
                transactionId: string

                @ApiProperty({
                    type: String,
                    enum: I_IVC.IWallet.IResponse.IWthdrawStatus,
                    description: 'The status of the withdraw'
                })
                status: I_IVC.IWallet.IResponse.IWthdrawStatus
            }
        }
    }
}