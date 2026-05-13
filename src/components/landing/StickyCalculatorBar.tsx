import { useEffect, useState } from "react";
import { Calculator, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLandingAnalytics } from "@/hooks/useLandingAnalytics";

const SCROLL_THRESHOLD = 600; // mostra apos passar do hero (~600px)
const DISMISS_KEY = "vilafood_sticky_calc_dismissed_v1";

/**
 * Barra fixa no rodape que aparece apos o usuario rolar alem do hero.
 * Captura faturamento mensal e leva pro calculator com o valor pre-preenchido
 * (via hash, lido no IFoodCalculator). Pode ser dispensada — guarda em
 * localStorage por 1 sessao (ate proximo reload).
 */
const StickyCalculatorBar = () => {
  const { trackCTAClick } = useLandingAnalytics();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [revenue, setRevenue] = useState("");

  useEffect(() => {
    // Verifica dismiss em sessao
    if (typeof window !== "undefined" && sessionStorage.getItem(DISMISS_KEY) === "1") {
      setDismissed(true);
      return;
    }

    let lastShouldShow = false;
    const onScroll = () => {
      const shouldShow = window.scrollY > SCROLL_THRESHOLD;
      if (shouldShow !== lastShouldShow) {
        lastShouldShow = shouldShow;
        setVisible(shouldShow);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(DISMISS_KEY, "1");
    }
    trackCTAClick({
      ctaText: "Dispensar sticky bar",
      ctaLocation: "sticky_calculator",
      destination: "dismiss",
    });
  };

  const handleRevenueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    const num = parseInt(digits) || 0;
    setRevenue(num ? num.toLocaleString("pt-BR") : "");
  };

  const handleCalculate = () => {
    const calc = document.getElementById("calculadora");
    trackCTAClick({
      ctaText: "Calcular agora (sticky)",
      ctaLocation: "sticky_calculator",
      destination: "#calculadora",
    });
    if (calc) {
      calc.scrollIntoView({ behavior: "smooth" });
      // Pre-preenche o input via hash + customEvent. O calculator escuta
      // este evento (ver IFoodCalculator.tsx) — fallback: usuario digita la.
      window.dispatchEvent(
        new CustomEvent("vilafood:calculator-prefill", {
          detail: { revenue: parseInt(revenue.replace(/\D/g, "")) || 0 },
        })
      );
    }
  };

  if (dismissed || !visible) return null;

  return (
    <div
      role="region"
      aria-label="Barra de cálculo de economia"
      className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border shadow-2xl animate-fade-up"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
            <Calculator className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground hidden md:block">
              Quanto você paga em taxas?
            </p>
            <p className="text-xs text-muted-foreground hidden md:block">
              Calcule sua economia em segundos
            </p>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            <div className="relative flex-1 sm:w-40 md:w-48">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                R$
              </span>
              <Input
                type="text"
                inputMode="numeric"
                value={revenue}
                onChange={handleRevenueChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCalculate();
                }}
                placeholder="Faturamento/mês"
                className="pl-9 h-10 text-sm"
                aria-label="Faturamento mensal"
              />
            </div>
            <Button
              onClick={handleCalculate}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap"
            >
              Calcular
            </Button>
          </div>

          <button
            onClick={handleDismiss}
            className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Fechar barra"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StickyCalculatorBar;
