import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

type TurnstileMessage =
  | { type: 'token'; token: string }
  | { type: 'expired' }
  | { type: 'error'; message?: string };

type TurnstileWidgetProps = {
  action: 'login' | 'register';
  resetKey?: number;
  onTokenChange: (token: string | null) => void;
};

const SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY || '';
const TURNSTILE_BASE_URL =
  process.env.EXPO_PUBLIC_TURNSTILE_BASE_URL || 'https://www.angebeauty.net/';

export default function TurnstileWidget({
  action,
  resetKey = 0,
  onTokenChange,
}: TurnstileWidgetProps) {
  const [widgetError, setWidgetError] = useState<string | null>(null);
  const html = useMemo(() => {
    if (!SITE_KEY) {
      return '';
    }

    return `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            * { box-sizing: border-box; }
            html, body {
              margin: 0;
              padding: 0;
              min-height: 110px;
              background: transparent;
            }
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 8px 4px;
            }
            .cf-turnstile {
              min-height: 65px;
            }
          </style>
        </head>
        <body>
          <div
            class="cf-turnstile"
            data-sitekey="${SITE_KEY}"
            data-action="${action}"
            data-size="normal"
            data-appearance="always"
            data-callback="onTurnstileSuccess"
            data-expired-callback="onTurnstileExpired"
            data-error-callback="onTurnstileError"
          ></div>
          <script>
            function post(data) {
              try {
                window.ReactNativeWebView.postMessage(JSON.stringify(data));
              } catch (_) {}
            }

            window.onTurnstileSuccess = function(token) {
              post({ type: 'token', token: token || '' });
            };
            window.onTurnstileExpired = function() {
              post({ type: 'expired' });
            };
            window.onTurnstileError = function(code) {
              post({ type: 'error', message: code || 'turnstile_error' });
            };
          </script>
          <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
        </body>
      </html>
    `;
  }, [action, resetKey]);

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
      <WebView
        key={`${action}-${resetKey}-inline`}
        originWhitelist={['https://*', 'http://*', 'about:blank', 'about:srcdoc']}
        source={{ html, baseUrl: TURNSTILE_BASE_URL }}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data) as TurnstileMessage;
            if (data.type === 'token') {
              setWidgetError(null);
              onTokenChange(data.token || null);
              return;
            }
            if (data.type === 'error') {
              setWidgetError(data.message || 'turnstile_error');
            }
            onTokenChange(null);
          } catch {
            setWidgetError('turnstile_parse_error');
            onTokenChange(null);
          }
        }}
        onError={() => {
          setWidgetError('webview_load_error');
          onTokenChange(null);
        }}
        onHttpError={() => {
          setWidgetError('webview_http_error');
          onTokenChange(null);
        }}
        style={styles.webView}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        scrollEnabled={false}
        bounces={false}
      />
      {widgetError ? (
        <Text style={styles.widgetErrorText}>
          {`\u062e\u0637\u0623 \u0641\u064a \u0627\u0644\u062a\u062d\u0642\u0642: ${widgetError}`}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8DD',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  widgetErrorText: {
    position: 'absolute',
    bottom: 4,
    right: 8,
    left: 8,
    fontSize: 11,
    color: '#B9442B',
    textAlign: 'right',
    backgroundColor: 'rgba(255,255,255,0.9)',
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
