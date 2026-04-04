import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type TurnstileWidgetProps = {
  action: 'login' | 'register';
  resetKey?: number;
  onTokenChange: (token: string | null) => void;
};

const SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY || '';
const SCRIPT_ID = 'cf-turnstile-script';

declare global {
  interface Window {
    turnstile?: {
      render?: (container: string | HTMLElement, options: Record<string, any>) => string;
      remove?: (widgetId: string) => void;
    };
  }
}

function ensureTurnstileScript(onLoad: () => void) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  if (window.turnstile && typeof window.turnstile.render === 'function') {
    onLoad();
    return;
  }

  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    existing.addEventListener('load', onLoad, { once: true });
    return;
  }

  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  script.async = true;
  script.defer = true;
  script.addEventListener('load', onLoad, { once: true });
  document.head.appendChild(script);
}

export default function TurnstileWidget({
  action,
  resetKey = 0,
  onTokenChange,
}: TurnstileWidgetProps) {
  const callbackRef = useRef(onTokenChange);
  const widgetIdRef = useRef<string | null>(null);
  const containerId = useMemo(
    () => `cf-turnstile-${action}-${resetKey}-${Math.random().toString(36).slice(2, 8)}`,
    [action, resetKey]
  );

  useEffect(() => {
    callbackRef.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(() => {
    callbackRef.current(null);

    if (!SITE_KEY) {
      return;
    }

    let cancelled = false;

    const render = () => {
      if (
        cancelled ||
        !window.turnstile ||
        typeof window.turnstile.render !== 'function'
      ) {
        if (!cancelled) {
          setTimeout(render, 120);
        }
        return;
      }
      const container = document.getElementById(containerId);
      if (!container) {
        return;
      }

      widgetIdRef.current = window.turnstile.render(`#${containerId}`, {
        sitekey: SITE_KEY,
        action,
        callback: (token: string) => callbackRef.current(token || null),
        'expired-callback': () => callbackRef.current(null),
        'error-callback': () => callbackRef.current(null),
      });
    };

    ensureTurnstileScript(render);

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile?.remove) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // no-op
        }
      }
      widgetIdRef.current = null;
    };
  }, [action, containerId, resetKey]);

  if (!SITE_KEY) {
    return (
      <View style={styles.missingKeyBox}>
        <Text style={styles.missingKeyText}>
          {'\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u062a\u062d\u0642\u0642. \u064a\u0631\u062c\u0649 \u0625\u0636\u0627\u0641\u0629 EXPO_PUBLIC_TURNSTILE_SITE_KEY'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <div id={containerId} style={{ minHeight: 65, width: '100%' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 78,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8DD',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  missingKeyBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E53935',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  missingKeyText: {
    fontSize: 12,
    color: '#B9442B',
    textAlign: 'right',
    lineHeight: 18,
  },
});
