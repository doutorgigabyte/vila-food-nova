import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Download, AlertTriangle, ShieldCheck, Trash2, RefreshCw,
  Loader2, Calendar, X, ArrowLeft,
} from 'lucide-react';
import { useMemberPrivacy, downloadJSON } from '@/lib/memberPrivacy';
import { useAuth } from '@/hooks/useAuth';

// Item 3.2 (UX-HARMONIZATION) + 6.5 LGPD: Vila Food /membro/privacidade.
// Espelha o /membro/privacidade do Rota T.
//
// 2 ações: (1) baixar JSON com todos meus dados (art. 18 V),
//          (2) solicitar exclusão da conta com cooldown 30d (art. 18 VI).

export default function Privacidade() {
  const { user, loading: authLoading } = useAuth();
  const {
    deletionStatus, loading, error, exporting, requesting, cancelling,
    exportData, requestDeletion, cancelDeletion, refresh,
  } = useMemberPrivacy();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-md p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-3" />
          <h1 className="text-xl font-extrabold mb-2">Login necessário</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Pra exportar ou solicitar exclusão dos seus dados, faça login.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground text-sm font-bold uppercase tracking-widest"
          >
            Entrar
          </Link>
        </div>
      </div>
    );
  }

  const handleExport = async () => {
    const data = await exportData();
    if (!data) return;
    const today = new Date().toISOString().slice(0, 10);
    downloadJSON(data, `vilafood-meus-dados-${today}.json`);
  };

  const handleRequestDelete = async () => {
    const ok = await requestDeletion(deleteReason || undefined);
    if (ok) {
      setShowConfirmDelete(false);
      setDeleteReason('');
    }
  };

  const isPendingDeletion = deletionStatus?.status === 'pending';

  return (
    <>
      <Helmet>
        <title>Privacidade · Vila Food</title>
        <meta
          name="description"
          content="Exporte seus dados ou solicite exclusão da conta. Direitos garantidos pela LGPD."
        />
      </Helmet>
      <div className="min-h-screen bg-background pb-24">
        <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-10 px-4">
          <div className="max-w-2xl mx-auto">
            <Link
              to="/account"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-90 hover:opacity-100 mb-3"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-6 h-6" />
              <span className="text-xs font-bold uppercase tracking-widest opacity-80">
                LGPD · Lei 13.709/2018
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
              Privacidade & meus dados
            </h1>
            <p className="text-sm opacity-90">
              Exerça seus direitos garantidos pela LGPD: exportar seus dados (art.
              18 V) ou solicitar exclusão da conta (art. 18 VI).
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 -mt-4 relative z-30 space-y-4">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-red-900">{error}</p>
            </div>
          )}

          {/* Card 1: Exportar */}
          <div className="bg-white rounded-2xl shadow-md p-5 md:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-extrabold">
                  Baixar meus dados
                </h2>
                <p className="text-xs text-muted-foreground">LGPD art. 18 V — portabilidade</p>
              </div>
            </div>
            <p className="text-sm mb-4">
              Gera um arquivo JSON com todos os dados pessoais que mantemos sobre
              você: cadastro, endereços, pedidos.
            </p>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {exporting ? 'Gerando...' : 'Baixar JSON'}
            </button>
          </div>

          {/* Card 2: Excluir */}
          <div className="bg-white rounded-2xl shadow-md p-5 md:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-extrabold">Excluir minha conta</h2>
                <p className="text-xs text-muted-foreground">LGPD art. 18 VI — eliminação</p>
              </div>
              <button
                onClick={() => void refresh()}
                disabled={loading}
                className="ml-auto p-2 rounded-full hover:bg-muted transition-colors"
                title="Atualizar status"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {isPendingDeletion ? (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-amber-700" />
                  <p className="text-sm font-bold text-amber-900">
                    Exclusão programada
                  </p>
                </div>
                <p className="text-xs text-amber-900 mb-3">
                  Sua conta será purgada em{' '}
                  <strong>{deletionStatus?.days_remaining} dias</strong>.
                  Você pode cancelar a qualquer momento até lá.
                </p>
                <button
                  onClick={() => void cancelDeletion('Cancelado pelo usuário')}
                  disabled={cancelling}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border-2 border-amber-300 text-amber-900 text-xs font-bold uppercase tracking-widest hover:bg-amber-50 transition-colors disabled:opacity-50"
                >
                  {cancelling ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                  Cancelar exclusão
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm mb-2">
                  Solicita exclusão definitiva da sua conta. Por segurança,
                  aplicamos cooldown de <strong>30 dias</strong> antes da purga
                  real — pode cancelar a qualquer momento durante este período.
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Pedidos completos permanecem por 5 anos por obrigação fiscal,
                  mas são anonimizados (perdem nome, telefone, email).
                </p>
                {!showConfirmDelete ? (
                  <button
                    onClick={() => setShowConfirmDelete(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border-2 border-red-300 text-red-700 text-xs font-bold uppercase tracking-widest hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Solicitar exclusão
                  </button>
                ) : (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                    <p className="text-sm font-bold text-red-900 mb-2">
                      Tem certeza?
                    </p>
                    <textarea
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      placeholder="Motivo (opcional)"
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-red-200 text-sm mb-3 bg-white"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowConfirmDelete(false)}
                        className="flex-1 px-4 py-2 rounded-full bg-white border-2 border-muted-foreground/30 text-muted-foreground text-xs font-bold uppercase tracking-widest"
                      >
                        Voltar
                      </button>
                      <button
                        onClick={handleRequestDelete}
                        disabled={requesting}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                      >
                        {requesting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        Confirmar
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground italic text-center">
            Outras solicitações LGPD (correção, anonimização, info sobre
            compartilhamento) podem ser enviadas pelos canais de suporte.
          </p>
        </div>
      </div>
    </>
  );
}
