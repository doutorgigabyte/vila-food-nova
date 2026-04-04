import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, LogIn, UserPlus, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import logoHorizontal from "@/assets/logo-horizontal.png";

const RegisterEstablishment = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // If user is authenticated, show the onboarding wizard
  if (!loading && user) {
    return <OnboardingWizard />;
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <img src={logoHorizontal} alt="VilaFood" className="h-10 mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show login/register prompt
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8 px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-md mx-auto relative z-10">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </Link>

        <Card className="glass border-border/50">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center mb-4">
              <img src={logoHorizontal} alt="VilaFood" className="h-12" />
            </div>
            <CardTitle className="text-xl">Crie sua loja virtual</CardTitle>
            <CardDescription>
              Para criar seu estabelecimento, você precisa ter uma conta
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            {/* Benefits */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-6">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Cadastro rápido e guiado</p>
                  <p className="text-muted-foreground mt-1">
                    Em poucos minutos sua loja estará online, pronta para receber pedidos!
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => navigate("/auth?tab=register&redirect=/cadastro-estabelecimento")}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Criar minha conta
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Já tem conta?
                </span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full" 
              size="lg"
              onClick={() => navigate("/auth?redirect=/cadastro-estabelecimento")}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Fazer login
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              Ao criar sua conta, você concorda com nossos{" "}
              <Link to="/termos" className="text-primary hover:underline">
                Termos de Uso
              </Link>{" "}
              e{" "}
              <Link to="/privacidade" className="text-primary hover:underline">
                Política de Privacidade
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterEstablishment;
