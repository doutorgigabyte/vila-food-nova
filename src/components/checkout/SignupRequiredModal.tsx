import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MessageSquare, CheckCircle2, ArrowLeft, ShoppingBag } from "lucide-react";

interface SignupRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  cartItemsCount: number;
  cartTotal: number;
}

type Step = "phone" | "code" | "name";

export function SignupRequiredModal({
  open,
  onOpenChange,
  onSuccess,
  cartItemsCount,
  cartTotal,
}: SignupRequiredModalProps) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // Format phone
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (step === "code") {
      setCanResend(true);
    }
  }, [countdown, step]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep("phone");
      setPhone("");
      setCode("");
      setName("");
      setCountdown(0);
      setCanResend(false);
    }
  }, [open]);

  const handleSendCode = async () => {
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      toast.error("Informe um número válido com DDD");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-auth-code", {
        body: { phone: phoneDigits, type: "verification" },
      });

      if (error) throw error;

      toast.success("Código enviado para seu WhatsApp!");
      setStep("code");
      setCountdown(180); // 3 minutes
      setCanResend(false);
    } catch (error: any) {
      console.error("Error sending code:", error);
      toast.error("Erro ao enviar código. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setCanResend(false);
    await handleSendCode();
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      toast.error("Digite o código completo de 6 dígitos");
      return;
    }

    setLoading(true);
    try {
      const phoneDigits = phone.replace(/\D/g, "");

      // Call Edge Function to verify code and create session
      const { data, error } = await supabase.functions.invoke("whatsapp-auth-session", {
        body: { phone: phoneDigits, code },
      });

      if (error) {
        console.error("Session error:", error);
        toast.error("Erro ao verificar código. Tente novamente.");
        setLoading(false);
        return;
      }

      // Check if name is required (new user)
      if (data?.error === "name_required" || data?.requires_name) {
        setStep("name");
        setLoading(false);
        return;
      }

      if (!data?.success) {
        toast.error(data?.error || "Código inválido ou expirado");
        setLoading(false);
        return;
      }

      // Use the token to verify OTP and create session
      const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
        email: data.email,
        token: data.token,
        type: 'magiclink',
      });

      if (otpError) {
        console.error("OTP verification error:", otpError);
        toast.error("Erro ao criar sessão. Tente novamente.");
        setLoading(false);
        return;
      }

      if (otpData?.user) {
        toast.success(`Bem-vindo de volta, ${data.name || 'usuário'}!`);
        onSuccess();
      } else {
        toast.error("Erro ao fazer login. Tente novamente.");
      }
    } catch (error: any) {
      console.error("Error verifying code:", error);
      toast.error("Erro ao verificar código. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!name.trim()) {
      toast.error("Informe seu nome");
      return;
    }

    setLoading(true);
    try {
      const phoneDigits = phone.replace(/\D/g, "");

      // Call Edge Function with name to create account and session
      const { data, error } = await supabase.functions.invoke("whatsapp-auth-session", {
        body: { phone: phoneDigits, code, name: name.trim() },
      });

      if (error) {
        console.error("Session error:", error);
        toast.error("Erro ao criar conta. Tente novamente.");
        setLoading(false);
        return;
      }

      if (!data?.success) {
        toast.error(data?.error || "Erro ao criar conta");
        setLoading(false);
        return;
      }

      // Use the token to verify OTP and create session
      const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
        email: data.email,
        token: data.token,
        type: 'magiclink',
      });

      if (otpError) {
        console.error("OTP verification error:", otpError);
        toast.error("Erro ao criar sessão. Tente novamente.");
        setLoading(false);
        return;
      }

      if (otpData?.user) {
        toast.success(`Conta criada! Bem-vindo, ${name}!`);
        onSuccess();
      } else {
        toast.error("Erro ao fazer login. Tente novamente.");
      }
    } catch (error: any) {
      console.error("Error creating account:", error);
      toast.error("Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === "phone" && <MessageSquare className="h-5 w-5 text-green-600" />}
            {step === "code" && <MessageSquare className="h-5 w-5 text-green-600" />}
            {step === "name" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            {step === "phone" && "Crie sua conta grátis"}
            {step === "code" && "Digite o código"}
            {step === "name" && "Quase lá!"}
          </DialogTitle>
          <DialogDescription>
            {step === "phone" && "Para finalizar seu pedido, crie uma conta rápida via WhatsApp"}
            {step === "code" && "Enviamos um código de 6 dígitos para seu WhatsApp"}
            {step === "name" && "Só precisamos do seu nome para concluir"}
          </DialogDescription>
        </DialogHeader>

        {/* Cart summary */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {cartItemsCount} {cartItemsCount === 1 ? "item" : "itens"} no carrinho
            </p>
            <p className="text-xs text-muted-foreground">Seu pedido será mantido</p>
          </div>
          <span className="font-bold text-primary">
            R$ {cartTotal.toFixed(2).replace(".", ",")}
          </span>
        </div>

        {/* Step: Phone */}
        {step === "phone" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Seu WhatsApp</Label>
              <Input
                id="phone"
                placeholder="(99) 99999-9999"
                value={phone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  if (digits.length <= 11) {
                    setPhone(formatPhone(digits));
                  }
                }}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Você receberá um código de verificação
              </p>
            </div>

            <Button
              onClick={handleSendCode}
              disabled={loading || phone.replace(/\D/g, "").length < 10}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <MessageSquare className="h-4 w-4 mr-2" />
              )}
              Enviar código via WhatsApp
            </Button>
          </div>
        )}

        {/* Step: Code */}
        {step === "code" && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={setCode}
                autoFocus
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

            {countdown > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                Código expira em <span className="font-mono font-medium">{formatTime(countdown)}</span>
              </p>
            )}

            {canResend && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={handleResendCode}
                disabled={loading}
              >
                Reenviar código
              </Button>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("phone")}
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleVerifyCode}
                disabled={loading || code.length !== 6}
                className="flex-1"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Verificar código
              </Button>
            </div>
          </div>
        )}

        {/* Step: Name */}
        {step === "name" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Seu nome</Label>
              <Input
                id="name"
                placeholder="Como podemos te chamar?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("code")}
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleCreateAccount}
                disabled={loading || !name.trim()}
                className="flex-1"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Criar conta e finalizar pedido
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
