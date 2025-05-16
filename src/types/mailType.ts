export interface ISendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: any[];
  headers?: { key: string; value: string }[];
}
