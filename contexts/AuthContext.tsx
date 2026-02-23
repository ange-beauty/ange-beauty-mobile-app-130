import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  login as authLogin,
  logout as authLogout,
  me as authMe,
  register as authRegister,
  sendEmailVerification as authSendEmailVerification,
} from '@/services/auth';
import { ApiHttpError } from '@/services/httpClient';

const DEBUG_AUTH = process.env.EXPO_PUBLIC_DEBUG_AUTH === 'true';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  emailVerified: boolean;
};

function toBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }
  if (typeof value === 'number') return value === 1;
  return false;
}

function mapMeToAuthUser(payload: any): AuthUser | null {
  const source = payload?.data?.user || payload?.data || payload?.user || payload;
  if (!source) return null;
  const id =
    source.id?.toString?.() ||
    source.userId?.toString?.() ||
    source._id?.toString?.() ||
    '';
  const firstName = (source.first_name || source.firstName || '').toString().trim();
  const lastName = (source.last_name || source.lastName || '').toString().trim();
  const fullNameFromParts = [firstName, lastName].filter(Boolean).join(' ').trim();
  const name =
    source.name ||
    source.fullName ||
    fullNameFromParts ||
    source.username ||
    source.displayName ||
    source.email ||
    '';
  const email =
    source.email ||
    source.mail ||
    source?.contact?.email ||
    source?.user?.email ||
    '';
  const phone = source.phone || source.mobile || source.telephone || undefined;
  const emailVerified = toBoolean(source.email_verified);

  if (!email) return null;
  return {
    id: id || email,
    name,
    email,
    phone,
    emailVerified,
  };
}

export const [AuthContext, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const resolveSession = useCallback(async () => {
    try {
      const result = await authMe();
      if (DEBUG_AUTH) {
        const data = result?.data || result || {};
        console.log('[Auth] /me success', {
          id: data?.id,
          email: data?.email,
          first_name: data?.first_name,
          last_name: data?.last_name,
          email_verified: data?.email_verified,
        });
      }
      const profile = mapMeToAuthUser(result);
      if (DEBUG_AUTH) {
        console.log('[Auth] mapped profile', profile);
      }
      setUser(profile);
      return profile;
    } catch (error) {
      if (DEBUG_AUTH) {
        console.log('[Auth] /me failed', error);
      }
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    async function bootstrapAuth() {
      await resolveSession();
      setIsLoading(false);
    }
    bootstrapAuth();
  }, [resolveSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        await authLogin({ email, password });
        if (DEBUG_AUTH) {
          console.log('[Auth] login success, fetching /me');
        }
        const profile = await resolveSession();
        if (!profile) {
          return {
            success: false,
            message:
              '\u062a\u0639\u0630\u0631 \u062c\u0644\u0628 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u062d\u0633\u0627\u0628',
          };
        }
        return { success: true, message: '' };
      } catch (error: any) {
        const message =
          error instanceof ApiHttpError
            ? error.body?.message ||
              '\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u062f\u062e\u0648\u0644 \u063a\u064a\u0631 \u0635\u062d\u064a\u062d\u0629'
            : '\u062a\u0639\u0630\u0631 \u0627\u0644\u0627\u062a\u0635\u0627\u0644 \u0628\u0627\u0644\u062e\u0627\u062f\u0645';
        return { success: false, message };
      }
    },
    [resolveSession]
  );

  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      password: string;
      phone?: string;
    }) => {
      try {
        await authRegister({
          first_name: payload.name,
          email: payload.email,
          telephone: payload.phone || '',
          password: payload.password,
        });
        return {
          success: true,
          message:
            '\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062d\u0633\u0627\u0628. \u064a\u0631\u062c\u0649 \u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u0642\u0628\u0644 \u0625\u062a\u0645\u0627\u0645 \u0627\u0644\u0637\u0644\u0628.',
        };
      } catch (error: any) {
        const message =
          error instanceof ApiHttpError
            ? error.body?.message ||
              '\u062a\u0639\u0630\u0631 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062d\u0633\u0627\u0628'
            : '\u062a\u0639\u0630\u0631 \u0627\u0644\u0627\u062a\u0635\u0627\u0644 \u0628\u0627\u0644\u062e\u0627\u062f\u0645';
        return { success: false, message };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await authLogout();
    } catch {
      // local state should clear regardless of backend response
    }
    setUser(null);
  }, []);

  const resendEmailVerification = useCallback(async () => {
    try {
      await authSendEmailVerification();
      return {
        success: true,
        message:
          '\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0631\u0633\u0627\u0644\u0629 \u0627\u0644\u062a\u0641\u0639\u064a\u0644 \u0625\u0644\u0649 \u0628\u0631\u064a\u062f\u0643 \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a.',
      };
    } catch (error: any) {
      const message =
        error instanceof ApiHttpError
          ? error.body?.message ||
            '\u062a\u0639\u0630\u0631 \u0625\u0631\u0633\u0627\u0644 \u0631\u0633\u0627\u0644\u0629 \u0627\u0644\u062a\u0641\u0639\u064a\u0644'
          : '\u062a\u0639\u0630\u0631 \u0627\u0644\u0627\u062a\u0635\u0627\u0644 \u0628\u0627\u0644\u062e\u0627\u062f\u0645';
      return { success: false, message };
    }
  }, []);

  return useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      resendEmailVerification,
      refreshSession: resolveSession,
    }),
    [user, isLoading, login, register, logout, resendEmailVerification, resolveSession]
  );
});
