import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Bot, 
  MessageSquare, 
  CreditCard, 
  Workflow,
  FileJson,
  ExternalLink,
  CheckCircle2,
  Shield,
  Settings,
  Key,
  Store
} from "lucide-react";
import { toast } from "sonner";

interface N8nTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  filename: string;
  features: string[];
  difficulty: "Básico" | "Intermediário" | "Avançado";
}

const templates: N8nTemplate[] = [
  {
    id: "agent-v3",
    name: "⭐ Agent V3 (RECOMENDADO)",
    description: "Versão otimizada com toolHttpRequest - usa Edge Functions do Supabase. Mais estável e testado.",
    icon: <Bot className="w-6 h-6" />,
    filename: "VilaFood-Agent-V3.json",
    features: [
      "✅ toolHttpRequest (sem erros)",
      "Edge Functions Supabase",
      "Carrinho via API",
      "Pedido PIX via API",
      "Busca de produtos RPC",
      "Cálculo de entrega",
      "Split de mensagens longas",
      "Memória Redis"
    ],
    difficulty: "Intermediário"
  },
  {
    id: "master-router",
    name: "Master Router (Multi-Tenant)",
    description: "Roteador principal que recebe webhooks, busca config por lojista e chama o AI Brain",
    icon: <Workflow className="w-6 h-6" />,
    filename: "VilaFood-Master-Router.json",
    features: [
      "Webhook Evolution API",
      "Filtro mensagens próprias",
      "Busca config por instance_name",
      "Redis Debounce (1s)",
      "Agregação de mensagens múltiplas",
      "Chamada dinâmica AI Brain",
      "Token/prompt por lojista",
      "Log de mensagens Supabase"
    ],
    difficulty: "Intermediário"
  },
  {
    id: "ai-brain",
    name: "AI Brain (Gemini + Tools)",
    description: "Cérebro do agente com Google Gemini, memória por sessão e 7 tools especializadas",
    icon: <Bot className="w-6 h-6" />,
    filename: "VilaFood-AI-Brain.json",
    features: [
      "Google Gemini 2.5 Flash",
      "Window Buffer Memory",
      "system_prompt dinâmico",
      "Tool: search_menu",
      "Tool: send_product_photo",
      "Tool: add_to_cart",
      "Tool: save_customer",
      "Tool: find_customer_location",
      "Tool: create_order_pix",
      "Histórico de chat Supabase"
    ],
    difficulty: "Avançado"
  },
  {
    id: "agent-complete",
    name: "Agent Completo (Legacy)",
    description: "Versão anterior - pode ter problemas com toolCode. Use V3 para novos projetos.",
    icon: <Bot className="w-6 h-6" />,
    filename: "VilaFood-Agent-Complete.json",
    features: [
      "Tudo em um workflow",
      "Texto / Áudio / Imagem",
      "Transcrição de áudio",
      "Análise de imagem",
      "Redis Debounce",
      "Memória de conversa",
      "Todas as tools integradas",
      "Log de mensagens"
    ],
    difficulty: "Avançado"
  },
  {
    id: "send-product-photo",
    name: "Tool: Enviar Foto do Produto",
    description: "Subfluxo que baixa imagem do CloudFront, converte para Base64 e envia via Evolution API",
    icon: <MessageSquare className="w-6 h-6" />,
    filename: "VilaFood-Send-Product-Photo.json",
    features: [
      "Download da imagem via HTTP",
      "Conversão para Base64",
      "Envio via Evolution API",
      "Caption formatado com nome/preço",
      "Tratamento de erros",
      "Compatível com CloudFront/S3"
    ],
    difficulty: "Básico"
  },
  {
    id: "mercadopago-pix",
    name: "Tool: Mercado Pago PIX",
    description: "Subfluxo para geração de pagamento PIX usando o token OAuth do lojista",
    icon: <CreditCard className="w-6 h-6" />,
    filename: "VilaFood-MercadoPago-PIX.json",
    features: [
      "API Mercado Pago v1",
      "Token dinâmico por lojista",
      "Geração de QR Code PIX",
      "Código copia-e-cola",
      "Expiração configurável (30min)",
      "Fallback para PIX estático",
      "Salva pedido no Supabase"
    ],
    difficulty: "Intermediário"
  },
  {
    id: "payment-gateway-selector",
    name: "Seletor de Gateway de Pagamento",
    description: "Verifica qual gateway está ativo (Mercado Pago ou PagSeguro) e roteia automaticamente",
    icon: <CreditCard className="w-6 h-6" />,
    filename: "VilaFood-Payment-Gateway-Selector.json",
    features: [
      "Detecção automática de gateway",
      "Suporte Mercado Pago",
      "Suporte PagSeguro (em breve)",
      "Fallback para PIX estático",
      "Verificação de tokens",
      "Logs detalhados"
    ],
    difficulty: "Intermediário"
  }
];

const downloadTemplate = async (template: N8nTemplate) => {
  try {
    const response = await fetch(`/n8n-templates/${template.filename}`);
    if (!response.ok) throw new Error("Falha ao baixar template");
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = template.filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast.success(`Template "${template.name}" baixado com sucesso!`);
  } catch (error) {
    console.error("Error downloading template:", error);
    toast.error("Erro ao baixar template");
  }
};

