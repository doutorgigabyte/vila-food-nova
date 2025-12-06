import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Sparkles, Image, FileText, Store, TrendingUp, AlertTriangle, Loader2, Zap, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEstablishment } from "@/hooks/useEstablishment";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { toast } from "sonner";

interface Suggestion {
  type: 'description' | 'photo' | 'banner' | 'logo' | 'general';
  priority: 'high' | 'medium' | 'low';
  message: string;
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

const AIAnalysisDashboard = () => {
  const { slug } = useParams();
  const { establishment } = useEstablishment(slug);
  const [analyzing, setAnalyzing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [hasUnlimited, setHasUnlimited] = useState(false);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    if (establishment?.id) {
      loadLatestAnalysis();
    }
  }, [establishment?.id]);

  const loadLatestAnalysis = async () => {
    if (!establishment?.id) return;
    const { data } = await supabase.from('ai_profile_analyses').select('*').eq('establishment_id', establishment.id).order('created_at', { ascending: false }).limit(1).single();
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

  const runAnalysis = async () => {
    if (!establishment?.id) return;
    setAnalyzing(true);
    try {
      const response = await supabase.functions.invoke('analyze-establishment', { body: { establishmentId: establishment.id } });
      if (response.error) throw new Error(response.error.message);
      setAnalysis(response.data);
      toast.success("Análise concluída!");
    } catch (error: unknown) {
      toast.error("Erro na análise: " + (error instanceof Error ? error.message : 'Erro'));
    } finally { setAnalyzing(false); }
  };

  const applyImprovements = async (actions: Suggestion[]) => {
    if (!establishment?.id) return;
    setApplying(true);
    try {
      const response = await supabase.functions.invoke('apply-ai-improvements', {
        body: { establishmentId: establishment.id, actions: actions.filter(a => a.action).map(a => ({ type: a.action, target_id: a.target_id, target_name: a.target_name })) }
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
        body: { establishmentId: establishment.id, actions: [{ type: suggestion.action, target_id: suggestion.target_id, target_name: suggestion.target_name }] }
      });
      if (response.error) throw new Error(response.error.message);
      toast.success("Melhoria aplicada!");
      await loadLatestAnalysis();
    } catch (error: unknown) {
      toast.error("Erro: " + (error instanceof Error ? error.message : 'Erro'));
    } finally { setApplying(false); }
  };

  const getScoreColor = (score: number) => score >= 80 ? "text-green-500" : score >= 50 ? "text-yellow-500" : "text-red-500";
  const getPriorityColor = (priority: string) => priority === 'high' ? "bg-red-100 text-red-800" : priority === 'medium' ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800";

  return (
    <DashboardLayout title="Diagnóstico IA">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              Diagnóstico IA
            </h1>
            <p className="text-muted-foreground">
              Análise inteligente do seu perfil e sugestões de melhorias
            </p>
          </div>

          <div className="flex items-center gap-3">
            {hasUnlimited ? (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                <Crown className="w-3 h-3 mr-1" />
                Plano Premium
              </Badge>
            ) : (
              <Badge variant="outline">
                <Zap className="w-3 h-3 mr-1" />
                {credits} créditos
              </Badge>
            )}

            <Button onClick={runAnalysis} disabled={analyzing}>
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analisar Perfil
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Score Cards */}
        {analysis && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className={`text-4xl font-bold ${getScoreColor(analysis.overall_score)}`}>
                  {analysis.overall_score}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">Score Geral</p>
                <Progress 
                  value={analysis.overall_score} 
                  className="mt-2 h-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <FileText className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                <div className={`text-2xl font-bold ${getScoreColor(analysis.description_score)}`}>
                  {analysis.description_score}%
                </div>
                <p className="text-xs text-muted-foreground">Descrições</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <Image className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                <div className={`text-2xl font-bold ${getScoreColor(analysis.photos_score)}`}>
                  {analysis.photos_score}%
                </div>
                <p className="text-xs text-muted-foreground">Fotos</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <Store className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                <div className={`text-2xl font-bold ${getScoreColor(analysis.banner_score)}`}>
                  {analysis.banner_score}%
                </div>
                <p className="text-xs text-muted-foreground">Banner</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <TrendingUp className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                <div className={`text-2xl font-bold ${getScoreColor(analysis.logo_score)}`}>
                  {analysis.logo_score}%
                </div>
                <p className="text-xs text-muted-foreground">Logo</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Suggestions */}
        {analysis && analysis.suggestions.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sugestões de Melhoria</CardTitle>
                <CardDescription>
                  {analysis.suggestions.length} melhorias identificadas
                </CardDescription>
              </div>
              
              <Button 
                onClick={() => applyImprovements(analysis.suggestions)}
                disabled={applying}
                className="bg-gradient-to-r from-primary to-orange-500"
              >
                {applying ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Aplicar Todas
                {!hasUnlimited && (
                  <Badge variant="secondary" className="ml-2">
                    {analysis.suggestions.filter(s => s.action).length} créditos
                  </Badge>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">Todas</TabsTrigger>
                  <TabsTrigger value="photo">Fotos</TabsTrigger>
                  <TabsTrigger value="description">Descrições</TabsTrigger>
                  <TabsTrigger value="branding">Marca</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-3 mt-4">
                  {analysis.suggestions.map((suggestion, index) => (
                    <SuggestionCard 
                      key={index}
                      suggestion={suggestion}
                      onApply={() => applySingleAction(suggestion)}
                      applying={applying}
                      hasUnlimited={hasUnlimited}
                      getPriorityColor={getPriorityColor}
                    />
                  ))}
                </TabsContent>

                <TabsContent value="photo" className="space-y-3 mt-4">
                  {analysis.suggestions.filter(s => s.type === 'photo').map((suggestion, index) => (
                    <SuggestionCard 
                      key={index}
                      suggestion={suggestion}
                      onApply={() => applySingleAction(suggestion)}
                      applying={applying}
                      hasUnlimited={hasUnlimited}
                      getPriorityColor={getPriorityColor}
                    />
                  ))}
                </TabsContent>

                <TabsContent value="description" className="space-y-3 mt-4">
                  {analysis.suggestions.filter(s => s.type === 'description').map((suggestion, index) => (
                    <SuggestionCard 
                      key={index}
                      suggestion={suggestion}
                      onApply={() => applySingleAction(suggestion)}
                      applying={applying}
                      hasUnlimited={hasUnlimited}
                      getPriorityColor={getPriorityColor}
                    />
                  ))}
                </TabsContent>

                <TabsContent value="branding" className="space-y-3 mt-4">
                  {analysis.suggestions.filter(s => s.type === 'logo' || s.type === 'banner').map((suggestion, index) => (
                    <SuggestionCard 
                      key={index}
                      suggestion={suggestion}
                      onApply={() => applySingleAction(suggestion)}
                      applying={applying}
                      hasUnlimited={hasUnlimited}
                      getPriorityColor={getPriorityColor}
                    />
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!analysis && !analyzing && (
          <Card className="text-center py-12">
            <CardContent>
              <Brain className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma análise realizada</h3>
              <p className="text-muted-foreground mb-4">
                Clique em "Analisar Perfil" para receber sugestões personalizadas
              </p>
              <Button onClick={runAnalysis}>
                <Sparkles className="w-4 h-4 mr-2" />
                Iniciar Análise
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

interface SuggestionCardProps {
  suggestion: Suggestion;
  onApply: () => void;
  applying: boolean;
  hasUnlimited: boolean;
  getPriorityColor: (priority: string) => string;
}

const SuggestionCard = ({ suggestion, onApply, applying, hasUnlimited, getPriorityColor }: SuggestionCardProps) => {
  const getIcon = () => {
    switch (suggestion.type) {
      case 'photo': return <Image className="w-5 h-5" />;
      case 'description': return <FileText className="w-5 h-5" />;
      case 'logo': return <Store className="w-5 h-5" />;
      case 'banner': return <Store className="w-5 h-5" />;
      default: return <AlertTriangle className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className={`p-2 rounded-lg ${getPriorityColor(suggestion.priority)}`}>
        {getIcon()}
      </div>
      <div className="flex-1">
        <p className="font-medium">{suggestion.message}</p>
        {suggestion.target_name && (
          <p className="text-sm text-muted-foreground mt-1">
            Alvo: {suggestion.target_name}
          </p>
        )}
      </div>
      {suggestion.action && (
        <Button 
          size="sm" 
          variant="outline"
          onClick={onApply}
          disabled={applying}
        >
          {applying ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-1" />
              Aplicar
              {!hasUnlimited && <span className="ml-1 text-xs">(1 cr)</span>}
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default AIAnalysisDashboard;