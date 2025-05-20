import { Module } from '@nestjs/common';
import { IdentitiesService } from './identities.service';
import { IdentitiesController } from './identities.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Identity, IdentitySchema } from './entities/identity.entity';
import { WalletsModule } from 'src/wallets/wallets.module';
import { CredentialsModule } from './credentials/credentials.module';
import { RouterModule } from '@nestjs/core';

@Module({
  imports: [
    WalletsModule,
    CredentialsModule,
    RouterModule.register([
      {
        path: 'identities',
        module: IdentitiesModule,
        children: [
          {
            path: 'credentials',
            module: CredentialsModule
          },
        ]
      }
    ]),
    MongooseModule.forFeature([{ name: Identity.name, schema:IdentitySchema }])
  ],
  controllers: [IdentitiesController],
  providers: [IdentitiesService],
  exports: [IdentitiesService]
})
export class IdentitiesModule {}
