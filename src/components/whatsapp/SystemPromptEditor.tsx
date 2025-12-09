import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Bot, Save, RotateCcw, Sparkles, Copy, Check,
  MessageSquare, Store, Clock, CreditCard, Truck
} from "lucide-react";

interface SystemPromptEditorProps {
  establishmentId: string;
}

const PROMPT_TEMPLATES = [
  {
    id: 'friendly',
    name: 'Amigável',
    icon: MessageSquare,
    description: 'Tom casual e acolhedor',
    prompt: `Você é um assistente virtual amigável do {NOME}. Fale de forma casual e acolhedora.

Suas principais funções:
- Apresentar o cardápio e ajudar na escolha
- Tirar dúvidas sobre produtos
- Realizar pedidos
- Informar sobre horários e formas de pagamento

Sempre use emojis para deixar a conversa mais leve 😊
Trate o cliente pelo nome quando souber.
Se não souber algo, diga que vai verificar com a equipe.`
  },
  {
    id: 'professional',
    name: 'Profissional',
    icon: Store,
    description: 'Tom formal e objetivo',
    prompt: `Você é o assistente virtual do {NOME}. Seja sempre educado, objetivo e profissional.

Responsabilidades:
1. Apresentar produtos e preços do cardápio
2. Auxiliar no processo de pedido
3. Informar horários de funcionamento
4. Esclarecer formas de pagamento e entrega

Mantenha respostas claras e concisas.
Confirme sempre as informações do pedido.
Em caso de dúvidas complexas, encaminhe para atendimento humano.`
  },
  {
    id: 'sales',
    name: 'Vendedor',
    icon: CreditCard,
    description: 'Focado em conversão',
    prompt: `Você é um vendedor virtual expert do {NOME}. Seu objetivo é ajudar o cliente a fazer pedidos.

Estratégias:
- Sempre sugira produtos complementares
- Destaque promoções e combos disponíveis
- Crie urgência quando apropriado ("últimas unidades", "promoção até hoje")
- Use técnicas de upselling suaves

Mantenha o foco em fechar vendas, mas sem ser invasivo.
Sempre confirme o pedido antes de finalizar.
Ofereça as melhores opções de pagamento.`
  },
  {
    id: 'delivery',
    name: 'Delivery',
    icon: Truck,
    description: 'Especializado em entregas',
    prompt: `Você é o assistente de delivery do {NOME}. Foque em agilizar pedidos para entrega.

Prioridades:
1. Confirmar endereço de entrega
2. Informar taxa e tempo estimado
3. Mostrar opções do cardápio
4. Processar pedido rapidamente

Sempre pergunte o endereço completo.
Informe claramente os custos de entrega.
Confirme todos os itens antes de enviar para preparo.
Agradeça e informe o tempo estimado ao final.`
  }
];

const VARIABLES_INFO = [
  { var: '{NOME}', desc: 'Nome do estabelecimento' },
  { var: '{HORARIO}', desc: 'Horário de funcionamento' },
  { var: '{ENDERECO}', desc: 'Endereço completo' },
  { var: '{TELEFONE}', desc: 'Telefone/WhatsApp' },
  { var: '{CARDAPIO}', desc: 'Link do cardápio digital' },
];

export function SystemPromptEditor({ establishmentId }: SystemPromptEditorProps) {
  const [prompt, setPrompt] = useState("");
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [establishmentName, setEstablishmentName] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, [establishmentId]);

  const fetchData = async () => {
    const { data } = await supabase
      .from("establishments")
      .select("name, system_prompt")
      .eq("id", establishmentId)
      .single();

    if (data) {
      setEstablishmentName(data.name);
      const currentPrompt = data.system_prompt || getDefaultPrompt(data.name);
      setPrompt(currentPrompt);
      setOriginalPrompt(currentPrompt);
    }
  };

  const getDefaultPrompt = (name: string) => {
    return PROMPT_TEMPLATES[0].prompt.replace(/{NOME}/g, name);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("establishments")
        .update({ system_prompt: prompt })
        .eq("id", establishmentId);

      if (error) throw error;

      setOriginalPrompt(prompt);
      toast.success("System prompt salvo com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar prompt");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPrompt(originalPrompt);
  };

  const applyTemplate = (template: typeof PROMPT_TEMPLATES[0]) => {
    setPrompt(template.prompt.replace(/{NOME}/g, establishmentName));
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasChanges = prompt !== originalPrompt;
  const charCount = prompt.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">System Prompt</CardTitle>
          </div>
          <Badge variant={charCount > 2000 ? "destructive" : "secondary"}>
            {charCount} caracteres
          </Badge>
        </div>
        <CardDescription>
          Defina a personalidade e comportamento do agente IA para seu estabelecimento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="editor">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="variables">Variáveis</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-4">
            <div>
              <Label htmlFor="prompt">Prompt do Agente</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Digite as instruções para o agente IA..."
                className="min-h-[300px] font-mono text-sm mt-2"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyPrompt}
                  className="gap-2"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copiado!" : "Copiar"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={!hasChanges}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Desfazer
                </Button>
              </div>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="templates">
            <ScrollArea className="h-[350px]">
              <div className="grid gap-3 pr-4">
                {PROMPT_TEMPLATES.map((template) => {
                  const Icon = template.icon;
                  return (
                    <Card
                      key={template.id}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => applyTemplate(template)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{template.name}</h4>
                              <Button variant="ghost" size="sm">
                                <Sparkles className="h-4 w-4 mr-1" />
                                Usar
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {template.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="variables">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Use estas variáveis no seu prompt. Elas serão substituídas automaticamente pelos dados do seu estabelecimento.
              </p>
              <div className="grid gap-2">
                {VARIABLES_INFO.map((v) => (
                  <div
                    key={v.var}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <code className="text-sm font-mono text-primary">{v.var}</code>
                    <span className="text-sm text-muted-foreground">{v.desc}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-lg border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Dica:</strong> O cardápio é injetado automaticamente no contexto do agente. 
                  Você não precisa listar produtos no prompt.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
