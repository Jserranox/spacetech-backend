import { DocumentType } from '@aero-agent/database';

export const DOCUMENT_PARSERS = 'DOCUMENT_PARSERS';

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'text/html',
];

export const MIME_TO_DOCTYPE: Record<string, DocumentType> = {
  'application/pdf': DocumentType.PDF,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': DocumentType.DOCX,
  'text/plain': DocumentType.TXT,
  'text/markdown': DocumentType.MARKDOWN,
  'text/html': DocumentType.URL,
};

export const DOCTYPE_TO_MIME: Record<string, string> = {
  [DocumentType.PDF]: 'application/pdf',
  [DocumentType.DOCX]: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  [DocumentType.TXT]: 'text/plain',
  [DocumentType.MARKDOWN]: 'text/markdown',
  [DocumentType.URL]: 'text/url',
};
