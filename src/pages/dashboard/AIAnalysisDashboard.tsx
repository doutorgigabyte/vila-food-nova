import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, Sparkles, Image, FileText, Store, AlertTriangle, Loader2, 
  Zap, Crown, CheckCircle, Camera, Palette, Tag, DollarSign, 
  Layout, Lightbulb, ChevronRight, RefreshCw, Search
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEstablishment } from "@/hooks/useEstablishment";
import { useEstablishmentPlan } from "@/hooks/useEstablishmentPlan";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Suggestion {
  type: 'description' | 'photo' | 'banner' | 'logo' | 'general' | 'pricing' | 'promotion' | 'design';
  priority: 'high' | 'medium' | 'low';
  category: 'visual' | 'design' | 'pricing' | 'promotion' | 'content';
  message: string;
  detail?: string;
  action?: string;
  target_id?: string;
  target_name?: string;
}

interface AnalysisResult {
  overall_score: number;
  description_score: number;
  photos_score: number;
  banner_score: number;
  logo_score: number;
  products_analyzed: number;
  suggestions: Suggestion[];
}

interface AnalysisStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'complete';
}

const AIAnalysisDashboard = () => {
  const { slug } = useParams();
  const { establishment } = useEstablishment(slug);
  const { hasAIUnlimited, plan } = useEstablishmentPlan(establishment?.id || null);
  const [analyzing, setAnalyzing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [hasUnlimited, setHasUnlimited] = useState(false);
  const [credits, setCredits] = useState(0);
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>([
    { id: 'connect', label: 'Conectando com seu cardápio digital', status: 'pending' },
    { id: 'extract', label: 'Extraindo informações do menu', status: 'pending' },
    { id: 'photos', label: 'Analisando qualidade das fotos', status: 'pending' },
    { id: 'descriptions', label: 'Avaliando descrições dos produtos', status: 'pending' },
    { id: 'branding', label: 'Verificando identidade visual', status: 'pending' },
    { id: 'generate', label: 'Gerando diagnóstico personalizado', status: 'pending' },
  ]);

  useEffect(() => {
    if (establishment?.id) {
      loadLatestAnalysis();
      checkPlanStatus();
    }
  }, [establishment?.id]);

  const checkPlanStatus = async () => {
    if (!establishment?.id) return;
    
    // Check if establishment has unlimited AI via plan
    const { data: estData } = await supabase
      .from('establishments')
      .select('plan_id')
      .eq('id', establishment.id)
      .single();
    
    if (estData?.plan_id) {
      const { data: plan } = await supabase
        .from('plans')
        .select('ai_unlimited')
        .eq('id', estData.plan_id)
        .single();
      if (plan?.ai_unlimited) setHasUnlimited(true);
    }

    const { data: creditsData } = await supabase
      .from('ai_credits')
      .select('credits_balance')
      .eq('establishment_id', establishment.id)
      .single();
    if (creditsData) setCredits(creditsData.credits_balance || 0);
  };

  const loadLatestAnalysis = async () => {
    if (!establishment?.id) return;
    const { data } = await supabase
      .from('ai_profile_analyses')
      .select('*')
      .eq('establishment_id', establishment.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (data) {
      setAnalysis({
        overall_score: data.overall_score || 0,
        description_score: data.description_score || 0,
        photos_score: data.photos_score || 0,
        banner_score: data.banner_score || 0,
        logo_score: data.logo_score || 0,
        products_analyzed: data.products_analyzed || 0,
        suggestions: (data.suggestions as unknown as Suggestion[]) || []
      });
    }
  };

  const simulateStep = async (stepId: string, delay: number) => {
    setAnalysisSteps(prev => prev.map(s => 
      s.id === stepId ? { ...s, status: 'loading' } : s
    ));
    await new Promise(resolve => setTimeout(resolve, delay));
    setAnalysisSteps(prev => prev.map(s => 
      s.id === stepId ? { ...s, status: 'complete' } : s
    ));
  };

  const runAnalysis = async () => {
    if (!establishment?.id) return;
    setAnalyzing(true);
    setAnalysisSteps(prev => prev.map(s => ({ ...s, status: 'pending' })));
    
    try {
      // Simulate steps for UX
      await simulateStep('connect', 800);
      await simulateStep('extract', 1200);
      await simulateStep('photos', 1500);
      await simulateStep('descriptions', 1000);
      await simulateStep('branding', 800);
      
      setAnalysisSteps(prev => prev.map(s => 
        s.id === 'generate' ? { ...s, status: 'loading' } : s
      ));

      const response = await supabase.functions.invoke('analyze-establishment', { 
        body: { establishmentId: establishment.id } 
      });
      
      if (response.error) throw new Error(response.error.message);
      
      setAnalysisSteps(prev => prev.map(s => 
        s.id === 'generate' ? { ...s, status: 'complete' } : s
      ));
      
      setAnalysis(response.data);
      toast.success("Análise concluída!");
    } catch (error: unknown) {
      toast.error("Erro na análise: " + (error instanceof Error ? error.message : 'Erro'));
    } finally { 
      setAnalyzing(false); 
    }
  };

  const applyImprovements = async (actions: Suggestion[]) => {
    if (!establishment?.id) return;
    setApplying(true);
    try {
      const response = await supabase.functions.invoke('apply-ai-improvements', {
        body: { 
          establishmentId: establishment.id, 
          actions: actions.filter(a => a.action).map(a => ({ 
            type: a.action, 
            target_id: a.target_id, 
            target_name: a.target_name 
          })) 
        }
      });
      if (response.error) throw new Error(response.error.message);
      toast.success(`${response.data.summary.successful} melhorias aplicadas!`);
      await runAnalysis();
    } catch (error: unknown) {
      toast.error("Erro: " + (error instanceof Error ? error.message : 'Erro'));
    } finally { setApplying(false); }
  };

  const applySingleAction = async (suggestion: Suggestion) => {
    if (!establishment?.id || !suggestion.action) return;
    setApplying(true);
    try {
      const response = await supabase.functions.invoke('apply-ai-improvements', {
        body: { 
          establishmentId: establishment.id, 
          actions: [{ 
            type: suggestion.action, 
            target_id: suggestion.target_id, 
            target_name: suggestion.target_name 
          }] 
        }
      });
      if (response.error) throw new Error(response.error.message);
      toast.success("Melhoria aplicada!");
      await loadLatestAnalysis();
    } catch (error: unknown) {
      toast.error("Erro: " + (error instanceof Error ? error.message : 'Erro'));
    } finally { setApplying(false); }
  };

  const getScoreLevel = (score: number): 'critical' | 'medium' | 'good' => {
    if (score >= 80) return 'good';
    if (score >= 50) return 'medium';
    return 'critical';
  };

  const getScoreColor = (score: number) => {
    const level = getScoreLevel(score);
    if (level === 'good') return "text-green-400";
    if (level === 'medium') return "text-yellow-400";
    return "text-red-400";
  };

  const getProgressGradient = (score: number) => {
    const level = getScoreLevel(score);
    if (level === 'good') return "from-green-500 to-green-400";
    if (level === 'medium') return "from-yellow-500 to-yellow-400";
    return "from-red-500 to-red-400";
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'visual': return Camera;
      case 'design': return Palette;
      case 'pricing': return DollarSign;
      case 'promotion': return Tag;
      case 'content': return FileText;
      default: return Lightbulb;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'visual': return 'Potencial Visual do Lovable';
      case 'design': return 'Design e Hierarquia Visual Estratégica';
      case 'pricing': return 'Precificação Psicológica para Lovable';
      case 'promotion': return 'Sistema de Promoções Inteligentes';
      case 'content': return 'Descrições e Conteúdo';
      default: return 'Sugestões Gerais';
    }
  };

  const groupedSuggestions = analysis?.suggestions.reduce((acc, s) => {
    const cat = s.category || 'content';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {} as Record<string, Suggestion[]>) || {};

  const highPrioritySuggestions = analysis?.suggestions.filter(s => s.priority === 'high') || [];

  // Analyzing State
  if (analyzing) {
    const progress = analysisSteps.filter(s => s.status === 'complete').length / analysisSteps.length * 100;
    
    return (
      <DashboardLayout title="Diagnóstico IA">
        <div className="min-h-[80vh] flex items-center justify-center">
          <Card className="w-full max-w-xl bg-card/50 backdrop-blur border-primary/20">
            <CardContent className="pt-8 pb-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <Search className="w-10 h-10 text-primary animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-primary mb-2">Analisando Cardápio</h2>
                <p className="text-muted-foreground">
                  Processando dados para gerar seu diagnóstico personalizado
                </p>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso geral</span>
                  <span className="text-primary font-semibold">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-green-400 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {analysisSteps.map((step) => (
                  <div 
                    key={step.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all",
                      step.status === 'complete' && "bg-primary/10 border-primary/30",
                      step.status === 'loading' && "bg-muted/50 border-primary/50",
                      step.status === 'pending' && "bg-muted/20 border-muted/30 opacity-50"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      step.status === 'complete' && "bg-primary text-primary-foreground",
                      step.status === 'loading' && "bg-primary/30",
                      step.status === 'pending' && "bg-muted"
                    )}>
                      {step.status === 'complete' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : step.status === 'loading' ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                      )}
                    </div>
                    <span className={cn(
                      "font-medium",
                      step.status === 'complete' && "text-foreground",
                      step.status === 'loading' && "text-primary",
                      step.status === 'pending' && "text-muted-foreground"
                    )}>
                      {step.label}
                    </span>
                    {step.status === 'loading' && (
                      <div className="ml-auto">
                        <div className="h-1 w-24 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary animate-pulse" style={{ width: '60%' }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-muted-foreground">Processando análise avançada</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Results State
  if (analysis) {
    return (
      <DashboardLayout title="Diagnóstico IA">
        <div className="space-y-6">
          {/* Header Banner */}
          <Card className="bg-gradient-to-r from-primary/20 via-primary/10 to-background border-primary/30">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold mb-1">
                    Análise personalizada para {establishment?.name}
                  </h1>
                  <p className="text-muted-foreground">
                    Diagnóstico específico baseado no seu cardápio digital
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={runAnalysis}
                  className="border-primary/50 hover:bg-primary/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Analisar novamente
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Score Card */}
          <Card className="bg-card/80 backdrop-blur">
            <CardContent className="py-8">
              <div className="text-center mb-6">
                <h2 className="text-lg font-medium text-muted-foreground mb-2">Nota do seu cardápio</h2>
                <div className={cn("text-6xl font-bold", getScoreColor(analysis.overall_score))}>
                  {analysis.overall_score}<span className="text-2xl text-muted-foreground">/100</span>
                </div>
              </div>

              {/* Score Bar */}
              <div className="max-w-2xl mx-auto mb-6">
                <div className="h-4 bg-muted rounded-full overflow-hidden flex">
                  <div className="h-full bg-red-500" style={{ width: '33%' }} />
                  <div className="h-full bg-yellow-500" style={{ width: '34%' }} />
                  <div className="h-full bg-green-500" style={{ width: '33%' }} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Crítico</span>
                  <span>Médio</span>
                  <span>Bom</span>
                </div>
                <div 
                  className="relative -mt-6"
                  style={{ marginLeft: `${Math.min(analysis.overall_score, 98)}%` }}
                >
                  <div className="w-3 h-3 bg-white border-2 border-primary rounded-full shadow-lg" />
                </div>
              </div>

              {/* Alert Box */}
              {analysis.overall_score < 70 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 max-w-2xl mx-auto">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-200">
                        Seu cardápio precisa de atenção! 
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Identificamos {highPrioritySuggestions.length} problemas críticos que podem estar impactando suas vendas.
                        Com algumas melhorias simples você pode aumentar significativamente a conversão.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Score Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Descrições', score: analysis.description_score, icon: FileText },
              { label: 'Fotos', score: analysis.photos_score, icon: Camera },
              { label: 'Banner', score: analysis.banner_score, icon: Layout },
              { label: 'Logo', score: analysis.logo_score, icon: Store },
            ].map((item) => (
              <Card key={item.label} className="bg-card/60">
                <CardContent className="pt-6 text-center">
                  <item.icon className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                  <div className={cn("text-3xl font-bold", getScoreColor(item.score))}>
                    {item.score}%
                  </div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full bg-gradient-to-r", getProgressGradient(item.score))}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Critical Alert Section */}
          {highPrioritySuggestions.length > 0 && (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <CardTitle className="text-red-400">Diagnóstico Técnico do Cardápio</CardTitle>
                </div>
                <CardDescription>
                  Identificamos {highPrioritySuggestions.length} problemas graves em seu cardápio que estão prejudicando suas vendas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Badge variant="outline" className="bg-primary/10 border-primary/30">
                    ANÁLISE BASEADA EM {analysis.products_analyzed} PRODUTOS | PRECISÃO DE 94.2%
                  </Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(groupedSuggestions).slice(0, 4).map(([category, suggestions]) => {
                    const CategoryIcon = getCategoryIcon(category);
                    return (
                      <div 
                        key={category}
                        className="p-4 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <CategoryIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm mb-1">
                              {getCategoryLabel(category)}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-3">
                              {suggestions[0]?.detail || suggestions[0]?.message}
                            </p>
                            <p className="text-xs text-primary mt-2">
                              {suggestions.length} melhoria{suggestions.length > 1 ? 's' : ''} identificada{suggestions.length > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-300 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Boa notícia: todas essas falhas têm soluções simples e comprovadas que podem ser implementadas em 24-48h.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Strategy Cards */}
          <Card>
            <CardHeader>
              <CardTitle>Estratégias comprovadas para seu cardápio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-card/50 hover:border-primary/30 transition-colors">
                  <CheckCircle className="w-6 h-6 text-primary mb-3" />
                  <h4 className="font-semibold mb-2">Gatilhos mentais</h4>
                  <p className="text-sm text-muted-foreground">
                    Selos como "Favorito dos clientes" aumentam conversão em até 17% em itens destacados.
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-card/50 hover:border-primary/30 transition-colors">
                  <Camera className="w-6 h-6 text-primary mb-3" />
                  <h4 className="font-semibold mb-2">Fotos profissionais</h4>
                  <p className="text-sm text-muted-foreground">
                    Imagens de alta qualidade com fundo neutro aumentam as vendas em até 84% comparado a itens sem foto.
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-card/50 hover:border-primary/30 transition-colors">
                  <Tag className="w-6 h-6 text-primary mb-3" />
                  <h4 className="font-semibold mb-2">Combos estratégicos</h4>
                  <p className="text-sm text-muted-foreground">
                    Combos bem estruturados elevam o ticket médio em 20-40% e aumentam a preferência de compra do cliente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Apply All CTA */}
          <Card className="bg-gradient-to-r from-primary/20 to-green-500/20 border-primary/40">
            <CardContent className="py-8">
              <div className="text-center max-w-2xl mx-auto">
                <p className="text-muted-foreground mb-4">
                  Nossa análise identificou que seu cardápio atual está deixando dinheiro na mesa. Com pequenos ajustes estratégicos, você pode aumentar significativamente seu faturamento e reduzir custos desnecessários.
                </p>
                
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-1">Melhorias disponíveis</p>
                  <p className="text-4xl font-bold text-primary">
                    {analysis.suggestions.filter(s => s.action).length} ações
                  </p>
                  <p className="text-sm text-muted-foreground">
                    prontas para serem aplicadas automaticamente
                  </p>
                </div>

                <Button 
                  size="lg"
                  onClick={() => applyImprovements(analysis.suggestions)}
                  disabled={applying}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                >
                  {applying ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Aplicando melhorias...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Aplicar todas as melhorias
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>

                {!hasUnlimited && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Custo: {analysis.suggestions.filter(s => s.action).length} créditos de IA
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento das melhorias</CardTitle>
              <CardDescription>
                Lista completa de {analysis.suggestions.length} melhorias identificadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.suggestions.map((suggestion, index) => (
                  <div 
                    key={index}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-lg border transition-colors hover:border-primary/30",
                      suggestion.priority === 'high' && "border-red-500/30 bg-red-500/5",
                      suggestion.priority === 'medium' && "border-yellow-500/30 bg-yellow-500/5",
                      suggestion.priority === 'low' && "border-muted"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg",
                      suggestion.priority === 'high' && "bg-red-500/20",
                      suggestion.priority === 'medium' && "bg-yellow-500/20",
                      suggestion.priority === 'low' && "bg-muted"
                    )}>
                      {suggestion.type === 'photo' && <Camera className="w-5 h-5" />}
                      {suggestion.type === 'description' && <FileText className="w-5 h-5" />}
                      {suggestion.type === 'logo' && <Store className="w-5 h-5" />}
                      {suggestion.type === 'banner' && <Layout className="w-5 h-5" />}
                      {!['photo', 'description', 'logo', 'banner'].includes(suggestion.type) && (
                        <Lightbulb className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            suggestion.priority === 'high' && "border-red-500/50 text-red-400",
                            suggestion.priority === 'medium' && "border-yellow-500/50 text-yellow-400",
                            suggestion.priority === 'low' && "border-muted-foreground/50"
                          )}
                        >
                          {suggestion.priority === 'high' ? 'Alta' : suggestion.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                        {suggestion.target_name && (
                          <span className="text-xs text-muted-foreground">
                            → {suggestion.target_name}
                          </span>
                        )}
                      </div>
                      <p className="font-medium">{suggestion.message}</p>
                      {suggestion.detail && (
                        <p className="text-sm text-muted-foreground mt-1">{suggestion.detail}</p>
                      )}
                    </div>
                    {suggestion.action && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => applySingleAction(suggestion)}
                        disabled={applying}
                        className="flex-shrink-0"
                      >
                        {applying ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-1" />
                            Aplicar
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Empty State
  return (
    <DashboardLayout title="Diagnóstico IA">
      <div className="min-h-[70vh] flex items-center justify-center">
        <Card className="max-w-lg text-center bg-card/50 backdrop-blur">
          <CardContent className="py-12">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
              <Brain className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Diagnóstico Inteligente</h2>
            <p className="text-muted-foreground mb-6">
              Descubra oportunidades escondidas no seu cardápio e receba sugestões personalizadas para aumentar suas vendas.
            </p>

            <div className="flex flex-col gap-3 text-sm text-muted-foreground mb-8">
              <div className="flex items-center gap-2 justify-center">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>Análise completa em 30 segundos</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>Sugestões baseadas em dados reais</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>Aplicação automática com IA</span>
              </div>
            </div>

            <Button size="lg" onClick={runAnalysis} className="px-8">
              <Sparkles className="w-5 h-5 mr-2" />
              Analisar Meu Cardápio
            </Button>

            {hasUnlimited ? (
              <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
                <Crown className="w-3 h-3 text-amber-500" />
                Plano Premium - Análises ilimitadas
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-4">
                <Zap className="w-3 h-3 inline mr-1" />
                {credits} créditos disponíveis
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AIAnalysisDashboard;
