import { AlertTriangle, Crown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface PlanLimitAlertProps {
  type: "products" | "videos" | "orders" | "whatsapp" | "ai";
  current: number;
  limit: number | null;
  planName: string;
  establishmentSlug?: string;
}

export const PlanLimitAlert = ({
  type,
  current,
  limit,
  planName,
  establishmentSlug,
}: PlanLimitAlertProps) => {
  // Unlimited check
  if (limit === null || limit === -1) return null;
  
  const percentage = (current / limit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = current >= limit;

  if (!isNearLimit) return null;

  const typeLabels: Record<string, string> = {
    products: "produtos",
    videos: "vídeos/stories",
    orders: "pedidos",
    whatsapp: "mensagens WhatsApp",
    ai: "créditos de IA",
  };

  const typeLabel = typeLabels[type] || type;

  return (
    <Alert variant={isAtLimit ? "destructive" : "default"} className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        {isAtLimit ? "Limite atingido" : "Próximo do limite"}
        <Badge variant="outline" className="text-xs">
          {planName}
        </Badge>
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p>
          Você está usando <strong>{current}</strong> de <strong>{limit}</strong> {typeLabel} do seu plano.
          {isAtLimit && " Para continuar adicionando, faça upgrade do seu plano."}
        </p>
        {establishmentSlug && (
          <Button asChild variant="outline" size="sm" className="mt-2 gap-1">
            <Link to={`/painel/${establishmentSlug}/configuracoes`}>
              <Crown className="w-4 h-4" />
              Ver planos
            </Link>
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

interface PlanFeatureLockedProps {
  featureName: string;
  planName: string;
  establishmentSlug?: string;
}

export const PlanFeatureLocked = ({
  featureName,
  planName,
  establishmentSlug,
}: PlanFeatureLockedProps) => {
  return (
    <Alert className="mb-4">
      <Crown className="h-4 w-4" />
      <AlertTitle>Recurso não disponível</AlertTitle>
      <AlertDescription className="mt-2">
        <p>
          <strong>{featureName}</strong> não está incluído no seu plano atual ({planName}).
        </p>
        {establishmentSlug && (
          <Button asChild variant="outline" size="sm" className="mt-2 gap-1">
            <Link to={`/painel/${establishmentSlug}/configuracoes`}>
              <Crown className="w-4 h-4" />
              Fazer upgrade
            </Link>
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};
