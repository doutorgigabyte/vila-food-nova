import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Heart, MoreVertical } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getImageUrl } from '@/lib/s3';
import { toast } from 'sonner';

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface VilaTokCommentsProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
  commentsCount: number;
  onCommentsCountChange?: (count: number) => void;
}

export function VilaTokComments({
  videoId,
  isOpen,
  onClose,
  commentsCount,
  onCommentsCountChange,
}: VilaTokCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchComments = useCallback(async () => {
    if (!videoId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('video_comments')
        .select(`
          id,
          user_id,
          content,
          created_at
        `)
        .eq('video_id', videoId)
        .is('parent_id', null)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = [...new Set((data || []).map((c: any) => c.user_id).filter(Boolean))];
      const profilesMap = new Map();
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);
        
        (profilesData || []).forEach((profile: any) => {
          profilesMap.set(profile.id, profile);
        });
      }

      const formattedComments = (data || []).map((comment: any) => ({
        id: comment.id,
        user_id: comment.user_id,
        content: comment.content,
        created_at: comment.created_at,
        user: comment.user_id ? profilesMap.get(comment.user_id) || null : null,
      }));

      setComments(formattedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Erro ao carregar comentários');
    } finally {
      setIsLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    if (isOpen && videoId) {
      fetchComments();
      // Focus input after a short delay
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, videoId, fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Faça login para comentar');
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('video_comments')
        .insert({
          video_id: videoId,
          user_id: user.id,
          content: newComment.trim(),
        })
        .select('id, user_id, content, created_at')
        .single();

      if (error) throw error;

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', user.id)
        .single();

      const newCommentData = {
        id: data.id,
        user_id: data.user_id,
        content: data.content,
        created_at: data.created_at,
        user: profileData || null,
      };

      setComments((prev) => [newCommentData, ...prev]);
      setNewComment('');
      onCommentsCountChange?.(comments.length + 1);

      // Scroll to top
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error('Error submitting comment:', error);
      toast.error(error.message || 'Erro ao comentar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'agora';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  };

  return (
    <>
      {/* Overlay para mobile */}
      <div
        className={cn(
          'fixed inset-0 z-[100] bg-black/80 transition-opacity duration-300 md:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />
      
      {/* Comments Panel - ao lado no desktop, overlay no mobile */}
      <div
        className={cn(
          'fixed right-0 top-0 bottom-0 bg-background border-l border-border transition-transform duration-300 ease-out z-[100]',
          'w-full md:w-[400px] lg:w-[450px]',
          isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-full pointer-events-none'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Comentários</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments List */}
        <ScrollArea className="flex-1 h-[calc(100vh-140px)]">
          <div ref={scrollRef} className="p-4 space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando comentários...
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-2">Nenhum comentário ainda</p>
                <p className="text-sm">Seja o primeiro a comentar!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={getImageUrl(comment.user?.avatar_url)} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {comment.user?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold">
                          {comment.user?.full_name || 'Usuário'}
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                          {comment.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTimeAgo(comment.created_at)}
                        </p>
                      </div>
                      <button className="shrink-0 p-1 hover:bg-muted rounded-full transition-colors">
                        <Heart className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Comment Input */}
        {user ? (
          <form
            onSubmit={handleSubmit}
            className="sticky bottom-0 border-t border-border bg-background p-4"
          >
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Adicione um comentário..."
                className="flex-1"
                disabled={isSubmitting}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!newComment.trim() || isSubmitting}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        ) : (
          <div className="sticky bottom-0 border-t border-border bg-background p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Faça login para comentar
            </p>
            <Button size="sm" onClick={() => window.location.href = '/auth'}>
              Entrar
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

