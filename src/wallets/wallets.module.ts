import { forwardRef, Module } from '@nestjs/common'
import { WalletsService } from './wallets.service'
import { WalletsController } from './wallets.controller'
import { MongooseModule } from '@nestjs/mongoose'
import { Wallet, WalletSchema } from './entities/wallet.entity'
import { WalletTransaction, WalletTransactionSchema } from './entities/transaction.entity'
import { SmartConfigModule } from '@hsuite/smart-config'
import { IpfsResolverModule } from '@hsuite/ipfs-resolver'
import { IDIssuer, IDIssuerSchema } from 'src/issuers/entities/issuer.entity'
import { IDCredential, IDCredentialSchema } from 'src/identities/credentials/entities/credential.entity'
import { CypherModule } from 'src/cypher/cypher.module'
import { WalletsKeyModule } from '../wallets-key/wallets-key.module'
import { IdentitiesModule } from 'src/identities/identities.module'
import { AgentProfileModule } from 'src/agent-profile/agent-profile.module' // Import AgentProfileModule

@Module({
  imports: [
    IpfsResolverModule,
    SmartConfigModule,
    CypherModule,
    MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }]),
    MongooseModule.forFeature([{ name: WalletTransaction.name, schema: WalletTransactionSchema }]),
    MongooseModule.forFeature([{ name: IDIssuer.name, schema: IDIssuerSchema }]),
    MongooseModule.forFeature([{ name: IDCredential.name, schema: IDCredentialSchema }]),
    forwardRef(() => WalletsKeyModule), // Forward reference to avoid circular dependency
    forwardRef(() => IdentitiesModule), // Forward reference to avoid circular dependency
    forwardRef(() => AgentProfileModule), // Add AgentProfileModule to imports
  ],
  controllers: [
    WalletsController
  ],
  providers: [
    WalletsService
  ],
  exports: [
    WalletsService
  ]
})
export class WalletsModule {}
