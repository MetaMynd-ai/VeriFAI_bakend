import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config'; // Import ConfigService

@Injectable()
export class Auth3Service {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private configService: ConfigService, // Inject ConfigService
  ) {}

  private async getTokens(id: string, username: string, role: string) { // Changed second param name to 'username' for clarity
    const accessTokenPayload = { sub: id, username, role }; // Use 'username' in payload
    const refreshTokenPayload = { sub: id, username }; // Use 'username' in refresh token payload

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, {
        secret: this.configService.get<string>('auth.commonOptions.jwt.secret'),
        expiresIn: this.configService.get<string>('auth.commonOptions.jwt.signOptions.expiresIn'),
      }),
      this.jwtService.signAsync(refreshTokenPayload, {
        secret: this.configService.get<string>('auth.commonOptions.jwtRefresh.secret'),
        expiresIn: this.configService.get<string>('auth.commonOptions.jwtRefresh.signOptions.expiresIn'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async updateRefreshToken( id: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userModel.updateOne({ _id: id }, {
      currentHashedRefreshToken: hashedRefreshToken,
    });
  }

  async login(userFromValidation: User): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    if (!userFromValidation) {
        throw new UnauthorizedException('User not validated for login.');
    }
    // userFromValidation is the validated user object from DB, it will have 'username' and 'role'
    const tokens = await this.getTokens(userFromValidation._id.toString(), userFromValidation.username, userFromValidation.role);
    await this.updateRefreshToken(userFromValidation._id.toString(), tokens.refreshToken);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, currentHashedRefreshToken, ...userResult } = userFromValidation.toObject ? userFromValidation.toObject() : userFromValidation;


    return {
      ...tokens,
      user: userResult as User,
    };
  }

  async refreshTokens(userId: string, refreshTokenFromCookie: string): Promise<{ accessToken: string; newRefreshToken: string }> {
    const user = await this.userModel.findById(userId).select('+currentHashedRefreshToken');
    if (!user || !user.currentHashedRefreshToken) {
      throw new ForbiddenException('Access Denied: No refresh token stored.');
    }

    const isRefreshTokenMatching = await bcrypt.compare(
      refreshTokenFromCookie,
      user.currentHashedRefreshToken,
    );

    if (!isRefreshTokenMatching) {
      throw new ForbiddenException('Access Denied: Refresh token mismatch.');
    }

    // user is the validated user object from DB, it will have 'username' and 'role'
    const newTokens = await this.getTokens(user._id.toString(), user.username, user.role);
    await this.updateRefreshToken(user._id.toString(), newTokens.refreshToken);

    return { accessToken: newTokens.accessToken, newRefreshToken: newTokens.refreshToken };
  }
  
  async logout(id: string): Promise<{ success: boolean; message: string }> {
    await this.userModel.updateOne({ _id: id }, { currentHashedRefreshToken: null });
    return { success: true, message: 'Logged out successfully. Refresh token invalidated.' };
  }

  async profile(user: any) {
    console.log('Fetching user profile from JWT:', user);
    return user;
  }

  async register(credentials: RegisterDto): Promise<any> {
    const existing = await this.userModel.findOne({
      $or: [{ email: credentials.email }, { username: credentials.username }],
    });
    if (existing) {
      throw new Error('User with this email or username already exists.');
    }
    const hashedPassword = await bcrypt.hash(credentials.password, 10);
    const now = Date.now().toString();
    const user = new this.userModel({
      ...credentials,
      password: hashedPassword,
      confirmed: false,
      type: 'web2',
      role: 'user',
      banned: false,
      twoFactorAuth: {
        status: 'disabled',
        factorSid: '',
        identity: '',
        qr_code: '',
      },
      created_at: now,
      updated_at: now,
    });
    const saved = await user.save();
    const { password, ...safeUser } = saved.toObject();
    return safeUser;
  }

  async validateUser(credentials: LoginDto): Promise<any> {
    const { email_or_username, password: inputPassword } = credentials;
    let userQuery: any = {};

    if (!email_or_username || !inputPassword) {
        return null; // Should be caught by DTO validation or strategy
    }

    // Simple check to differentiate email from username
    // You might want a more robust regex for email validation if needed
    const isEmail = email_or_username.includes('@'); 

    if (isEmail) {
      userQuery.email = email_or_username;
    } else {
      userQuery.username = email_or_username;
    }

    const user = await this.userModel
      .findOne(userQuery)
      .select('+password');

    if (user && (await bcrypt.compare(inputPassword, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user.toObject ? user.toObject() : user;
      return result; // This result object contains both user.username and user.email
    }
    return null;
  }

  async passwordRecoveryRequest(email: string): Promise<boolean> {
    return true;
  }

  async passwordRecoveryReset(
    token: string,
    newPassword: string,
  ): Promise<boolean> {
    return true;
  }

  async emailConfirmation(token: string): Promise<boolean> {
    return true;
  }

  async sendConfirmationEmail(userId: string, email: string): Promise<boolean> {
    return true;
  }
}
