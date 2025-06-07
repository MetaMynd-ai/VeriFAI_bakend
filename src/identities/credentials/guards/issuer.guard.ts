import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { CredentialsService } from '../credentials.service';
import { IS_PUBLIC_KEY } from '@hsuite/decorators';
import { Reflector } from '@nestjs/core';
import { User } from 'src/auth/entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class IssuerAuthGuard implements CanActivate {
  constructor(
    private credentialsService: CredentialsService,
    private reflector: Reflector,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    return true
  }
}
