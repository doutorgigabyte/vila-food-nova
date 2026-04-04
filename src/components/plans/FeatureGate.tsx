import { ReactNode } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface FeatureGateProps {
  children: ReactNode;
  isAllowed: boolean;
  featureName: string;
  requiredPlan?: string;
  establishmentSlug?: string;
  showOverlay?: boolean;
}

export const FeatureGate = ({
  children,
  isAllowed,
  featureName,
  requiredPlan = "Pro",
  establishmentSlug,
  showOverlay = true,
}: FeatureGateProps) => {
  const navigate = useNavigate();

  if (isAllowed) {
    return <>{children}</>;
  }

  if (!showOverlay) {
    return null;
  }

  const handleUpgrade = () => {
    if (establishmentSlug) {
      navigate(`/painel/${establishmentSlug}/upgrade`);
    } else {
      navigate("/precos");
    }
  };

  return (
    <div className="relative">
      {/* Conteúdo bloqueado com blur */}
      <div className="pointer-events-none select-none blur-sm opacity-50">
        {children}
      </div>

      {/* Overlay de bloqueio */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
        <Card className="max-w-sm mx-4 text-center border-2 border-dashed">
          <CardHeader className="pb-2">
            <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg">Recurso Bloqueado</CardTitle>
            <CardDescription>
              {featureName} está disponível a partir do plano {requiredPlan}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleUpgrade} className="w-full">
              Fazer Upgrade
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
