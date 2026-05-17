import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JWT_REFRESH_STRATEGY } from '../constants/auth.constants';
import { JwtRefreshPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, JWT_REFRESH_STRATEGY) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET', 'change-refresh-in-production'),
    });
  }

  validate(payload: JwtRefreshPayload): JwtRefreshPayload {
    return payload;
  }
}
