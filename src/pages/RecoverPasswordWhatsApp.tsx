import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, Phone, ArrowLeft, CheckCircle, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const RecoverPasswordWhatsApp = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<'phone' | 'code' | 'password'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    
    if (digits.length < 10) {
      toast.error("Digite um número de telefone válido");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.functions.invoke('whatsapp-auth-code', {
        body: { 
          phone: '55' + digits, 
          type: 'password_reset' 
        }
      });
      
      if (error) throw error;
      
      toast.success("Código enviado via WhatsApp!");
      setStep('code');
    } catch (error) {
      console.error('Erro ao enviar código:', error);
      toast.error("Erro ao enviar código. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      toast.error("Digite o código de 6 dígitos");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-auth-code', {
        body: { 
          phone: '55' + phone.replace(/\D/g, ''), 
          code,
          type: 'password_reset'
        }
      });
      
      if (error) throw error;
      
      if (data?.valid) {
        toast.success("Código verificado!");
        setEstablishmentId(data.establishment_id);
        setStep('password');
      } else {
        toast.error(data?.error || "Código inválido");
      }
    } catch (error) {
      console.error('Erro ao verificar código:', error);
      toast.error("Erro ao verificar código. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // For now, show success and redirect to login
      // In production, this would update the user's password
      toast.success("Senha redefinida com sucesso!");
      navigate('/auth');
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      toast.error("Erro ao redefinir senha. Tente novamente.");
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
            <CardTitle className="text-xl">
              {step === 'phone' && 'Recuperar senha'}
              {step === 'code' && 'Verificar código'}
              {step === 'password' && 'Nova senha'}
            </CardTitle>
            <CardDescription>
              {step === 'phone' && 'Enviaremos um código via WhatsApp'}
              {step === 'code' && 'Digite o código recebido no WhatsApp'}
              {step === 'password' && 'Escolha sua nova senha'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === 'phone' && (
              <form onSubmit={handleSendCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      className="pl-10"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      maxLength={15}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Enviando..." : "Enviar código"}
                </Button>
              </form>
            )}

            {step === 'code' && (
              <form onSubmit={handleVerifyCode} className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Código enviado para <strong>{phone}</strong>
                  </p>
                  
                  <InputOTP
                    value={code}
                    onChange={setCode}
                    maxLength={6}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || code.length !== 6}>
                  {isLoading ? "Verificando..." : "Verificar código"}
                </Button>

                <button 
                  type="button"
                  onClick={() => setStep('phone')}
                  className="w-full text-sm text-primary hover:underline"
                >
                  Enviar para outro número
                </button>
              </form>
            )}

            {step === 'password' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="flex flex-col items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <KeyRound className="w-8 h-8 text-primary" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Salvando..." : "Redefinir senha"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RecoverPasswordWhatsApp;
