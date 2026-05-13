import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bike, Package, Calculator, TrendingDown, Sparkles, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import CoinEaterAnimation from "./CoinEaterAnimation";
type Step = 1 | 2 | 3 | 4;
type DeliveryType = "own" | "ifood" | null;

interface CalculationResult {
  ifoodTax: number;
  ifoodPercentage: number;
  vilafoodTax: number;
  savings: number;
  remaining: number;
}

const IFOOD_BASIC_COMMISSION = 0.12;
const IFOOD_DELIVERY_COMMISSION = 0.23;
const IFOOD_PAYMENT_FEE = 0.032;
const IFOOD_BASIC_MONTHLY = 100;
const IFOOD_DELIVERY_MONTHLY = 130;
const IFOOD_MONTHLY_THRESHOLD = 1800;

const VILAFOOD_COMMISSION = 0; // Sem taxa de marketplace
const VILAFOOD_PER_ORDER = 0; // Sem taxa por pedido
const AVG_ORDER_VALUE = 45;

// Limites para o input do faturamento mensal — protege contra valores absurdos
// que indicam erro de digitação (ex: usuario coloca 100000 sem virgula).
const REVENUE_MIN = 100;
const REVENUE_MAX = 10_000_000;

const loadingPhrases = [
  "Analisando taxas do contrato...",
  "Verificando comissões...",
  "Calculando o custo real...",
  "Comparando com VilaFood...",
  "Finalizando análise...",
];

