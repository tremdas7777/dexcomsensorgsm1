/** Erros HTTP das edge functions: `context` é um Response (identifica pelo nome por causa do bundle). */
function getHttpErrorResponse(error: unknown): Response | null {
  if (!error || typeof error !== 'object') return null;
  const e = error as { name?: string; context?: unknown };
  if (e.name !== 'FunctionsHttpError') return null;
  const ctx = e.context;
  return ctx instanceof Response ? ctx : null;
}

/**
 * Quando uma Edge Function responde 4xx/5xx com JSON, o supabase-js devolve `data: null` e
 * `error: FunctionsHttpError`. Este helper lê o body para obter `error`, `details`, etc.
 */
export async function normalizeFunctionInvokeResult<T>(
  result: { data: T | null; error: unknown },
): Promise<{ data: T | null; error: unknown }> {
  const { data, error } = result;
  if (!error) return { data, error: null };

  const httpRes = getHttpErrorResponse(error);

  if (httpRes instanceof Response) {
    try {
      const cloned = httpRes.clone();
      const body = (await cloned.json()) as T;
      return { data: body, error: null };
    } catch {
      try {
        const text = (await httpRes.text()).trim();
        const status = httpRes.status;
        const synthetic = {
          error:
            text.length > 0
              ? text.slice(0, 800)
              : `Edge Function retornou HTTP ${status} sem corpo JSON (confira deploy e nome da função).`,
        } as T;
        return { data: synthetic, error: null };
      } catch {
        return { data: null, error };
      }
    }
  }

  return { data: null, error };
}

/** Mensagem legível a partir do JSON retornado pela edge ou pelo gateway. */
export function formatFunctionErrorPayload(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const d = data as Record<string, unknown>;
  let base = '';
  if (typeof d.error === 'string' && d.error.length > 0) base = d.error;
  else if (typeof d.message === 'string' && d.message.length > 0) base = d.message;
  else if (typeof d.msg === 'string' && d.msg.length > 0) base = d.msg;
  else {
    const details = d.details;
    if (Array.isArray(details) && details.length > 0) {
      const first = details[0] as Record<string, unknown> | undefined;
      if (first && typeof first.message === 'string') base = first.message;
    }
  }
  const up = d.upstreamStatus;
  if (base && typeof up === 'number') base = `${base} [API Centurion HTTP ${up}]`;
  return base;
}
