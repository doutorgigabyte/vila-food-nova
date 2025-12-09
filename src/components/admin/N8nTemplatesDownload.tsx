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
  CheckCircle2
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
    id: "agent-complete",
    name: "VilaFood AI Agent Completo",
    description: "Fluxo principal do agente de IA com todas as ferramentas integradas para atendimento via WhatsApp",
    icon: <Bot className="w-6 h-6" />,
    filename: "VilaFood-Agent-Complete.json",
    features: [
      "Evolution API Webhook",
      "Redis Debounce (2s)",
      "Google Gemini LLM",
      "Memória de conversa por sessão",
      "search_menu - Busca no cardápio",
      "send_product_photo - Envia foto (Base64)",
      "add_to_cart - Adiciona ao carrinho",
      "save_customer - Salva dados do cliente",
      "find_google_maps - Geocodificação",
      "create_order_pix - Finaliza pedido com PIX",
      "send_order_to_owner - Notifica lojista",
      "send_pix_qrcode - Envia QR Code",
    ],
    difficulty: "Avançado"
  },
  {
    id: "send-product-photo",
    name: "Enviar Foto do Produto (Base64)",
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
    name: "Mercado Pago PIX",
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
              <span>Configure as credenciais: Supabase API, Google Gemini, Redis, Evolution API</span>
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
          
          <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
            <p className="text-sm font-medium mb-2">Credenciais necessárias:</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">Supabase API</Badge>
                <span className="text-muted-foreground">URL + Service Role Key</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">Google Gemini</Badge>
                <span className="text-muted-foreground">API Key</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">Redis</Badge>
                <span className="text-muted-foreground">n8n Redis (integrado)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">Evolution API</Badge>
                <span className="text-muted-foreground">URL + API Key</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
