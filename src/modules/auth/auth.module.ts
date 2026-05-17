import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User, Organization, ApiKey } from '@aero-agent/database';

import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { ApiKeyService } from './services/api-key.service';
import { AuthController } from './controller/auth.controller';

import { JwtStrategy } from './strategies/jwt.strategies';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { ApiKeyStrategy } from './strategies/api-key.strategy';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiKeyGuard } from './guards/api-key.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([User, Organization, ApiKey]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'change-me-in-production'),
        signOptions: {
          expiresIn: config.get<number>('JWT_EXPIRES_IN_SECONDS', 900),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    ApiKeyService,
    JwtStrategy,
    JwtRefreshStrategy,
    ApiKeyStrategy,
    JwtAuthGuard,
    ApiKeyGuard,
    RefreshTokenGuard,
  ],
  exports: [
    AuthService,
    TokenService,
    ApiKeyService,
    JwtAuthGuard,
    ApiKeyGuard,
    RefreshTokenGuard,
    JwtModule,
  ],
})
export class AuthModule {}
