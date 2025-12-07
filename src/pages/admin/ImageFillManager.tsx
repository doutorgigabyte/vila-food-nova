import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Image, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Package,
  Store,
  Grid3X3,
  Loader2,
  AlertTriangle,
  Wrench
} from "lucide-react";

interface MissingImageItem {
  id: string;
  name: string;
  type: 'product' | 'category' | 'establishment_logo' | 'establishment_banner';
  establishmentId?: string;
  establishmentName?: string;
  image_url?: string;
  generating?: boolean;
  generated?: boolean;
}

interface BrokenImageStats {
  products: number;
  categories: number;
  logos: number;
  banners: number;
  total: number;
}

export default function ImageFillManager() {
  const [loading, setLoading] = useState(true);
  const [missingProducts, setMissingProducts] = useState<MissingImageItem[]>([]);
  const [missingCategories, setMissingCategories] = useState<MissingImageItem[]>([]);
  const [missingLogos, setMissingLogos] = useState<MissingImageItem[]>([]);
  const [missingBanners, setMissingBanners] = useState<MissingImageItem[]>([]);
  
  // Broken CloudFront images
  const [brokenProducts, setBrokenProducts] = useState<MissingImageItem[]>([]);
  const [brokenCategories, setBrokenCategories] = useState<MissingImageItem[]>([]);
  const [brokenLogos, setBrokenLogos] = useState<MissingImageItem[]>([]);
  const [brokenBanners, setBrokenBanners] = useState<MissingImageItem[]>([]);
  const [brokenStats, setBrokenStats] = useState<BrokenImageStats>({ products: 0, categories: 0, logos: 0, banners: 0, total: 0 });
  
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [fixingAll, setFixingAll] = useState(false);
  
  const [stats, setStats] = useState({
    totalProducts: 0,
    productsWithImage: 0,
    totalCategories: 0,
    categoriesWithImage: 0,
    totalEstablishments: 0,
    establishmentsWithLogo: 0,
    establishmentsWithBanner: 0
  });

  const fetchMissingImages = async () => {
    setLoading(true);
    try {
      // Fetch products without images (NULL or empty)
      const { data: products } = await supabase
        .from('products')
        .select('id, name, establishment_id, establishments(name)')
        .or('image_url.is.null,image_url.eq.')
        .limit(100);

      const { data: allProducts } = await supabase
        .from('products')
        .select('id, image_url', { count: 'exact' });

      // Fetch categories without images  
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name, establishment_id, establishments(name)')
        .or('image_url.is.null,image_url.eq.')
        .limit(100);

      const { data: allCategories } = await supabase
        .from('categories')
        .select('id, image_url', { count: 'exact' });

      // Fetch establishments without logos
      const { data: estWithoutLogo } = await supabase
        .from('establishments')
        .select('id, name')
        .or('logo_url.is.null,logo_url.eq.')
        .limit(50);

      // Fetch establishments without banners
      const { data: estWithoutBanner } = await supabase
        .from('establishments')
        .select('id, name')
        .or('banner_url.is.null,banner_url.eq.')
        .limit(50);

      const { data: allEstablishments } = await supabase
        .from('establishments')
        .select('id, logo_url, banner_url', { count: 'exact' });

      // Map to items
      setMissingProducts(
        (products || []).map(p => ({
          id: p.id,
          name: p.name,
          type: 'product' as const,
          establishmentId: p.establishment_id,
          establishmentName: (p.establishments as any)?.name
        }))
      );

      setMissingCategories(
        (categories || []).map(c => ({
          id: c.id,
          name: c.name,
          type: 'category' as const,
          establishmentId: c.establishment_id,
          establishmentName: (c.establishments as any)?.name
        }))
      );

      setMissingLogos(
        (estWithoutLogo || []).map(e => ({
          id: e.id,
          name: e.name,
          type: 'establishment_logo' as const
        }))
      );

      setMissingBanners(
        (estWithoutBanner || []).map(e => ({
          id: e.id,
          name: e.name,
          type: 'establishment_banner' as const
        }))
      );

      // Calculate stats
      const productsWithImage = (allProducts || []).filter(p => p.image_url && p.image_url.length > 5).length;
      const categoriesWithImage = (allCategories || []).filter(c => c.image_url && c.image_url.length > 5).length;
      const establishmentsWithLogo = (allEstablishments || []).filter(e => e.logo_url && e.logo_url.length > 5).length;
      const establishmentsWithBanner = (allEstablishments || []).filter(e => e.banner_url && e.banner_url.length > 5).length;

      setStats({
        totalProducts: allProducts?.length || 0,
        productsWithImage,
        totalCategories: allCategories?.length || 0,
        categoriesWithImage,
        totalEstablishments: allEstablishments?.length || 0,
        establishmentsWithLogo,
        establishmentsWithBanner
      });

      // Fetch broken CloudFront images
      await fetchBrokenImages();

    } catch (error) {
      console.error('Error fetching missing images:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const fetchBrokenImages = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fix-broken-images', {
        body: { action: 'list', limit: 100 }
      });

      if (error) throw error;

      setBrokenProducts(
        (data.products || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          type: 'product' as const,
          image_url: p.image_url,
          establishmentId: p.establishmentId,
          establishmentName: p.establishmentName
        }))
      );

      setBrokenCategories(
        (data.categories || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          type: 'category' as const,
          image_url: c.image_url,
          establishmentId: c.establishmentId,
          establishmentName: c.establishmentName
        }))
      );

      setBrokenLogos(
        (data.logos || []).map((e: any) => ({
          id: e.id,
          name: e.name,
          type: 'establishment_logo' as const,
          image_url: e.image_url
        }))
      );

      setBrokenBanners(
        (data.banners || []).map((e: any) => ({
          id: e.id,
          name: e.name,
          type: 'establishment_banner' as const,
          image_url: e.image_url
        }))
      );

      setBrokenStats(data.counts || { products: 0, categories: 0, logos: 0, banners: 0, total: 0 });

    } catch (error) {
      console.error('Error fetching broken images:', error);
    }
  };

  useEffect(() => {
    fetchMissingImages();
  }, []);

  const generateSingleImage = async (item: MissingImageItem) => {
    const updateList = (list: MissingImageItem[], setList: React.Dispatch<React.SetStateAction<MissingImageItem[]>>) => {
      setList(prev => prev.map(i => i.id === item.id ? { ...i, generating: true } : i));
    };

    if (item.type === 'product') updateList(missingProducts, setMissingProducts);
    else if (item.type === 'category') updateList(missingCategories, setMissingCategories);
    else if (item.type === 'establishment_logo') updateList(missingLogos, setMissingLogos);
    else updateList(missingBanners, setMissingBanners);

    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          type: item.type,
          id: item.id,
          name: item.name,
          establishmentId: item.establishmentId
        }
      });

      if (error) throw error;

      toast.success(`Imagem gerada para: ${item.name}`);

      const removeFromList = (list: MissingImageItem[], setList: React.Dispatch<React.SetStateAction<MissingImageItem[]>>) => {
        setList(prev => prev.filter(i => i.id !== item.id));
      };

      if (item.type === 'product') removeFromList(missingProducts, setMissingProducts);
      else if (item.type === 'category') removeFromList(missingCategories, setMissingCategories);
      else if (item.type === 'establishment_logo') removeFromList(missingLogos, setMissingLogos);
      else removeFromList(missingBanners, setMissingBanners);

      setStats(prev => {
        if (item.type === 'product') return { ...prev, productsWithImage: prev.productsWithImage + 1 };
        if (item.type === 'category') return { ...prev, categoriesWithImage: prev.categoriesWithImage + 1 };
        if (item.type === 'establishment_logo') return { ...prev, establishmentsWithLogo: prev.establishmentsWithLogo + 1 };
        return { ...prev, establishmentsWithBanner: prev.establishmentsWithBanner + 1 };
      });

    } catch (error: any) {
      console.error('Error generating image:', error);
      toast.error(`Erro ao gerar imagem: ${error.message}`);
      
      const resetList = (list: MissingImageItem[], setList: React.Dispatch<React.SetStateAction<MissingImageItem[]>>) => {
        setList(prev => prev.map(i => i.id === item.id ? { ...i, generating: false } : i));
      };

      if (item.type === 'product') resetList(missingProducts, setMissingProducts);
      else if (item.type === 'category') resetList(missingCategories, setMissingCategories);
      else if (item.type === 'establishment_logo') resetList(missingLogos, setMissingLogos);
      else resetList(missingBanners, setMissingBanners);
    }
  };

  const fixSingleBrokenImage = async (item: MissingImageItem) => {
    const updateList = (list: MissingImageItem[], setList: React.Dispatch<React.SetStateAction<MissingImageItem[]>>) => {
      setList(prev => prev.map(i => i.id === item.id ? { ...i, generating: true } : i));
    };

    if (item.type === 'product') updateList(brokenProducts, setBrokenProducts);
    else if (item.type === 'category') updateList(brokenCategories, setBrokenCategories);
    else if (item.type === 'establishment_logo') updateList(brokenLogos, setBrokenLogos);
    else updateList(brokenBanners, setBrokenBanners);

    try {
      const { data, error } = await supabase.functions.invoke('fix-broken-images', {
        body: {
          action: 'fix',
          type: item.type,
          id: item.id,
          name: item.name
        }
      });

      if (error) throw error;

      toast.success(`Imagem corrigida: ${item.name}`);

      const removeFromList = (list: MissingImageItem[], setList: React.Dispatch<React.SetStateAction<MissingImageItem[]>>) => {
        setList(prev => prev.filter(i => i.id !== item.id));
      };

      if (item.type === 'product') removeFromList(brokenProducts, setBrokenProducts);
      else if (item.type === 'category') removeFromList(brokenCategories, setBrokenCategories);
      else if (item.type === 'establishment_logo') removeFromList(brokenLogos, setBrokenLogos);
      else removeFromList(brokenBanners, setBrokenBanners);

      setBrokenStats(prev => ({
        ...prev,
        [item.type === 'product' ? 'products' : item.type === 'category' ? 'categories' : item.type === 'establishment_logo' ? 'logos' : 'banners']: 
          prev[item.type === 'product' ? 'products' : item.type === 'category' ? 'categories' : item.type === 'establishment_logo' ? 'logos' : 'banners'] - 1,
        total: prev.total - 1
      }));

    } catch (error: any) {
      console.error('Error fixing image:', error);
      toast.error(`Erro ao corrigir imagem: ${error.message}`);
      
      const resetList = (list: MissingImageItem[], setList: React.Dispatch<React.SetStateAction<MissingImageItem[]>>) => {
        setList(prev => prev.map(i => i.id === item.id ? { ...i, generating: false } : i));
      };

      if (item.type === 'product') resetList(brokenProducts, setBrokenProducts);
      else if (item.type === 'category') resetList(brokenCategories, setBrokenCategories);
      else if (item.type === 'establishment_logo') resetList(brokenLogos, setBrokenLogos);
      else resetList(brokenBanners, setBrokenBanners);
    }
  };

  const fixAllBrokenImages = async (type: string) => {
    setFixingAll(true);
    setBatchProgress(0);

    try {
      const { data, error } = await supabase.functions.invoke('fix-broken-images', {
        body: { action: 'fix-all', type }
      });

      if (error) throw error;

      toast.success(`${data.updated} imagens corrigidas com sucesso!`);
      
      // Refresh the list
      await fetchBrokenImages();

    } catch (error: any) {
      console.error('Error fixing all images:', error);
      toast.error(`Erro ao corrigir imagens: ${error.message}`);
    } finally {
      setFixingAll(false);
    }
  };

  const generateAllImages = async (items: MissingImageItem[], type: string) => {
    if (items.length === 0) {
      toast.info('Nenhuma imagem pendente para gerar');
      return;
    }

    setBatchProcessing(true);
    setBatchProgress(0);

    let processed = 0;
    let errors = 0;

    for (const item of items) {
      try {
        await generateSingleImage(item);
        processed++;
        setBatchProgress(Math.round((processed / items.length) * 100));
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        errors++;
        console.error(`Error processing ${item.name}:`, error);
      }
    }

    setBatchProcessing(false);
    toast.success(`Processamento concluído: ${processed - errors} sucesso, ${errors} erros`);
    fetchMissingImages();
  };

  const totalMissing = missingProducts.length + missingCategories.length + missingLogos.length + missingBanners.length;
  const overallProgress = stats.totalProducts + stats.totalCategories + stats.totalEstablishments * 2 > 0
    ? Math.round(((stats.productsWithImage + stats.categoriesWithImage + stats.establishmentsWithLogo + stats.establishmentsWithBanner) / 
       (stats.totalProducts + stats.totalCategories + stats.totalEstablishments * 2)) * 100)
    : 0;

  const renderItemList = (items: MissingImageItem[], type: string, isBroken: boolean = false) => (
    <div className="space-y-2">
      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
          <p>{isBroken ? 'Nenhuma imagem quebrada!' : 'Todas as imagens estão preenchidas!'}</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <Badge variant={isBroken ? "destructive" : "outline"}>{items.length} {isBroken ? 'quebradas' : 'pendentes'}</Badge>
            <Button 
              size="sm" 
              onClick={() => isBroken ? fixAllBrokenImages(type) : generateAllImages(items, type)}
              disabled={batchProcessing || fixingAll}
              variant={isBroken ? "destructive" : "default"}
            >
              {(batchProcessing || fixingAll) ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : isBroken ? (
                <Wrench className="h-4 w-4 mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {isBroken ? 'Corrigir Todas' : 'Gerar Todas'}
            </Button>
          </div>
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {items.map(item => (
              <div 
                key={item.id} 
                className={`flex items-center justify-between p-3 rounded-lg ${isBroken ? 'bg-destructive/10' : 'bg-muted/50'}`}
              >
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  {item.establishmentName && (
                    <p className="text-sm text-muted-foreground">{item.establishmentName}</p>
                  )}
                  {isBroken && item.image_url && (
                    <p className="text-xs text-destructive truncate max-w-[300px]">{item.image_url}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={isBroken ? "destructive" : "outline"}
                  onClick={() => isBroken ? fixSingleBrokenImage(item) : generateSingleImage(item)}
                  disabled={item.generating || batchProcessing || fixingAll}
                >
                  {item.generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isBroken ? (
                    <Wrench className="h-4 w-4" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <AdminLayout title="Preenchimento de Imagens">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Preenchimento de Imagens</h1>
            <p className="text-muted-foreground">Gere imagens automaticamente com IA ou corrija imagens quebradas</p>
          </div>
          <Button variant="outline" onClick={fetchMissingImages} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Broken Images Alert */}
        {brokenStats.total > 0 && (
          <Card className="border-destructive bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                {brokenStats.total} Imagens com CloudFront Quebrado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Essas imagens apontam para o CDN antigo (d2fhl3f70zfvod.cloudfront.net) que está offline.
                Clique em "Corrigir Todas" para substituir por imagens do Unsplash.
              </p>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="destructive">{brokenStats.products} produtos</Badge>
                <Badge variant="destructive">{brokenStats.categories} categorias</Badge>
                <Badge variant="destructive">{brokenStats.logos} logos</Badge>
                <Badge variant="destructive">{brokenStats.banners} banners</Badge>
              </div>
              <div className="mt-4">
                <Button 
                  variant="destructive" 
                  onClick={() => fixAllBrokenImages('all')}
                  disabled={fixingAll}
                >
                  {fixingAll ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Wrench className="h-4 w-4 mr-2" />
                  )}
                  Corrigir Todas as {brokenStats.total} Imagens
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Produtos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.productsWithImage}/{stats.totalProducts}</div>
              <Progress 
                value={(stats.productsWithImage / Math.max(stats.totalProducts, 1)) * 100} 
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Grid3X3 className="h-4 w-4" />
                Categorias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.categoriesWithImage}/{stats.totalCategories}</div>
              <Progress 
                value={(stats.categoriesWithImage / Math.max(stats.totalCategories, 1)) * 100} 
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Store className="h-4 w-4" />
                Logos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.establishmentsWithLogo}/{stats.totalEstablishments}</div>
              <Progress 
                value={(stats.establishmentsWithLogo / Math.max(stats.totalEstablishments, 1)) * 100} 
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Image className="h-4 w-4" />
                Banners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.establishmentsWithBanner}/{stats.totalEstablishments}</div>
              <Progress 
                value={(stats.establishmentsWithBanner / Math.max(stats.totalEstablishments, 1)) * 100} 
                className="mt-2"
              />
            </CardContent>
          </Card>
        </div>

        {/* Overall Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Progresso Geral</span>
              <Badge variant={overallProgress >= 100 ? "default" : "secondary"}>
                {overallProgress}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={overallProgress} className="h-3" />
            {(batchProcessing || fixingAll) && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Processando...</p>
                <Progress value={batchProgress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs for each type */}
        <Tabs defaultValue="broken">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="broken" className="relative">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Quebradas
              {brokenStats.total > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {brokenStats.total}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="products" className="relative">
              Produtos
              {missingProducts.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {missingProducts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="categories" className="relative">
              Categorias
              {missingCategories.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {missingCategories.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="logos" className="relative">
              Logos
              {missingLogos.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {missingLogos.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="banners" className="relative">
              Banners
              {missingBanners.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {missingBanners.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="broken">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Imagens com CloudFront Quebrado
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Tabs defaultValue="broken-products">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="broken-products">
                        Produtos ({brokenStats.products})
                      </TabsTrigger>
                      <TabsTrigger value="broken-categories">
                        Categorias ({brokenStats.categories})
                      </TabsTrigger>
                      <TabsTrigger value="broken-logos">
                        Logos ({brokenStats.logos})
                      </TabsTrigger>
                      <TabsTrigger value="broken-banners">
                        Banners ({brokenStats.banners})
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="broken-products">
                      {renderItemList(brokenProducts, 'product', true)}
                    </TabsContent>
                    <TabsContent value="broken-categories">
                      {renderItemList(brokenCategories, 'category', true)}
                    </TabsContent>
                    <TabsContent value="broken-logos">
                      {renderItemList(brokenLogos, 'establishment_logo', true)}
                    </TabsContent>
                    <TabsContent value="broken-banners">
                      {renderItemList(brokenBanners, 'establishment_banner', true)}
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Produtos sem Imagem
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  renderItemList(missingProducts, 'product')
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Grid3X3 className="h-5 w-5" />
                  Categorias sem Imagem
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  renderItemList(missingCategories, 'category')
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logos">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Estabelecimentos sem Logo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  renderItemList(missingLogos, 'establishment_logo')
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banners">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Estabelecimentos sem Banner
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  renderItemList(missingBanners, 'establishment_banner')
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