const IFoodCalculator = () => {
  const [step, setStep] = useState<Step>(1);
  const [revenue, setRevenue] = useState<string>("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loadingPhrase, setLoadingPhrase] = useState(0);
  const [progress, setProgress] = useState(0);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleRevenueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    const numValue = parseInt(value) || 0;
    setRevenue(numValue.toLocaleString("pt-BR"));
  };

  const parseRevenue = (): number => {
    return parseInt(revenue.replace(/\D/g, "")) || 0;
  };

  const calculateResult = useCallback((): CalculationResult => {
    const revenueValue = parseRevenue();
    const commission = deliveryType === "own" ? IFOOD_BASIC_COMMISSION : IFOOD_DELIVERY_COMMISSION;
    const monthlyFee = deliveryType === "own" ? IFOOD_BASIC_MONTHLY : IFOOD_DELIVERY_MONTHLY;
    
    // iFood calculation
    const ifoodCommission = revenueValue * commission;
    const ifoodPaymentFee = revenueValue * IFOOD_PAYMENT_FEE;
    const ifoodMonthly = revenueValue > IFOOD_MONTHLY_THRESHOLD ? monthlyFee : 0;
    const ifoodTax = ifoodCommission + ifoodPaymentFee + ifoodMonthly;
    const ifoodPercentage = (ifoodTax / revenueValue) * 100;
    
    // VilaFood calculation (0% taxa - cliente paga direto para a loja)
    const vilafoodTax = 0;
    
    const savings = ifoodTax - vilafoodTax;
    const remaining = revenueValue - vilafoodTax;
    
    return {
      ifoodTax,
      ifoodPercentage,
      vilafoodTax,
      savings,
      remaining,
    };
  }, [deliveryType, revenue]);

  const handleDeliverySelect = (type: DeliveryType) => {
    setDeliveryType(type);
    setStep(3);
  };

  const revenueValue = parseRevenue();
  const revenueValid = revenueValue >= REVENUE_MIN && revenueValue <= REVENUE_MAX;
  const revenueValidationMessage =
    revenueValue > 0 && revenueValue < REVENUE_MIN
      ? `Valor mínimo: ${formatCurrency(REVENUE_MIN)}`
      : revenueValue > REVENUE_MAX
        ? `Valor máximo: ${formatCurrency(REVENUE_MAX)} (verifique se digitou correto)`
        : null;

  const handleAdvance = () => {
    if (revenueValid) {
      setStep(2);
    }
  };

  const handleReset = () => {
    setStep(1);
    setRevenue("");
    setDeliveryType(null);
    setResult(null);
    setProgress(0);
    setLoadingPhrase(0);
  };

  // Loading animation effect
  useEffect(() => {
    if (step === 3) {
      const phraseInterval = setInterval(() => {
        setLoadingPhrase((prev) => (prev + 1) % loadingPhrases.length);
      }, 600);

      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) return 100;
          return prev + 2;
        });
      }, 60);

      const timeout = setTimeout(() => {
        setResult(calculateResult());
        setStep(4);
      }, 3000);

      return () => {
        clearInterval(phraseInterval);
        clearInterval(progressInterval);
        clearTimeout(timeout);
      };
    }
  }, [step, calculateResult]);

  return (
    <section className="py-12 md:py-20 relative overflow-hidden" id="calculadora">
      {/* Dark background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,20%,8%)] via-[hsl(220,20%,10%)] to-[hsl(220,20%,8%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)_/_0.1)_0%,_transparent_70%)]" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-destructive/20 border border-destructive/30 mb-4 md:mb-6">
            <Calculator className="h-3 w-3 md:h-4 md:w-4 text-destructive" />
            <span className="text-xs md:text-sm font-medium text-destructive">Calculadora de Perdas</span>
          </div>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-3 md:mb-4">
            <span className="block">Quanto você paga</span>
            <span className="flex items-center justify-center gap-1">
              <span className="text-destructive">em taxas</span>
              <CoinEaterAnimation />
            </span>
            <span className="block">do seu faturamento?</span>
          </h2>
          <p className="text-sm md:text-lg text-white/60 max-w-2xl mx-auto">
            Descubra em segundos quanto fica com o marketplace em taxas e comissões
          </p>
        </div>

        {/* Calculator Card */}
        <div className="max-w-xl mx-auto">
          <div className="rounded-2xl md:rounded-3xl bg-[hsl(220,20%,12%)] border border-white/10 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
            
            {/* Step 1: Revenue Input */}
            {step === 1 && (
              <div className="animate-fade-up">
                <label className="block text-white/80 text-sm md:text-base mb-4 text-center">
                  Quanto você vendeu no iFood este mês? (Total Bruto)
                </label>
                <div className="relative mb-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 text-lg md:text-xl font-medium">
                    R$
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={revenue}
                    onChange={handleRevenueChange}
                    onKeyDown={(e) => { if (e.key === 'Enter' && revenueValid) handleAdvance(); }}
                    placeholder="0"
                    aria-invalid={revenueValue > 0 && !revenueValid}
                    aria-describedby="revenue-help"
                    className="w-full bg-white/5 border border-white/20 rounded-xl md:rounded-2xl px-12 py-4 md:py-5 text-2xl md:text-4xl font-bold text-white text-center focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-white/30 transition-all aria-[invalid=true]:border-destructive aria-[invalid=true]:focus:ring-destructive"
                    autoFocus
                  />
                </div>
                <p
                  id="revenue-help"
                  className={`text-xs text-center mb-6 min-h-[1rem] ${
                    revenueValidationMessage ? 'text-destructive' : 'text-white/40'
                  }`}
                >
                  {revenueValidationMessage ?? 'Faturamento mensal bruto (somente vendas)'}
                </p>
                <Button
                  onClick={handleAdvance}
                  disabled={!revenueValid}
                  className="w-full py-5 md:py-6 text-base md:text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl md:rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Avançar
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}

            {/* Step 2: Delivery Type */}
            {step === 2 && (
              <div className="animate-fade-up">
                <p className="text-white/80 text-sm md:text-base mb-6 text-center">
                  Quem faz a entrega dos seus pedidos?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleDeliverySelect("own")}
                    className="group flex flex-col items-center gap-3 p-6 md:p-8 rounded-xl md:rounded-2xl bg-white/5 border border-white/20 hover:border-primary hover:bg-primary/10 transition-all"
                  >
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Bike className="h-7 w-7 md:h-8 md:w-8 text-green-400" />
                    </div>
                    <span className="text-white font-semibold text-sm md:text-base">Meus Motoboys</span>
                    <span className="text-white/50 text-xs">Plano Básico (12%)</span>
                  </button>
                  <button
                    onClick={() => handleDeliverySelect("ifood")}
                    className="group flex flex-col items-center gap-3 p-6 md:p-8 rounded-xl md:rounded-2xl bg-white/5 border border-white/20 hover:border-destructive hover:bg-destructive/10 transition-all"
                  >
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-destructive/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Package className="h-7 w-7 md:h-8 md:w-8 text-destructive" />
                    </div>
                    <span className="text-white font-semibold text-sm md:text-base">Parceiro iFood</span>
                    <span className="text-white/50 text-xs">Plano Entrega (23%)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Loading Animation */}
            {step === 3 && (
              <div className="animate-fade-up text-center py-8">
                <div className="relative w-20 h-20 md:w-24 md:h-24 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                  <div 
                    className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
                    style={{ animationDuration: "1s" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg md:text-xl font-bold text-white">{progress}%</span>
                  </div>
                </div>
                <p className="text-white/80 text-sm md:text-base h-6 transition-all">
                  {loadingPhrases[loadingPhrase]}
                </p>
                {/* Progress bar */}
                <div className="mt-6 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-100 ease-linear rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Results */}
            {step === 4 && result && (
              <div className="animate-fade-up">
                {/* iFood takes */}
                <div className="text-center mb-6 p-4 md:p-6 rounded-xl md:rounded-2xl bg-destructive/10 border border-destructive/30">
                  <p className="text-white/60 text-sm mb-2">O iFood ficou com:</p>
                  <p className="text-3xl md:text-5xl font-bold text-destructive mb-2">
                    {formatCurrency(result.ifoodTax)}
                  </p>
                  <p className="text-destructive/80 text-sm md:text-base">
                    {result.ifoodPercentage.toFixed(1)}% do seu faturamento
                  </p>
                </div>

                {/* Savings with VilaFood */}
                <div className="text-center mb-6 p-4 md:p-6 rounded-xl md:rounded-2xl bg-green-500/10 border border-green-500/30">
                  <p className="text-white/60 text-sm mb-2">Com VilaFood você economizaria:</p>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingDown className="h-6 w-6 md:h-8 md:w-8 text-green-400" />
                    <p className="text-3xl md:text-5xl font-bold text-green-400">
                      {formatCurrency(result.savings)}
                    </p>
                  </div>
                  <p className="text-green-400/80 text-xs md:text-sm">
                    Taxa VilaFood: 0% - Cliente paga direto para você
                  </p>
                </div>

                {/* Remaining */}
                <div className="text-center mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-white/60 text-xs md:text-sm mb-1">Sobra para sua operação:</p>
                  <p className="text-xl md:text-2xl font-bold text-white">
                    {formatCurrency(result.remaining)}
                  </p>
                </div>

                {/* CTAs */}
                <div className="space-y-3">
                  <Link to="/cadastro-estabelecimento" className="block">
                    <Button className="w-full py-5 md:py-6 text-base md:text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground rounded-xl md:rounded-2xl">
                      <Sparkles className="mr-2 h-5 w-5" />
                      Quero Economizar
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={handleReset}
                    className="w-full py-4 text-white/60 hover:text-white hover:bg-white/5 rounded-xl"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Refazer Cálculo
                  </Button>
                </div>

                {/* Disclaimer */}
                <p className="text-white/50 text-xs text-center mt-4 leading-relaxed">
                  *Cálculo baseado em taxas públicas do iFood vigentes em 2026
                  (comissão {(IFOOD_BASIC_COMMISSION * 100).toFixed(0)}–{(IFOOD_DELIVERY_COMMISSION * 100).toFixed(0)}% +
                  taxa de pagamento {(IFOOD_PAYMENT_FEE * 100).toFixed(1)}% +
                  mensalidade R${IFOOD_BASIC_MONTHLY}–R${IFOOD_DELIVERY_MONTHLY} acima de R${IFOOD_MONTHLY_THRESHOLD}).
                  Ticket médio estimado em R${AVG_ORDER_VALUE}. Valores reais podem variar conforme o contrato.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default IFoodCalculator;
