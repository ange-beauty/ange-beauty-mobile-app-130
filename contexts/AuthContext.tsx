import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { login as authLogin, logout as authLogout, me as authMe } from '@/services/auth';
import { ApiHttpError } from '@/services/httpClient';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
};

function mapMeToAuthUser(payload: any): AuthUser | null {
  const source = payload?.data || payload;
  if (!source) return null;
  const id =
    source.id?.toString?.() ||
    source.userId?.toString?.() ||
    source._id?.toString?.() ||
    '';
  const name =
    source.name || source.fullName || source.username || source.displayName || '';
  const email = source.email || source.mail || '';
  const phone = source.phone || source.mobile || source.telephone || undefined;

  if (!name || !email) return null;
  return {
    id: id || email,
    name,
    email,
    phone,
  };
}

export const [AuthContext, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const resolveSession = useCallback(async () => {
    try {
      const result = await authMe();
      const profile = mapMeToAuthUser(result);
      setUser(profile);
      return profile;
    } catch {
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
    async (_payload: {
      name: string;
      email: string;
      password: string;
      phone?: string;
    }) => {
      return {
        success: false,
        message:
          '\u062e\u062f\u0645\u0629 \u0625\u0646\u0634\u0627\u0621 \u062d\u0633\u0627\u0628 \u063a\u064a\u0631 \u0645\u062a\u0648\u0641\u0631\u0629 \u062d\u0627\u0644\u064a\u0627\u064b \u0641\u064a \u0627\u0644\u062a\u0637\u0628\u064a\u0642',
      };
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

  return useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshSession: resolveSession,
    }),
    [user, isLoading, login, register, logout, resolveSession]
  );
});
