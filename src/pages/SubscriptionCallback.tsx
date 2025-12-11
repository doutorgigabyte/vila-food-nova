import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserEstablishment } from "@/hooks/useDashboardData";
import { supabase } from "@/integrations/supabase/client";

type CallbackStatus = "loading" | "success" | "pending" | "failure";

const SubscriptionCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { establishmentId } = useUserEstablishment();
  const [status, setStatus] = useState<CallbackStatus>("loading");
  const [establishmentSlug, setEstablishmentSlug] = useState<string | null>(null);

  // Mercado Pago query params
  const preapprovalId = searchParams.get("preapproval_id");
  const paymentStatus = searchParams.get("status");
  const externalReference = searchParams.get("external_reference");

  // Fetch establishment slug
  useEffect(() => {
    const fetchSlug = async () => {
      if (establishmentId) {
        const { data } = await supabase
          .from("establishments")
          .select("slug")
          .eq("id", establishmentId)
          .single();
        if (data?.slug) setEstablishmentSlug(data.slug);
      }
    };
    fetchSlug();
  }, [establishmentId]);

  useEffect(() => {
    // Determine status based on MP callback params
    if (paymentStatus === "authorized" || paymentStatus === "approved") {
      setStatus("success");
    } else if (paymentStatus === "pending") {
      setStatus("pending");
    } else if (paymentStatus === "rejected" || paymentStatus === "cancelled") {
      setStatus("failure");
    } else {
      // If no status, assume loading/processing
      setTimeout(() => {
        // Check if preapproval_id exists - likely success
        if (preapprovalId) {
          setStatus("pending");
        } else {
          setStatus("failure");
        }
      }, 2000);
    }
  }, [paymentStatus, preapprovalId]);

  const dashboardUrl = establishmentSlug 
    ? `/painel/${establishmentSlug}` 
    : "/painel";

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
              <CardTitle>Processando sua assinatura...</CardTitle>
              <CardDescription>
                Aguarde enquanto confirmamos seu pagamento com o Mercado Pago.
              </CardDescription>
            </CardContent>
          </Card>
        );

      case "success":
        return (
          <Card className="max-w-md mx-auto border-green-500/30">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 rounded-full bg-green-100 dark:bg-green-900/30 w-fit">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <CardTitle className="text-green-600">Assinatura Ativada!</CardTitle>
              <CardDescription>
                Seu plano foi ativado com sucesso. Você já pode aproveitar todos os recursos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground text-center">
                ID da assinatura: <code className="bg-muted px-1 rounded">{preapprovalId}</code>
              </div>
              <Button onClick={() => navigate(dashboardUrl)} className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                Ir para o Painel
              </Button>
            </CardContent>
          </Card>
        );

      case "pending":
        return (
          <Card className="max-w-md mx-auto border-yellow-500/30">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30 w-fit">
                <Loader2 className="h-12 w-12 text-yellow-600 animate-spin" />
              </div>
              <CardTitle className="text-yellow-600">Pagamento em Processamento</CardTitle>
              <CardDescription>
                Seu pagamento está sendo processado. Você receberá uma notificação assim que for confirmado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {preapprovalId && (
                <div className="text-sm text-muted-foreground text-center">
                  ID da assinatura: <code className="bg-muted px-1 rounded">{preapprovalId}</code>
                </div>
              )}
              <Button onClick={() => navigate(dashboardUrl)} className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                Ir para o Painel
              </Button>
            </CardContent>
          </Card>
        );

      case "failure":
        return (
          <Card className="max-w-md mx-auto border-destructive/30">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 rounded-full bg-red-100 dark:bg-red-900/30 w-fit">
                <XCircle className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle className="text-destructive">Falha no Pagamento</CardTitle>
              <CardDescription>
                Não foi possível processar seu pagamento. Por favor, tente novamente ou use outro método de pagamento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                onClick={() => navigate(`${dashboardUrl}/upgrade`)} 
                className="w-full"
              >
                Tentar Novamente
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate(dashboardUrl)} 
                className="w-full gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Painel
              </Button>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
      {renderContent()}
    </div>
  );
};

export default SubscriptionCallback;
