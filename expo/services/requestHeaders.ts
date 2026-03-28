import { Platform } from 'react-native';

export const CLIENT_SOURCE_HEADER = 'x-request-terminal-origin';

export function getClientSourceValue(): 'WP' | 'MP' {
  return Platform.OS === 'web' ? 'WP' : 'MP';
}

export function withClientSourceHeader(
  headers: Record<string, string> = {}
): Record<string, string> {
  return {
    ...headers,
    [CLIENT_SOURCE_HEADER]: getClientSourceValue(),
  };
}
