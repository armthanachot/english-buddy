// packages/shared/index.ts
export type User = {
  id: string;
  name: string;
  role: 'admin' | 'user';
};

export const API_PREFIX = '/api';