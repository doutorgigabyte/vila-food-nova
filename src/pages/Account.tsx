import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Save, 
  MapPin,
  CreditCard,
  Calendar,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import MarketplaceHeader from "@/components/marketplace/MarketplaceHeader";
import Footer from "@/components/landing/Footer";

interface ProfileAddress {
  zip_code?: string;
  street_name?: string;
  street_number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  cpf: string;
  birth_date: string;
  default_address: ProfileAddress;
}

const Account = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<ProfileData>({
    full_name: "",
    email: "",
    phone: "",
    cpf: "",
    birth_date: "",
    default_address: {
      zip_code: "",
      street_name: "",
      street_number: "",
      neighborhood: "",
      city: "",
      state: "",
    },
  });

  // Calcular progresso do perfil
  const profileCompletion = useMemo(() => {
    const fields = [
      { key: 'full_name', label: 'Nome completo', filled: !!formData.full_name, required: true },
      { key: 'email', label: 'E-mail', filled: !!formData.email, required: true },
      { key: 'phone', label: 'Telefone', filled: !!formData.phone, required: true },
      { key: 'cpf', label: 'CPF', filled: !!formData.cpf, required: true },
      { key: 'birth_date', label: 'Data de nascimento', filled: !!formData.birth_date, required: false },
      { key: 'address', label: 'Endereço', filled: !!(formData.default_address.street_name && formData.default_address.city), required: false },
    ];

    const requiredFields = fields.filter(f => f.required);
    const filledRequired = requiredFields.filter(f => f.filled).length;
    const totalFilled = fields.filter(f => f.filled).length;
    
    return {
      fields,
      percentage: Math.round((totalFilled / fields.length) * 100),
      requiredComplete: filledRequired === requiredFields.length,
      missingRequired: requiredFields.filter(f => !f.filled),
    };
  }, [formData]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      loadUserData();
    }
  }, [user, authLoading, navigate]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const fullName = user.user_metadata?.full_name || "";
      const email = user.email || "";
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone, cpf, birth_date, default_address")
        .eq("id", user.id)
        .single();

      const defaultAddr = profile?.default_address as ProfileAddress || {};

      setFormData({
        full_name: fullName,
        email: email,
        phone: profile?.phone || "",
        cpf: profile?.cpf || "",
        birth_date: profile?.birth_date || "",
        default_address: {
          zip_code: defaultAddr.zip_code || "",
          street_name: defaultAddr.street_name || "",
          street_number: defaultAddr.street_number || "",
          neighborhood: defaultAddr.neighborhood || "",
          city: defaultAddr.city || "",
          state: defaultAddr.state || "",
        },
      });
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 8);
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
  };

  const handleSave = async () => {
    if (!user) return;

    // Validar campos obrigatórios
    if (!formData.full_name || !formData.phone || !formData.cpf) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Validar CPF (11 dígitos)
    const cpfNumbers = formData.cpf.replace(/\D/g, '');
    if (cpfNumbers.length !== 11) {
      toast.error("CPF inválido");
      return;
    }

    try {
      setSaving(true);

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name,
        },
      });

      if (updateError) throw updateError;

      const addressToSave = formData.default_address.street_name 
        ? JSON.parse(JSON.stringify(formData.default_address)) 
        : null;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name || null,
          phone: formData.phone.replace(/\D/g, '') || null,
          cpf: formData.cpf.replace(/\D/g, '') || null,
          birth_date: formData.birth_date || null,
          default_address: addressToSave,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast.success("Dados atualizados com sucesso!");
    } catch (error: any) {
      console.error("Error saving:", error);
      toast.error(error.message || "Erro ao salvar dados");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MarketplaceHeader searchTerm="" onSearchChange={() => {}} />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Minha Conta</h1>
          <p className="text-muted-foreground mt-1">
            Complete seu perfil para uma melhor experiência de compra
          </p>
        </div>

        {/* Barra de Progresso do Perfil */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Perfil {profileCompletion.percentage}% completo</span>
              {profileCompletion.requiredComplete ? (
                <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Dados obrigatórios preenchidos
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {profileCompletion.missingRequired.length} campo(s) obrigatório(s)
                </Badge>
              )}
            </div>
            <Progress value={profileCompletion.percentage} className="h-2" />
            
            {!profileCompletion.requiredComplete && (
              <p className="text-xs text-muted-foreground mt-2">
                Campos faltando: {profileCompletion.missingRequired.map(f => f.label).join(', ')}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
              {profileCompletion.fields.map((field) => (
                <Badge 
                  key={field.key} 
                  variant={field.filled ? "default" : "outline"}
                  className={field.filled ? "bg-green-500/10 text-green-600 border-green-500/20" : ""}
                >
                  {field.filled ? (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  ) : (
                    <AlertCircle className="w-3 h-3 mr-1" />
                  )}
                  {field.label}
                  {field.required && !field.filled && <span className="text-destructive ml-1">*</span>}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Informações Pessoais */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>
              Dados obrigatórios para realizar compras
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">
                  Nome Completo <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="full_name"
                    className="pl-10"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-10 bg-muted"
                    value={formData.email}
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Telefone/WhatsApp <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    className="pl-10"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">
                  CPF <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="cpf"
                    className="pl-10"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                    placeholder="000.000.000-00"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Necessário para pagamentos com cartão
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="birth_date"
                  type="date"
                  className="pl-10"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endereço Padrão */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Endereço Padrão
            </CardTitle>
            <CardDescription>
              Será usado como sugestão para entregas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zip_code">CEP</Label>
                <Input
                  id="zip_code"
                  value={formData.default_address.zip_code}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    default_address: { 
                      ...formData.default_address, 
                      zip_code: formatCEP(e.target.value) 
                    } 
                  })}
                  placeholder="00000-000"
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="street_name">Rua/Avenida</Label>
                <Input
                  id="street_name"
                  value={formData.default_address.street_name}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    default_address: { ...formData.default_address, street_name: e.target.value } 
                  })}
                  placeholder="Nome da rua"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="street_number">Número</Label>
                <Input
                  id="street_number"
                  value={formData.default_address.street_number}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    default_address: { ...formData.default_address, street_number: e.target.value } 
                  })}
                  placeholder="123"
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={formData.default_address.neighborhood}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    default_address: { ...formData.default_address, neighborhood: e.target.value } 
                  })}
                  placeholder="Bairro"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.default_address.city}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    default_address: { ...formData.default_address, city: e.target.value } 
                  })}
                  placeholder="Cidade"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.default_address.state}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    default_address: { ...formData.default_address, state: e.target.value.toUpperCase().slice(0, 2) } 
                  })}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Save className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Account;
