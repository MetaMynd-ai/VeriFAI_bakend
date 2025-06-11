import { IS_PUBLIC_KEY } from '@hsuite/decorators';
import { Injectable, ExecutionContext, CanActivate, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { AuthGuard } from '@nestjs/passport';
import { Model } from 'mongoose';
import { User } from 'src/auth/entities/user.entity';


@Injectable()
export class GlobalAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private reflector: Reflector,
    @InjectModel(User.name) private userModel: Model<User>,) {
    console.log('GlobalAuthGuard: Constructed');
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
   
    const request = context.switchToHttp().getRequest();
    // check if the request is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
   
    console.log('GlobalAuthGuard: Route  ', context.getHandler().name );
   
    if (isPublic) {
      console.log('GlobalAuthGuard canActivate called for public route with ', request.method, ' method');
      return true;
    }

    // Perform JWT authentication.
    // super.canActivate(context) will call the JWT strategy.
    // If authentication fails (e.g., no token, invalid token), it will throw an UnauthorizedException.
    // If successful, request.user will be populated with the payload returned by the JWT strategy's validate() method.
    await super.canActivate(context);

    // If super.canActivate(context) did not throw, authentication was successful.
    // request.user now contains the JWT payload.
    // Ensure your JWT strategy's validate function returns an object containing the user ID.
    // Common property names for user ID in JWT payload are 'sub', 'id', or 'userId'.
    // Adjust 'request.user.userId' below to match the property name in your JWT payload.
    if (!request.user || !request.user._id) { 
      // For example, if your JWT payload uses 'sub' for user ID, change to: !request.user.sub
      throw new UnauthorizedException('User identifier not found in JWT payload. Ensure your JWT strategy returns it as _id.');
    }

    const userFromDb = await this.userModel.findOne({
      // Adjust 'request.user.userId' to match the property name for user ID in your JWT payload.
      // e.g., if JWT payload has { sub: 'actual_user_id' }, use request.user.sub
      _id: request.user._id 
    });

    if (!userFromDb) {
      throw new UnauthorizedException('User not found in database.');
    }
    
    // Remove password before attaching user to request
    const { password, ...safeUser } = userFromDb.toObject ? userFromDb.toObject() : userFromDb;
    request.user = safeUser; // Replace JWT payload in request.user with the full, fresh user object from DB

    // Updated log message
    console.log('GlobalAuthGuard canActivate successful for user ID: ' + request.user._id);

    // Existing role checks can proceed using request.user.role, etc.
    // if(!['admin', 'issuer','user'].includes(request.user.role)) {
    //   throw new UnauthorizedException('Sorry, only admin or issuer can issue a VC.');
    // }

    // if(request.user.role === 'issuer') {
    //   try {
    //     await this.credentialsService.getIssuerForOwner(request.user._id);
    //   } catch(error) {
    //       throw new UnauthorizedException(error.message);
    //   }
    // }

    return true;
  }


}

