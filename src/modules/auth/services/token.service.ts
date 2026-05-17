import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenId: string;
  expiresIn: number;
}

@Injectable()
export class TokenService {
  private readonly accessExpiresInSeconds: number;
  private readonly refreshExpiresIn: string;
  private readonly refreshSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessExpiresInSeconds = configService.get<number>('JWT_EXPIRES_IN_SECONDS', 900);
    this.refreshExpiresIn = configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    this.refreshSecret = configService.get<string>(
      'JWT_REFRESH_SECRET',
      'change-refresh-in-production',
    );
  }

  generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(
      {
        sub: payload.sub,
        email: payload.email,
        organizationId: payload.organizationId,
        role: payload.role,
      },
      { expiresIn: this.accessExpiresInSeconds },
    );
  }

  generateRefreshToken(payload: JwtPayload, tokenId: string): string {
    return this.jwtService.sign(
      {
        sub: payload.sub,
        email: payload.email,
        organizationId: payload.organizationId,
        role: payload.role,
        tokenId,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { secret: this.refreshSecret, expiresIn: this.refreshExpiresIn as any },
    );
  }

  generateTokenPair(payload: JwtPayload): TokenPair {
    const tokenId = crypto.randomUUID();
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload, tokenId);
    return { accessToken, refreshToken, tokenId, expiresIn: this.accessExpiresInSeconds };
  }
}
