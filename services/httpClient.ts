const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.angebeauty.net/';
const API_BASE = API_BASE_URL.replace(/\/+$/, '');

type ApiFetchOptions = RequestInit & {
  skipRefreshRetry?: boolean;
};

export class ApiHttpError extends Error {
  status: number;
  body: any;

  constructor(status: number, message: string, body: any) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

let refreshInFlight: Promise<boolean> | null = null;

async function safeJsonParse(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function callRefresh(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'include',
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function refreshOnceShared(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = callRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function apiFetch<T = any>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { skipRefreshRetry = false, headers, ...rest } = options;

  const doRequest = () =>
    fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...headers,
      },
      ...rest,
    });

  let response = await doRequest();

  if (response.status === 401 && !skipRefreshRetry) {
    const refreshed = await refreshOnceShared();
    if (refreshed) {
      response = await doRequest();
    }
  }

  const body = await safeJsonParse(response);
  if (!response.ok) {
    throw new ApiHttpError(
      response.status,
      body?.message || 'Request failed',
      body
    );
  }

  return body as T;
}
