import { useState } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useReviews, Review } from '@/hooks/useReviews';
import { useEstablishment } from '@/hooks/useEstablishment';
import { StarRating } from '@/components/reviews/StarRating';
import { Star, MessageSquare, Eye, EyeOff, Send, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

const ReviewsManagement = () => {
  const { slug } = useParams<{ slug: string }>();
  const { establishment, loading: estLoading } = useEstablishment(slug);
  const { reviews, loading, stats, respondToReview, toggleVisibility } = useReviews(establishment?.id);
  
  const [responseDialog, setResponseDialog] = useState<{ open: boolean; review: Review | null }>({
    open: false,
    review: null,
  });
  const [responseText, setResponseText] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'responded'>('all');

  const filteredReviews = reviews.filter(r => {
    if (filter === 'pending') return !r.owner_response;
    if (filter === 'responded') return !!r.owner_response;
    return true;
  });

  const handleRespond = async () => {
    if (!responseDialog.review || !responseText.trim()) return;
    await respondToReview(responseDialog.review.id, responseText.trim());
    setResponseDialog({ open: false, review: null });
    setResponseText('');
  };

  if (estLoading || loading) {
    return (
      <DashboardLayout title="Avaliações">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Avaliações">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Star className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.average.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Média geral</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.count}</p>
                  <p className="text-xs text-muted-foreground">Total de avaliações</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingResponses}</p>
                  <p className="text-xs text-muted-foreground">Sem resposta</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stats.distribution[4] + stats.distribution[3]}
                  </p>
                  <p className="text-xs text-muted-foreground">4-5 estrelas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rating Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Distribuição de notas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(star => {
                const count = stats.distribution[star - 1];
                const percentage = stats.count > 0 ? (count / stats.count) * 100 : 0;
                
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="w-4 text-sm">{star}</span>
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-400 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-12 text-sm text-muted-foreground text-right">
                      {count} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Avaliações recentes</CardTitle>
              <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
                <TabsList>
                  <TabsTrigger value="all">Todas</TabsTrigger>
                  <TabsTrigger value="pending">Pendentes</TabsTrigger>
                  <TabsTrigger value="responded">Respondidas</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {filteredReviews.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma avaliação encontrada
              </p>
            ) : (
              <div className="space-y-4">
                {filteredReviews.map(review => (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StarRating value={review.overall_rating} readonly size="sm" />
                          <span className="text-sm font-medium">
                            {review.customer?.name || 'Cliente'}
                          </span>
                          {review.order?.order_number && (
                            <Badge variant="outline" className="text-xs">
                              Pedido #{review.order.order_number}
                            </Badge>
                          )}
                          {review.is_verified_purchase && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Verificado
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(review.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </p>

                        {review.comment && (
                          <p className="mt-2 text-sm">{review.comment}</p>
                        )}

                        {review.owner_response && (
                          <div className="mt-3 bg-muted/50 rounded-lg p-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Sua resposta:
                            </p>
                            <p className="text-sm">{review.owner_response}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleVisibility(review.id, !review.is_visible)}
                        >
                          {review.is_visible ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </Button>
                        {!review.owner_response && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setResponseDialog({ open: true, review });
                              setResponseText('');
                            }}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Response Dialog */}
      <Dialog 
        open={responseDialog.open} 
        onOpenChange={(open) => setResponseDialog({ open, review: responseDialog.review })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responder avaliação</DialogTitle>
          </DialogHeader>
          
          {responseDialog.review && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <StarRating value={responseDialog.review.overall_rating} readonly size="sm" />
                  <span className="text-sm font-medium">
                    {responseDialog.review.customer?.name || 'Cliente'}
                  </span>
                </div>
                {responseDialog.review.comment && (
                  <p className="text-sm">{responseDialog.review.comment}</p>
                )}
              </div>

              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Escreva sua resposta..."
                rows={4}
              />
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setResponseDialog({ open: false, review: null })}
            >
              Cancelar
            </Button>
            <Button onClick={handleRespond} disabled={!responseText.trim()}>
              <Send className="w-4 h-4 mr-2" />
              Enviar resposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ReviewsManagement;
