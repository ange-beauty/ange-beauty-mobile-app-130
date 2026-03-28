import { apiFetch } from '@/services/httpClient';

export type LoginPayload = {
  email: string;
  password: string;
  security_token?: string | null;
};

export type RegisterPayload = {
  first_name: string;
  email: string;
  telephone: string;
  password: string;
  consent_terms_accepted: boolean;
  consent_email_sms_opt_in: boolean;
  security_token?: string | null;
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
      security_token: payload.security_token || '',
    }),
    skipRefreshRetry: true,
  });
}

export async function register(payload: RegisterPayload): Promise<any> {
  return apiFetch('/api/v1/users/clients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      first_name: payload.first_name.trim(),
      email: payload.email.trim(),
      telephone: payload.telephone.trim(),
      password: payload.password,
      consent_terms_accepted: payload.consent_terms_accepted,
      consent_email_sms_opt_in: payload.consent_email_sms_opt_in,
      security_token: payload.security_token || '',
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

export async function sendEmailVerification(): Promise<any> {
  return apiFetch('/api/v1/auth/send-email-verification', {
    method: 'POST',
  });
}

export async function verifyEmailToken(token: string): Promise<any> {
  const encodedToken = encodeURIComponent(token);
  return apiFetch(`/api/v1/auth/verify-email?token=${encodedToken}`, {
    method: 'POST',
    skipRefreshRetry: true,
  });
}
