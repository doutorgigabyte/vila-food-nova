import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, ScrollText, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

// Port do CookieConsentBanner do Rota T (item 3.2 do roadmap, 6.3 LGPD).
// Mantém API compatível: mesma persistência local, mesma estrutura ConsentRecord,
// para que ferramentas de auditoria possam ler os 2 apps com 1 parser.
//
// Diferenças visuais:
//   - paleta vermelha do Vila Food em vez do azul do Rota T
//   - usa Link do react-router-dom em vez de onNavigate prop
//   - framer-motion (não motion/react)

const STORAGE_KEY = 'vilafood_lgpd_consent_v1';

export interface ConsentRecord {
  accepted_at: string;
  level: 'essential' | 'all';
  version: 1;
}

export function readConsent(): ConsentRecord | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentRecord;
    return parsed.version === 1 ? parsed : null;
  } catch {
    return null;
  }
}

export function revokeConsent() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  } catch {
    // ignore
  }
}

function saveConsent(level: ConsentRecord['level']) {
  if (typeof window === 'undefined') return;
  const record: ConsentRecord = {
    accepted_at: new Date().toISOString(),
    level,
    version: 1,
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // localStorage indisponivel: consent vira ephemeral
  }
}

export default function CookieConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!readConsent()) setShow(true);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  const accept = (level: ConsentRecord['level']) => {
    saveConsent(level);
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          role="dialog"
          aria-label="Aviso de cookies e LGPD"
          className="fixed bottom-3 left-3 right-3 md:left-auto md:bottom-5 md:right-5 md:max-w-md z-[90] bg-white shadow-2xl border-2 border-primary/30 rounded-3xl p-4 md:p-5"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Cookie className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-extrabold text-foreground mb-1">
                Cookies e dados pessoais
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Usamos cookies essenciais pro funcionamento da plataforma (login, carrinho).
                Conforme a <strong>LGPD</strong>, dados são tratados só pra processar pedidos.{' '}
                <Link
                  to="/terms-of-use"
                  className="text-primary font-bold hover:underline inline-flex items-center gap-0.5"
                >
                  <ScrollText className="w-3 h-3" /> Ver termos completos
                </Link>
              </p>
              <div className="flex flex-col-reverse md:flex-row md:items-center gap-2">
                <button
                  onClick={() => accept('essential')}
                  className="flex-1 md:flex-none px-4 py-2 rounded-full bg-white border-2 border-muted-foreground/30 text-muted-foreground text-xs font-bold uppercase tracking-widest hover:bg-muted transition-colors"
                >
                  Só essenciais
                </button>
                <button
                  onClick={() => accept('all')}
                  className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  <Check className="w-3.5 h-3.5" /> Aceitar tudo
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
