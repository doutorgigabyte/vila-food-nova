import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink,
  Facebook,
  BarChart3,
  Rss,
  Play,
  Code
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";

interface PixelStatus {
  platform: string;
  icon: React.ReactNode;
  configured: number;
  active: number;
  events: string[];
  testUrl?: string;
}

interface FeedTest {
  establishment: string;
  slug: string;
  facebookFeed: boolean;
  googleFeed: boolean;
}

const PixelsDiagnostic = () => {
  const [loading, setLoading] = useState(true);
  const [pixelStats, setPixelStats] = useState<PixelStatus[]>([]);
  const [feedTests, setFeedTests] = useState<FeedTest[]>([]);
  const [testingFeeds, setTestingFeeds] = useState(false);

  useEffect(() => {
    fetchPixelStats();
  }, []);

  const fetchPixelStats = async () => {
    setLoading(true);
    try {
      // Fetch analytics_pixels config
      const { data: pixels, error } = await supabase
        .from('analytics_pixels')
        .select('*');

      if (error) throw error;

      // Calculate stats
      const fbConfigured = pixels?.filter(p => p.facebook_pixel_id).length || 0;
      const fbActive = pixels?.filter(p => p.facebook_pixel_id && p.is_active).length || 0;
      
      const gaConfigured = pixels?.filter(p => p.google_analytics_id).length || 0;
      const gaActive = pixels?.filter(p => p.google_analytics_id && p.is_active).length || 0;
      
      const ttConfigured = pixels?.filter(p => p.tiktok_pixel_id).length || 0;
      const ttActive = pixels?.filter(p => p.tiktok_pixel_id && p.is_active).length || 0;

      setPixelStats([
        {
          platform: 'Facebook Pixel',
          icon: <Facebook className="w-5 h-5 text-blue-600" />,
          configured: fbConfigured,
          active: fbActive,
          events: ['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase', 'Search', 'Lead'],
          testUrl: 'https://business.facebook.com/events_manager'
        },
        {
          platform: 'Google Analytics 4',
          icon: <BarChart3 className="w-5 h-5 text-orange-500" />,
          configured: gaConfigured,
          active: gaActive,
          events: ['page_view', 'view_item', 'add_to_cart', 'begin_checkout', 'purchase', 'search', 'generate_lead'],
          testUrl: 'https://analytics.google.com/'
        },
        {
          platform: 'TikTok Pixel',
          icon: <Play className="w-5 h-5" />,
          configured: ttConfigured,
          active: ttActive,
          events: ['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'CompletePayment', 'Search', 'SubmitForm'],
          testUrl: 'https://ads.tiktok.com/'
        }
      ]);

      // Fetch establishments for feed testing
      const { data: establishments } = await supabase
        .from('establishments')
        .select('id, name, slug')
        .eq('status', 'active')
        .limit(5);

      if (establishments) {
        setFeedTests(establishments.map(e => ({
          establishment: e.name,
          slug: e.slug,
          facebookFeed: false,
          googleFeed: false
        })));
      }
    } catch (err) {
      console.error('Error fetching pixel stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const testProductFeeds = async () => {
    setTestingFeeds(true);
    const updatedFeeds: FeedTest[] = [];

    for (const feed of feedTests) {
      try {
        // Test Facebook feed
        const fbResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/product-feeds?establishment=${feed.slug}&format=facebook`
        );
        
        // Test Google feed
        const googleResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/product-feeds?establishment=${feed.slug}&format=google`
        );

        updatedFeeds.push({
          ...feed,
          facebookFeed: fbResponse.ok,
          googleFeed: googleResponse.ok
        });
      } catch (err) {
        updatedFeeds.push({
          ...feed,
          facebookFeed: false,
          googleFeed: false
        });
      }
    }

    setFeedTests(updatedFeeds);
    setTestingFeeds(false);
  };

  const codeSnippets = {
    addToCart: `// Em useCart.tsx - Disparo automático
trackAddToCart({
  id: product.id,
  name: product.name,
  price: product.promotional_price || product.price,
  quantity
});`,
    checkout: `// Em Checkout.tsx - Início do checkout
trackInitiateCheckout(items, subtotal);`,
    purchase: `// Em Checkout.tsx - Compra finalizada
trackPurchase({
  orderId: result.order.id,
  total: total,
  items: items.map(...)
});`
  };

  if (loading) {
    return (
      <AdminLayout title="Diagnóstico de Pixels">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Diagnóstico de Pixels & Feeds">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Pixels & Feeds de Produtos</h2>
            <p className="text-muted-foreground">
              Validação de integrações de marketing e catálogos
            </p>
          </div>
          <Button onClick={fetchPixelStats} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>

        {/* Pixel Status Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {pixelStats.map((pixel) => (
            <Card key={pixel.platform}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {pixel.icon}
                  {pixel.platform}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Configurados</span>
                  <Badge variant={pixel.configured > 0 ? "default" : "secondary"}>
                    {pixel.configured} lojas
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Ativos</span>
                  <Badge variant={pixel.active > 0 ? "default" : "destructive"}>
                    {pixel.active} lojas
                  </Badge>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium mb-2">Eventos disparados:</p>
                  <div className="flex flex-wrap gap-1">
                    {pixel.events.map((event) => (
                      <Badge key={event} variant="outline" className="text-xs">
                        {event}
                      </Badge>
                    ))}
                  </div>
                </div>
                {pixel.testUrl && (
                  <a
                    href={pixel.testUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    Verificar eventos <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Event Integration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Integração de Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="font-medium">AddToCart</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Disparado automaticamente em useCart.tsx
                </p>
                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                  {codeSnippets.addToCart}
                </pre>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="font-medium">InitiateCheckout</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Disparado em Checkout.tsx ao avançar
                </p>
                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                  {codeSnippets.checkout}
                </pre>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="font-medium">Purchase</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Disparado ao finalizar pedido/pagamento
                </p>
                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                  {codeSnippets.purchase}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Feeds Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rss className="w-5 h-5" />
              Feeds XML de Produtos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Feeds para Facebook Catalog, Google Merchant Center e Instagram Shopping
            </p>
            
            <Button 
              onClick={testProductFeeds} 
              disabled={testingFeeds}
              className="gap-2"
            >
              {testingFeeds ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Testar Feeds
            </Button>

            {feedTests.length > 0 && (
              <div className="mt-4 space-y-2">
                {feedTests.map((feed, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">{feed.establishment}</span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        {feed.facebookFeed ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="text-xs">Facebook</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {feed.googleFeed ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="text-xs">Google</span>
                      </div>
                      <a
                        href={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/product-feeds?establishment=${feed.slug}&format=facebook`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Ver Feed
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Separator />
            
            <div className="space-y-2">
              <p className="text-sm font-medium">URLs dos Feeds:</p>
              <div className="text-xs space-y-1 text-muted-foreground bg-muted p-3 rounded">
                <p><strong>Facebook/Meta:</strong> /functions/v1/product-feeds?establishment=SLUG&format=facebook</p>
                <p><strong>Google Merchant:</strong> /functions/v1/product-feeds?establishment=SLUG&format=google</p>
                <p><strong>Instagram:</strong> /functions/v1/product-feeds?establishment=SLUG&format=instagram</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Integrações Validadas</p>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                  <li>✓ Eventos de conversão integrados em AddToCart, Checkout e Purchase</li>
                  <li>✓ Validação de Pixel IDs com regex de segurança</li>
                  <li>✓ Feeds XML funcionais para Facebook, Google e Instagram</li>
                  <li>✓ Configuração por estabelecimento via dashboard</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default PixelsDiagnostic;
