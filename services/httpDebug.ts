const DEBUG_HTTP = process.env.EXPO_PUBLIC_DEBUG_HTTP === 'true';

function normalizeBody(body: BodyInit | null | undefined) {
  if (body == null) {
    return undefined;
  }

  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }

  return '[non-text-body]';
}

async function normalizeResponseBody(response: Response) {
  try {
    const text = await response.clone().text();
    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch {
    return '[unavailable]';
  }
}

export async function debugFetch(
  input: string,
  init: RequestInit = {},
  label = 'HTTP'
): Promise<Response> {
  if (DEBUG_HTTP) {
    console.log(`[${label}] Request`, {
      method: init.method || 'GET',
      url: input,
      headers: init.headers,
      credentials: init.credentials,
      body: normalizeBody(init.body),
    });
  }

  try {
    const response = await fetch(input, init);

    if (DEBUG_HTTP) {
      console.log(`[${label}] Response`, {
        method: init.method || 'GET',
        url: input,
        status: response.status,
        ok: response.ok,
        body: await normalizeResponseBody(response),
      });
    }

    return response;
  } catch (error) {
    if (DEBUG_HTTP) {
      console.log(`[${label}] Error`, {
        method: init.method || 'GET',
        url: input,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    throw error;
  }
}
