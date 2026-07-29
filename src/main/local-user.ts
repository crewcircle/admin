import { credentialManager } from './credential-manager';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let cachedUserId: string | null = null;

export function getLocalUserId(): string {
  if (cachedUserId) return cachedUserId;

  const existing = credentialManager.get('local_user_id');
  if (existing) {
    cachedUserId = existing;
    return existing;
  }

  const newId = generateUUID();
  credentialManager.setSync('local_user_id', newId);
  cachedUserId = newId;
  return newId;
}
