import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, Organization } from '@aero-agent/database';
import { MemberRole } from '@aero-agent/database';
import { TokenService } from './token.service';
import { LoginDto } from '../dtos/login.dto';
import { RegisterDto } from '../dtos/register.dto';
import { AuthResponseDto } from '../dtos/auth-response.dto';
import { JwtPayload, JwtRefreshPayload } from '../interfaces/jwt-payload.interface';
import { BCRYPT_SALT_ROUNDS } from '../constants/auth.constants';

// Dummy hash for timing-safe login (prevents user enumeration via timing)
const DUMMY_HASH = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4tbqBHCFi6';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly tokenService: TokenService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    const orgName =
      dto.organizationName ?? `${dto.email.split('@')[0]}'s Organization`;

    const user = await this.dataSource.transaction(async (manager) => {
      const org = manager.create(Organization, { name: orgName });
      await manager.save(org);

      const newUser = manager.create(User, {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName ?? null,
        lastName: dto.lastName ?? null,
        organizationId: org.id,
        role: MemberRole.OWNER,
        refreshTokenIds: [],
      });
      return manager.save(newUser);
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    // Always run bcrypt to prevent user enumeration via timing
    const hashToCompare = user?.passwordHash ?? DUMMY_HASH;
    const isValid = await bcrypt.compare(dto.password, hashToCompare);

    if (!user || !isValid) throw new UnauthorizedException('Invalid credentials');

    return this.buildAuthResponse(user);
  }

  async refresh(payload: JwtRefreshPayload): Promise<AuthResponseDto> {
    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    const tokenIds: string[] = user.refreshTokenIds ?? [];
    const tokenIndex = tokenIds.indexOf(payload.tokenId);

    if (tokenIndex === -1) {
      // Reuse detected — invalidate ALL refresh tokens for this user
      await this.userRepo.update(user.id, { refreshTokenIds: [] });
      throw new UnauthorizedException('Refresh token reuse detected. All sessions revoked.');
    }

    // Remove consumed tokenId before issuing new pair (rotation)
    await this.userRepo.update(user.id, {
      refreshTokenIds: tokenIds.filter((id) => id !== payload.tokenId),
    });

    const freshUser = await this.userRepo.findOne({ where: { id: user.id } });
    return this.buildAuthResponse(freshUser);
  }

  async logout(userId: string, rawRefreshToken: string): Promise<void> {
    try {
      const decoded = this.jwtService.decode(rawRefreshToken) as JwtRefreshPayload;
      if (!decoded?.tokenId || decoded.sub !== userId) return;

      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) return;

      await this.userRepo.update(userId, {
        refreshTokenIds: (user.refreshTokenIds ?? []).filter(
          (id) => id !== decoded.tokenId,
        ),
      });
    } catch {
      // Logout should never throw
    }
  }

  async getMe(userId: string): Promise<Partial<User>> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'organizationId',
        'avatarUrl',
        'isEmailVerified',
        'lastLoginAt',
        'createdAt',
      ],
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  private async buildAuthResponse(user: User): Promise<AuthResponseDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
    };

    const { accessToken, refreshToken, tokenId, expiresIn } =
      this.tokenService.generateTokenPair(payload);

    // Append new tokenId and update last login atomically
    const currentIds: string[] = user.refreshTokenIds ?? [];
    await this.userRepo.update(user.id, {
      refreshTokenIds: [...currentIds, tokenId],
      lastLoginAt: new Date(),
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  }
}
