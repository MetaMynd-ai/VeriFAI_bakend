import { Module } from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { CredentialsController } from './credentials.controller';
import { SmartConfigModule } from '@hsuite/smart-config';
import { MongooseModule } from '@nestjs/mongoose';
import { IDCredential, IDCredentialSchema } from './entities/credential.entity';
import { WalletsModule } from 'src/wallets/wallets.module';
import { Identity, IdentitySchema } from '../entities/identity.entity';
import { IssuerAuthGuard } from './guards/issuer.guard';
import { APP_GUARD } from '@nestjs/core';
import { IDIssuer, IDIssuerSchema } from '../../issuers/entities/issuer.entity';
import { HttpModule } from '@nestjs/axios';
import { CypherModule } from 'src/cypher/cypher.module';

@Module({
  imports: [
    HttpModule,
    SmartConfigModule,
    WalletsModule,
    CypherModule,
    MongooseModule.forFeature([{ name: IDCredential.name, schema:IDCredentialSchema }]),
    MongooseModule.forFeature([{ name: IDIssuer.name, schema:IDIssuerSchema }]),
    MongooseModule.forFeature([{ name: Identity.name, schema:IdentitySchema }])
  ],
  controllers: [
    CredentialsController
  ],
  providers: [
    CredentialsService,
    {
      provide: APP_GUARD,
      useClass: IssuerAuthGuard
    }
  ],
  exports: [
    CredentialsService
  ]
})
export class CredentialsModule {}
