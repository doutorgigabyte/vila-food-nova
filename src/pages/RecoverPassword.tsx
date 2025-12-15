import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const RecoverPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Digite seu e-mail");
      return;
    }
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });
      
      if (error) {
        console.error("Password reset error:", error);
        toast.error("Erro ao enviar e-mail de recuperação. Tente novamente.");
      } else {
        setEmailSent(true);
        toast.success("E-mail de recuperação enviado!");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Erro inesperado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Link 
          to="/auth" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao login
        </Link>

        <Card className="glass border-border/50">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Utensils className="w-8 h-8 text-primary" />
              </div>
              <span className="text-2xl font-bold">
                Vila<span className="text-primary">Food</span>
              </span>
            </div>
            <CardTitle className="text-xl">Recuperar senha</CardTitle>
            <CardDescription>
              {emailSent 
                ? "Verifique seu e-mail para redefinir sua senha"
                : "Digite seu e-mail para receber o link de recuperação"
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {emailSent ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-muted-foreground mb-4">
                  Enviamos um link de recuperação para <strong>{email}</strong>
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Não recebeu? Verifique sua pasta de spam ou{" "}
                  <button 
                    onClick={() => setEmailSent(false)}
                    className="text-primary hover:underline"
                  >
                    tente novamente
                  </button>
                </p>
                <Link to="/auth">
                  <Button className="w-full">Voltar ao login</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Enviando..." : "Enviar link de recuperação"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RecoverPassword;
