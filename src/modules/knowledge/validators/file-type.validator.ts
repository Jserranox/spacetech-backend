import { ALLOWED_MIME_TYPES } from '../constants/knowledge.constants';

export function validateMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

export const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md'];
