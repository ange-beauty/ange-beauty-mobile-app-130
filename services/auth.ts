import { apiFetch } from '@/services/httpClient';

export type LoginPayload = {
  email: string;
  password: string;
};

export async function login(payload: LoginPayload): Promise<any> {
  return apiFetch('/api/v1/auth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: payload.email.trim(),
      password: payload.password.trim(),
    }),
    skipRefreshRetry: true,
  });
}

export async function me(): Promise<any> {
  return apiFetch('/api/v1/auth/me');
}

export async function refresh(): Promise<any> {
  return apiFetch('/api/v1/auth/refresh', {
    method: 'POST',
    skipRefreshRetry: true,
  });
}

export async function logout(): Promise<any> {
  return apiFetch('/api/v1/auth/logout', {
    method: 'POST',
    skipRefreshRetry: true,
  });
}
