import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Activity, CheckCircle2, AlertCircle, Loader2, Database, Server, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Item 7.5/3.2 do roadmap (UX-HARMONIZATION): pagina publica de uptime status
// no Vila Food. Espelha o /saude do Rota Tamandare (mesma estrutura, mesmo
// endpoint health_check). Pode ser apontada por UptimeRobot/BetterStack via
// GET /saude.

interface HealthCheck {
  status: 'ok' | 'degraded' | 'error';
  ts: string;
  service: string;
  latency_ms?: number;
  db_version?: string;
  checks?: Record<string, unknown>;
  error?: string;
}

export default function Saude() {
  const [backend, setBackend] = useState<HealthCheck | null>(null);
  const [frontend] = useState<HealthCheck>({
    status: 'ok',
    ts: new Date().toISOString(),
    service: 'vila-food-frontend',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const { data, error: err } = await supabase.rpc('health_check');
      if (cancelled) return;
      if (err) {
        setBackend({
          status: 'error',
          ts: new Date().toISOString(),
          service: 'vila-food-nova',
          error: err.message,
        });
        setError(err.message);
      } else {
        setBackend(data as HealthCheck);
      }
      setLoading(false);
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  const allOk = backend?.status === 'ok' && frontend.status === 'ok';

  return (
    <>
      <Helmet>
        <title>Status · Vila Food</title>
        <meta
          name="description"
          content="Endpoint público de monitoramento do Vila Food. Frontend + API + banco."
        />
      </Helmet>
      <div className="w-full pb-24 min-h-screen bg-background">
        <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-10 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-6 h-6" />
              <span className="text-xs font-bold uppercase tracking-widest opacity-80">
                Status do ecossistema
              </span>
            </div>
            <h1 className="text-4xl font-extrabold mb-2">
              {loading
                ? 'Verificando...'
                : allOk
                ? 'Tudo operando normalmente'
                : 'Atenção: instabilidade detectada'}
            </h1>
            <p className="text-sm opacity-90">
              Endpoint público de monitoramento. Atualizado a cada visita.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 -mt-6 relative z-30 space-y-4">
          <ServiceCard
            name="Vila Food · Frontend"
            icon={Server}
            health={frontend}
            loading={false}
          />
          <ServiceCard
            name="Vila Food · API + Banco"
            icon={Database}
            health={backend}
            loading={loading}
            error={error}
          />

          <div className="bg-foreground/5 rounded-2xl p-4 mt-6">
            <p className="text-xs text-muted-foreground text-center">
              Para monitoramento contínuo, este endpoint pode ser apontado por
              UptimeRobot, BetterStack ou similar via{' '}
              <code className="bg-white/60 px-1.5 py-0.5 rounded text-[10px]">
                GET /saude
              </code>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function ServiceCard({
  name,
  icon: Icon,
  health,
  loading,
  error,
}: {
  name: string;
  icon: typeof Server;
  health: HealthCheck | null;
  loading: boolean;
  error?: string | null;
}) {
  const status = health?.status ?? 'unknown';
  const color =
    status === 'ok'
      ? 'text-green-600'
      : status === 'degraded'
      ? 'text-amber-600'
      : status === 'error'
      ? 'text-red-600'
      : 'text-muted-foreground';
  const StatusIcon = status === 'ok' ? CheckCircle2 : AlertCircle;

  return (
    <div className="bg-white rounded-2xl shadow-md p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-extrabold text-foreground">{name}</h2>
          {health?.service && (
            <p className="font-mono text-[10px] text-muted-foreground">{health.service}</p>
          )}
        </div>
        {loading ? (
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        ) : (
          <div className={`flex items-center gap-1.5 ${color}`}>
            <StatusIcon className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-widest">{status}</span>
          </div>
        )}
      </div>

      {!loading && health && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          {typeof health.latency_ms === 'number' && (
            <Pair label="Latência" value={`${health.latency_ms}ms`} icon={Clock} />
          )}
          <Pair
            label="Última verificação"
            value={new Date(health.ts).toLocaleTimeString('pt-BR')}
            icon={Clock}
          />
          {health.checks &&
            Object.entries(health.checks).map(([k, v]) => (
              <Pair key={k} label={k.replace(/_/g, ' ')} value={String(v)} />
            ))}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 mt-3">
          Erro: {error}
        </p>
      )}
    </div>
  );
}

function Pair({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Clock;
}) {
  return (
    <div className="bg-foreground/5 rounded-lg p-2">
      <p className="text-[9px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </p>
      <p className="font-mono text-xs text-foreground mt-0.5 truncate">{value}</p>
    </div>
  );
}
