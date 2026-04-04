import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { validatePassword } from "@/lib/passwordValidation";
import { useValidateInvitation } from "@/hooks/useDriverInvitation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoHorizontal from "@/assets/logo-horizontal.png";
import {
  ArrowLeft,
  Bike,
  Car,
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Store,
  CheckCircle2
} from "lucide-react";

const vehicleTypes = [
  { value: "motorcycle", label: "Moto", icon: Bike },
  { value: "car", label: "Carro", icon: Car },
  { value: "bicycle", label: "Bicicleta", icon: Bike },
];

export default function DriverRegister() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");
  
  const { user, signUp } = useAuth();
  const { 
    loading: validatingToken, 
    establishmentName, 
    establishmentId,
    validateToken,
    markTokenAsUsed
  } = useValidateInvitation();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [vehicleType, setVehicleType] = useState("motorcycle");
  const [licensePlate, setLicensePlate] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState("phone");

  // Validate invite token on load
  useEffect(() => {
    if (inviteToken) {
      validateToken(inviteToken).then(isValid => {
        setTokenValid(isValid);
        if (!isValid) {
          toast.error("Link de convite inválido ou expirado");
        }
      });
    }
  }, [inviteToken, validateToken]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/entregador');
    }
  }, [user, navigate]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return value;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !phone || !password || !confirmPassword) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!acceptedTerms) {
      toast.error("Você precisa aceitar os Termos de Uso");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      toast.error("A senha não atende aos requisitos mínimos");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create user account
      const { error: authError, data: authData } = await signUp(email, password, name, acceptedTerms);
      
      if (authError) {
        if (authError.message.includes('already registered')) {
          toast.error("Este e-mail já está cadastrado");
        } else {
          toast.error(authError.message || "Erro ao criar conta");
        }
        return;
      }

      if (!authData?.user) {
        toast.error("Erro ao criar conta");
        return;
      }

      // 2. Create driver profile (without establishment_id - independent driver)
      const { data: driverData, error: driverError } = await supabase
        .from('delivery_drivers')
        .insert({
          user_id: authData.user.id,
          name,
          phone: phone.replace(/\D/g, ""),
          email,
          vehicle_type: vehicleType,
          license_plate: licensePlate || null,
          pix_key: pixKey || null,
          pix_key_type: pixKey ? pixKeyType : null,
          is_active: true,
          is_available: false
        })
        .select()
        .single();

      if (driverError) {
        console.error("Error creating driver:", driverError);
        toast.error("Erro ao criar perfil de entregador");
        return;
      }

      // 3. If invite token, create link to establishment
      if (inviteToken && tokenValid && establishmentId && driverData) {
        const { error: linkError } = await supabase
          .from('driver_establishment_links')
          .insert({
            driver_id: driverData.id,
            establishment_id: establishmentId,
            status: 'pending',
            linked_via: 'invitation'
          });

        if (linkError) {
          console.error("Error creating link:", linkError);
          // Don't fail registration, just log
        } else {
          // Mark token as used
          await markTokenAsUsed(inviteToken, driverData.id);
        }
      }

      toast.success("Conta criada com sucesso!");
      
      // Redirect to driver app
      if (authData.session) {
        navigate('/entregador');
      } else {
        // Email confirmation required
        toast.info("Verifique seu e-mail para confirmar a conta");
        navigate('/auth');
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Erro ao criar conta");
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

      <div className="w-full max-w-lg relative z-10">
        {/* Back link */}
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
            <CardTitle className="text-xl">Cadastro de Entregador</CardTitle>
            <CardDescription>
              Crie sua conta para começar a fazer entregas
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Invitation Badge */}
            {inviteToken && (
              <div className="mb-6">
                {validatingToken ? (
                  <Skeleton className="h-12 w-full" />
                ) : tokenValid ? (
                  <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-green-700 dark:text-green-400">
                        Convite válido
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Store className="w-3 h-3" />
                        Você será vinculado a: <strong>{establishmentName}</strong>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive">
                      Link de convite inválido ou expirado. Você ainda pode se cadastrar, 
                      mas precisará se vincular manualmente a estabelecimentos.
                    </p>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Seu nome completo"
                    className="pl-10"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
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

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    className="pl-10"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                  />
                </div>
              </div>

              {/* Vehicle Type */}
              <div className="space-y-2">
                <Label>Tipo de veículo *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {vehicleTypes.map((type) => (
                    <Button
                      key={type.value}
                      type="button"
                      variant={vehicleType === type.value ? "default" : "outline"}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                      onClick={() => setVehicleType(type.value)}
                    >
                      <type.icon className="w-5 h-5" />
                      <span className="text-xs">{type.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* License Plate */}
              {vehicleType !== "bicycle" && (
                <div className="space-y-2">
                  <Label htmlFor="licensePlate">Placa do veículo</Label>
                  <Input
                    id="licensePlate"
                    placeholder="ABC-1234"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                  />
                </div>
              )}

              {/* PIX Key */}
              <div className="space-y-2">
                <Label>Chave PIX (para receber pagamentos)</Label>
                <div className="flex gap-2">
                  <Select value={pixKeyType} onValueChange={setPixKeyType}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">Telefone</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="random">Aleatória</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Sua chave PIX"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Crie uma senha forte"
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrengthIndicator password={password} />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Repita sua senha"
                    className="pl-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="accept-terms" 
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                  className="mt-1"
                />
                <Label 
                  htmlFor="accept-terms" 
                  className="text-sm font-normal cursor-pointer leading-relaxed"
                >
                  Li e aceito os{" "}
                  <Link to="/termos" className="text-primary hover:underline" target="_blank">
                    Termos de Uso
                  </Link>{" "}
                  e{" "}
                  <Link to="/privacidade" className="text-primary hover:underline" target="_blank">
                    Política de Privacidade
                  </Link>
                  . *
                </Label>
              </div>

              {/* Submit */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !acceptedTerms || !validatePassword(password).isValid}
              >
                {isLoading ? "Criando conta..." : "Criar conta de entregador"}
              </Button>

              {/* Login link */}
              <p className="text-center text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <Link to="/auth" className="text-primary hover:underline">
                  Faça login
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
