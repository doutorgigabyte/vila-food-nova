import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Copy, ExternalLink, Facebook, ShoppingCart, Check, Globe } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useEstablishment } from "@/hooks/useEstablishment";

const IntegrationsManagement = () => {
  const { slug } = useParams<{ slug: string }>();
  const { establishment, loading } = useEstablishment(slug);
  const [copied, setCopied] = useState<string | null>(null);

  const getXmlFeedUrl = () => {
    // Construido a partir de VITE_SUPABASE_URL pra funcionar tanto em Cloud
    // (<projectid>.supabase.co) quanto em self-hosted (db.vilafood.delivery).
    // Migrado em 2026-05-09 (item 7.7 do roadmap Rota T) — antes era hardcoded
    // pro projeto Cloud aposentado gyagfsjbdaacgmmofqip.
    const baseUrl = import.meta.env.VITE_SUPABASE_URL || "https://db.vilafood.delivery";
    return `${baseUrl}/functions/v1/product-feeds?slug=${slug}`;
  };

  const getStoreUrl = () => {
    return `${window.location.origin}/loja/${slug}`;
  };

  const handleCopy = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success("Copiado!");
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <DashboardLayout title="Integrações">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Integrações" establishment={establishment}>
      <div className="space-y-6">
        {/* Store Link */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Link da Loja
            </CardTitle>
            <CardDescription>
              Compartilhe este link para seus clientes acessarem seu cardápio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={getStoreUrl()} readOnly className="font-mono text-sm" />
              <Button
                variant="outline"
                onClick={() => handleCopy(getStoreUrl(), "store")}
              >
                {copied === "store" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button variant="outline" asChild>
                <a href={getStoreUrl()} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* XML Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Feed de Produtos (XML)
            </CardTitle>
            <CardDescription>
              Use este feed para integrar com Facebook Shop, Instagram Shopping e Google Merchant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={getXmlFeedUrl()} readOnly className="font-mono text-xs" />
              <Button
                variant="outline"
                onClick={() => handleCopy(getXmlFeedUrl(), "xml")}
              >
                {copied === "xml" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button variant="outline" asChild>
                <a href={getXmlFeedUrl()} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-3">Como usar:</h4>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <Badge variant="outline" className="shrink-0">1</Badge>
                  <p>Copie a URL do feed XML acima</p>
                </div>
                <div className="flex gap-3">
                  <Badge variant="outline" className="shrink-0">2</Badge>
                  <p>Acesse o Gerenciador de Catálogos do Meta Business Suite</p>
                </div>
                <div className="flex gap-3">
                  <Badge variant="outline" className="shrink-0">3</Badge>
                  <p>Adicione uma nova fonte de dados usando "Feed de Dados"</p>
                </div>
                <div className="flex gap-3">
                  <Badge variant="outline" className="shrink-0">4</Badge>
                  <p>Cole a URL e configure atualização automática diária</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Facebook/Instagram */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Facebook className="w-5 h-5" />
                  Facebook & Instagram Shopping
                </CardTitle>
                <CardDescription>
                  Venda seus produtos diretamente nas redes sociais
                </CardDescription>
              </div>
              <Badge variant="outline">Disponível</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Com o feed XML configurado, seus produtos aparecerão automaticamente no
                Facebook Shop e Instagram Shopping. Os clientes poderão ver preços e
                clicar para fazer pedidos diretamente no seu cardápio digital.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <a
                    href="https://business.facebook.com/commerce"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Facebook className="w-4 h-4 mr-2" />
                    Acessar Meta Commerce
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Google Merchant */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Google Merchant Center
                </CardTitle>
                <CardDescription>
                  Apareça no Google Shopping e nas pesquisas
                </CardDescription>
              </div>
              <Badge variant="outline">Disponível</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                O mesmo feed XML pode ser usado no Google Merchant Center para que seus
                produtos apareçam nas pesquisas do Google Shopping e Google Maps.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <a
                    href="https://merchants.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Acessar Google Merchant
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Info */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Globe className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-primary mb-1">Formato do Feed</p>
                <p className="text-muted-foreground">
                  O feed segue o padrão Atom com namespace do Google Shopping (g:).
                  É compatível com Facebook, Instagram, Google Merchant e outras
                  plataformas que aceitam feeds de produtos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default IntegrationsManagement;