const getDifficultyColor = (difficulty: N8nTemplate["difficulty"]) => {
  switch (difficulty) {
    case "Básico": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "Intermediário": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "Avançado": return "bg-rose-500/10 text-rose-500 border-rose-500/20";
  }
};

export const N8nTemplatesDownload = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Workflow className="w-8 h-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Templates n8n para WhatsApp IA</CardTitle>
              <CardDescription>
                Baixe e importe os fluxos de automação para seu n8n
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Compatível com n8n Cloud e Self-Hosted</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Integração com Supabase Edge Functions</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Google Gemini + Redis Memory</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credentials Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Admin Credentials */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Credenciais do Admin (Sistema)</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Você configura uma vez no n8n - usadas por todos os lojistas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <Key className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Supabase API</p>
                  <p className="text-xs text-muted-foreground">URL + Service Role Key</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <Key className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Google Gemini API</p>
                  <p className="text-xs text-muted-foreground">API Key do Google AI Studio</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <Key className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Redis</p>
                  <p className="text-xs text-muted-foreground">Integrado ao n8n ou servidor externo</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <Key className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Evolution API</p>
                  <p className="text-xs text-muted-foreground">URL base + API Key global</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Merchant Credentials */}
        <Card className="border-emerald-500/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-emerald-500" />
              <CardTitle className="text-base">Credenciais do Lojista</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Cada lojista configura no painel VilaFood - por estabelecimento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/5">
                <Settings className="w-4 h-4 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium">Instância WhatsApp</p>
                  <p className="text-xs text-muted-foreground">Criada automaticamente ao conectar</p>
                </div>
                <Badge variant="outline" className="ml-auto text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  Automático
                </Badge>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/5">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium">Mercado Pago</p>
                  <p className="text-xs text-muted-foreground">Conectado via OAuth (1 clique)</p>
                </div>
                <Badge variant="outline" className="ml-auto text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  OAuth
                </Badge>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/5 opacity-60">
                <CreditCard className="w-4 h-4 text-amber-500" />
                <div>
                  <p className="text-sm font-medium">PagSeguro</p>
                  <p className="text-xs text-muted-foreground">Conectado via OAuth (em homologação)</p>
                </div>
                <Badge variant="outline" className="ml-auto text-xs bg-amber-500/10 text-amber-500 border-amber-500/20">
                  Em breve
                </Badge>
              </div>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                <strong>O lojista NÃO precisa de:</strong> API Key do Gemini, Redis, Supabase, Evolution API URL
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {templates.map((template) => (
          <Card key={template.id} className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full" />
            
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                    {template.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge className={`mt-1 ${getDifficultyColor(template.difficulty)}`}>
                      {template.difficulty}
                    </Badge>
                  </div>
                </div>
                <FileJson className="w-5 h-5 text-muted-foreground" />
              </div>
              <CardDescription className="mt-2">
                {template.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Funcionalidades:</p>
                <div className="flex flex-wrap gap-1.5">
                  {template.features.slice(0, 6).map((feature, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="text-xs font-normal"
                    >
                      {feature}
                    </Badge>
                  ))}
                  {template.features.length > 6 && (
                    <Badge 
                      variant="outline" 
                      className="text-xs font-normal"
                    >
                      +{template.features.length - 6} mais
                    </Badge>
                  )}
                </div>
              </div>
              
              <Button 
                className="w-full gap-2"
                onClick={() => downloadTemplate(template)}
              >
                <Download className="w-4 h-4" />
                Baixar Template JSON
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Como Importar no n8n
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">1</span>
              <span>Acesse seu painel n8n (cloud ou self-hosted)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">2</span>
              <span>Clique em <strong>"Create Workflow"</strong> → <strong>"Import from file"</strong></span>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">3</span>
              <span>Selecione o arquivo JSON baixado</span>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">4</span>
              <span>Configure as credenciais do sistema: Supabase, Google Gemini, Redis, Evolution API</span>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">5</span>
              <span>Ajuste a URL do webhook Evolution API para apontar para seu n8n</span>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">6</span>
              <span>Ative o workflow e teste com uma mensagem no WhatsApp!</span>
            </li>
          </ol>
          
          <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Fluxo de Funcionamento:
            </p>
            <ol className="text-xs text-muted-foreground space-y-1 ml-6 list-decimal">
              <li>Cliente envia mensagem no WhatsApp do lojista</li>
              <li>Evolution API dispara webhook para n8n</li>
              <li>Master Router busca config do lojista no Supabase (por instance_name)</li>
              <li>AI Brain processa mensagem com Google Gemini usando system_prompt do lojista</li>
              <li>Tools executam ações (buscar menu, adicionar ao carrinho, criar pedido)</li>
              <li>Para pagamento PIX: sistema detecta gateway ativo (MP ou PS) e gera QR code</li>
              <li>Resposta enviada de volta via Evolution API</li>
            </ol>
          </div>

          <div className="mt-4 flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <a href="https://docs.n8n.io/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Documentação n8n
              </a>
            </Button>
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <a href="https://doc.evolution-api.com/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Docs Evolution API
              </a>
            </Button>
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <a href="https://ai.google.dev/docs" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Docs Google Gemini
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
