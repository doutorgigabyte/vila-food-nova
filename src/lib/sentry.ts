// =============================================================================
// Sentry — error tracking + performance (item 7.4 do roadmap)
// =============================================================================
//
// Replica do wrapper do Rota T (src/lib/sentry.ts). Mantemos a API identica
// pra facilitar manutencao cross-app.
//
// LGPD: Sentry recebe stack traces + URL. NAO enviamos PII (email, nome) nos
// scopes — apenas user_id (UUID) anonimizado. Cookies/storage NAO sao
// capturados (default Sentry).
// =============================================================================

interface SentryLike {
  captureException: (err: unknown, ctx?: Record<string, unknown>) => void;
  captureMessage: (msg: string, level?: 'info' | 'warning' | 'error') => void;
  setUser: (user: { id?: string } | null) => void;
  setTag: (key: string, value: string) => void;
}

const noopSentry: SentryLike = {
  captureException: () => {},
  captureMessage: () => {},
  setUser: () => {},
  setTag: () => {},
};

let sentryInstance: SentryLike = noopSentry;
let initialized = false;

/**
 * Inicializa Sentry. Chamar 1x no entry point (main.tsx).
 * No-op silencioso quando VITE_SENTRY_DSN nao esta definido.
 */
export async function initSentry(): Promise<void> {
  if (initialized) return;
  initialized = true;

  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;

  try {
    // Indireção via variável + @vite-ignore: dependência opcional.
    // Sem @sentry/react instalado, falha em runtime e fica no-op.
    const moduleName = '@sentry/react';
    const Sentry = await import(/* @vite-ignore */ moduleName);
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      release: import.meta.env.VITE_RELEASE_SHA as string | undefined,
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0.5,
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        /chrome-extension:/i,
      ],
      beforeSend(event) {
        if (event.request?.cookies) delete event.request.cookies;
        if (event.user?.email) delete event.user.email;
        if (event.user?.username) delete event.user.username;
        return event;
      },
    });
    sentryInstance = Sentry as unknown as SentryLike;
    sentryInstance.setTag('service', 'vila-food-frontend');
  } catch (err) {
    console.warn('[sentry] init failed, error tracking disabled:', err);
  }
}

export function captureException(err: unknown, context?: Record<string, unknown>): void {
  if (sentryInstance === noopSentry) {
    console.error('[would-report]', err, context);
    return;
  }
  sentryInstance.captureException(err, context);
}

export function captureMessage(msg: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  sentryInstance.captureMessage(msg, level);
}

export function setUser(userId: string | null): void {
  sentryInstance.setUser(userId ? { id: userId } : null);
}

export function setTag(key: string, value: string): void {
  sentryInstance.setTag(key, value);
}
