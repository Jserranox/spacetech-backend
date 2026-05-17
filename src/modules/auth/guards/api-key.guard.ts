import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { API_KEY_STRATEGY } from '../constants/auth.constants';

@Injectable()
export class ApiKeyGuard extends AuthGuard(API_KEY_STRATEGY) {}
