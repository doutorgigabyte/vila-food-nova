import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Utensils, Mail, Lock, User, Phone, Building2, MapPin, ArrowLeft, Eye, EyeOff, Store, FileText } from "lucide-react";
import { toast } from "sonner";

const segments = [
  { value: "pizzaria", label: "Pizzaria" },
  { value: "hamburgueria", label: "Hamburgueria" },
  { value: "restaurante", label: "Restaurante" },
  { value: "lanchonete", label: "Lanchonete" },
  { value: "cafeteria", label: "Cafeteria" },
  { value: "doceria", label: "Doceria" },
  { value: "padaria", label: "Padaria" },
  { value: "acai", label: "Açaí e Sorvetes" },
  { value: "japonesa", label: "Comida Japonesa" },
  { value: "italiana", label: "Comida Italiana" },
  { value: "mexicana", label: "Comida Mexicana" },
  { value: "arabe", label: "Comida Árabe" },
  { value: "saudavel", label: "Comida Saudável" },
  { value: "marmitas", label: "Marmitas" },
  { value: "bebidas", label: "Bebidas" },
  { value: "mercado", label: "Mercado/Conveniência" },
  { value: "outros", label: "Outros" },
];

const RegisterEstablishment = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Step 1 - Personal data
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [password, setPassword] = useState("");
  
  // Step 2 - Establishment data
  const [establishmentName, setEstablishmentName] = useState("");
  const [segment, setSegment] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [subdomain, setSubdomain] = useState("");
  
  // Step 3 - Address
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  const handleNextStep = () => {
    if (step === 1) {
      if (!ownerName || !ownerEmail || !ownerPhone || !password) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }
      if (password.length < 6) {
        toast.error("A senha deve ter pelo menos 6 caracteres");
        return;
      }
    }
    if (step === 2) {
      if (!establishmentName || !segment || !subdomain) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }
    }
    setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cep || !address || !number || !neighborhood || !city || !state) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Cadastro realizado com sucesso! Verifique seu e-mail.");
    }, 2000);
  };

  const fetchCep = async (cepValue: string) => {
    if (cepValue.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepValue}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setAddress(data.logradouro || "");
          setNeighborhood(data.bairro || "");
          setCity(data.localidade || "");
          setState(data.uf || "");
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8 px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
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
            <CardTitle className="text-xl">Cadastro de Estabelecimento</CardTitle>
            <CardDescription>
              Crie sua loja virtual e comece a vender hoje mesmo
            </CardDescription>

            {/* Progress steps */}
            <div className="flex items-center justify-center gap-2 mt-6">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    s === step 
                      ? "bg-primary text-primary-foreground" 
                      : s < step 
                        ? "bg-green-500 text-white" 
                        : "bg-muted text-muted-foreground"
                  }`}>
                    {s < step ? "✓" : s}
                  </div>
                  {s < 3 && (
                    <div className={`w-12 h-1 mx-1 rounded ${s < step ? "bg-green-500" : "bg-muted"}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2 px-4">
              <span>Seus dados</span>
              <span>Estabelecimento</span>
              <span>Endereço</span>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit}>
              {/* Step 1 - Personal Data */}
              {step === 1 && (
                <div className="space-y-4 animate-fade-up">
                  <div className="space-y-2">
                    <Label htmlFor="owner-name">Nome completo *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="owner-name"
                        type="text"
                        placeholder="Seu nome completo"
                        className="pl-10"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="owner-email">E-mail *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="owner-email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10"
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="owner-phone">Telefone/WhatsApp *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="owner-phone"
                        type="tel"
                        placeholder="(00) 00000-0000"
                        className="pl-10"
                        value={ownerPhone}
                        onChange={(e) => setOwnerPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
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
                  </div>

                  <Button type="button" onClick={handleNextStep} className="w-full">
                    Continuar
                  </Button>
                </div>
              )}

              {/* Step 2 - Establishment Data */}
              {step === 2 && (
                <div className="space-y-4 animate-fade-up">
                  <div className="space-y-2">
                    <Label htmlFor="establishment-name">Nome do estabelecimento *</Label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="establishment-name"
                        type="text"
                        placeholder="Nome fantasia"
                        className="pl-10"
                        value={establishmentName}
                        onChange={(e) => setEstablishmentName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="segment">Segmento *</Label>
                    <Select value={segment} onValueChange={setSegment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o segmento" />
                      </SelectTrigger>
                      <SelectContent>
                        {segments.map((seg) => (
                          <SelectItem key={seg.value} value={seg.value}>
                            {seg.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ (opcional)</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="cnpj"
                        type="text"
                        placeholder="00.000.000/0000-00"
                        className="pl-10"
                        value={cnpj}
                        onChange={(e) => setCnpj(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subdomain">Subdomínio *</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="subdomain"
                        type="text"
                        placeholder="sualoja"
                        className="pl-10 pr-28"
                        value={subdomain}
                        onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        .vilafood.com
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Este será o link da sua loja: <strong>{subdomain || "sualoja"}.vilafood.com</strong>
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                      Voltar
                    </Button>
                    <Button type="button" onClick={handleNextStep} className="flex-1">
                      Continuar
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3 - Address */}
              {step === 3 && (
                <div className="space-y-4 animate-fade-up">
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="cep"
                        type="text"
                        placeholder="00000-000"
                        className="pl-10"
                        value={cep}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          setCep(value);
                          fetchCep(value);
                        }}
                        maxLength={8}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="address">Endereço *</Label>
                      <Input
                        id="address"
                        type="text"
                        placeholder="Rua, Avenida..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="number">Número *</Label>
                      <Input
                        id="number"
                        type="text"
                        placeholder="123"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      type="text"
                      placeholder="Sala, Bloco, Loja..."
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro *</Label>
                    <Input
                      id="neighborhood"
                      type="text"
                      placeholder="Bairro"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="city">Cidade *</Label>
                      <Input
                        id="city"
                        type="text"
                        placeholder="Cidade"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">UF *</Label>
                      <Input
                        id="state"
                        type="text"
                        placeholder="UF"
                        value={state}
                        onChange={(e) => setState(e.target.value.toUpperCase())}
                        maxLength={2}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">
                      Voltar
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isLoading}>
                      {isLoading ? "Cadastrando..." : "Finalizar cadastro"}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Already have account */}
        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            Já tem uma conta?{" "}
            <Link to="/auth" className="text-primary font-medium hover:underline">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterEstablishment;
