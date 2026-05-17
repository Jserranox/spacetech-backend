import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { ApiKeyService } from '../services/api-key.service';
import { LoginDto } from '../dtos/login.dto';
import { RegisterDto } from '../dtos/register.dto';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { CreateApiKeyDto } from '../dtos/create-api-key.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RefreshTokenGuard } from '../guards/refresh-token.guard';
import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtPayload, JwtRefreshPayload } from '../interfaces/jwt-payload.interface';

@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly apiKeyService: ApiKeyService,
  ) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * Refresh token rotation. Client sends { refreshToken } in body.
   * RefreshTokenGuard validates the token and populates req.user with JwtRefreshPayload.
   */
  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@CurrentUser() user: JwtRefreshPayload) {
    return this.authService.refresh(user);
  }

  /**
   * Logout: authenticated via access token, removes the supplied refresh token from rotation.
   */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user: JwtPayload, @Body() dto: RefreshTokenDto) {
    await this.authService.logout(user.sub, dto.refreshToken);
  }

  @Get('me')
  getMe(@CurrentUser() user: JwtPayload) {
    return this.authService.getMe(user.sub);
  }

  // ── API Keys ───────────────────────────────────────────────────────────────

  @Post('api-keys')
  createApiKey(@CurrentUser() user: JwtPayload, @Body() dto: CreateApiKeyDto) {
    return this.apiKeyService.create(user.organizationId, dto);
  }

  @Get('api-keys')
  listApiKeys(@CurrentUser() user: JwtPayload) {
    return this.apiKeyService.listForUser(user.organizationId);
  }

  @Delete('api-keys/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeApiKey(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.apiKeyService.revoke(id, user.organizationId);
  }
}
