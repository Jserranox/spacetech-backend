export class UserSummaryDto {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  organizationId: string;
}

export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserSummaryDto;
}

export class ApiKeyResponseDto {
  id: string;
  name: string;
  /** Full key shown exactly once at creation time */
  key: string;
  keyPreview: string;
  scopes: string[];
  expiresAt: Date | null;
  createdAt: Date;
}
