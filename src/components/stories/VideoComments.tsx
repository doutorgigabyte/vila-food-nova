import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  Send, 
  Reply, 
  Trash2, 
  EyeOff,
  X
} from 'lucide-react';
import { useVideoComments, VideoComment } from '@/hooks/useVideoComments';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VideoCommentsProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
  isOwner?: boolean;
}

const CommentItem = ({ 
  comment, 
  onReply, 
  onDelete, 
  onHide,
  isOwner,
  currentUserId 
}: { 
  comment: VideoComment;
  onReply: (id: string) => void;
  onDelete: (id: string) => void;
  onHide: (id: string) => void;
  isOwner?: boolean;
  currentUserId?: string;
}) => {
  const isOwnComment = currentUserId && comment.user_id === currentUserId;
  const displayName = comment.user?.email?.split('@')[0] || 'Usuário';
  
  return (
    <div className="flex gap-3 py-3">
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarFallback className="text-xs bg-primary/10 text-primary">
          {displayName.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{displayName}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { 
              addSuffix: true, 
              locale: ptBR 
            })}
          </span>
        </div>
        <p className="text-sm mt-1 break-words">{comment.content}</p>
        <div className="flex gap-2 mt-2">
          <button 
            onClick={() => onReply(comment.id)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <Reply className="w-3 h-3" />
            Responder
          </button>
          {isOwnComment && (
            <button 
              onClick={() => onDelete(comment.id)}
              className="text-xs text-destructive hover:text-destructive/80 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Excluir
            </button>
          )}
          {isOwner && !isOwnComment && (
            <button 
              onClick={() => onHide(comment.id)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <EyeOff className="w-3 h-3" />
              Ocultar
            </button>
          )}
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="ml-4 mt-3 border-l-2 border-border pl-3 space-y-3">
            {comment.replies.map(reply => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onReply={onReply}
                onDelete={onDelete}
                onHide={onHide}
                isOwner={isOwner}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const VideoComments = ({ videoId, isOpen, onClose, isOwner }: VideoCommentsProps) => {
  const { user } = useAuth();
  const { comments, isLoading, fetchComments, addComment, deleteComment, hideComment, totalComments } = useVideoComments(videoId);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && videoId) {
      fetchComments();
    }
  }, [isOpen, videoId, fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    await addComment(newComment, replyingTo || undefined);
    setNewComment('');
    setReplyingTo(null);
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center">
      <div className="bg-background w-full max-w-md h-[70vh] sm:h-[80vh] sm:rounded-t-2xl sm:rounded-b-2xl rounded-t-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            <span className="font-semibold">Comentários</span>
            <span className="text-muted-foreground text-sm">({totalComments})</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Comments List */}
        <ScrollArea className="flex-1 px-4">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Carregando comentários...
            </div>
          ) : comments.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Nenhum comentário ainda</p>
              <p className="text-sm">Seja o primeiro a comentar!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {comments.map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onReply={handleReply}
                  onDelete={deleteComment}
                  onHide={hideComment}
                  isOwner={isOwner}
                  currentUserId={user?.id}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-border">
          {replyingTo && (
            <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
              <span>Respondendo ao comentário...</span>
              <button type="button" onClick={() => setReplyingTo(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={user ? "Adicione um comentário..." : "Faça login para comentar"}
              className="flex-1"
              disabled={!user}
            />
            <Button type="submit" size="icon" disabled={!newComment.trim() || !user}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VideoComments;
