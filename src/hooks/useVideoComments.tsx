import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface VideoComment {
  id: string;
  video_id: string;
  user_id: string | null;
  session_id: string | null;
  parent_id: string | null;
  content: string;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    email?: string;
  };
  replies?: VideoComment[];
}

export function useVideoComments(videoId: string | undefined) {
  const { user } = useAuth();
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => {
    let id = localStorage.getItem('vilatok_session_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('vilatok_session_id', id);
    }
    return id;
  });

  const fetchComments = useCallback(async () => {
    if (!videoId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('video_comments')
        .select('*')
        .eq('video_id', videoId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Organize into parent/replies structure
      const parentComments: VideoComment[] = [];
      const repliesMap: Record<string, VideoComment[]> = {};

      (data || []).forEach((comment: VideoComment) => {
        if (comment.parent_id) {
          if (!repliesMap[comment.parent_id]) {
            repliesMap[comment.parent_id] = [];
          }
          repliesMap[comment.parent_id].push(comment);
        } else {
          parentComments.push(comment);
        }
      });

      // Attach replies to parent comments
      const commentsWithReplies = parentComments.map(comment => ({
        ...comment,
        replies: repliesMap[comment.id] || [],
      }));

      setComments(commentsWithReplies);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [videoId]);

  const addComment = useCallback(async (content: string, parentId?: string) => {
    if (!videoId || !content.trim()) return;

    try {
      const insertData = {
        video_id: videoId,
        content: content.trim(),
        parent_id: parentId || null,
        user_id: user?.id || null,
        session_id: user?.id ? null : sessionId,
      };

      const { error } = await supabase
        .from('video_comments')
        .insert(insertData);

      if (error) throw error;

      // Update comments count manually
      const { data: videoData } = await supabase
        .from('establishment_videos')
        .select('comments_count')
        .eq('id', videoId)
        .single();

      await supabase
        .from('establishment_videos')
        .update({ comments_count: (videoData?.comments_count || 0) + 1 })
        .eq('id', videoId);

      toast.success('Comentário adicionado!');
      await fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Erro ao adicionar comentário');
    }
  }, [videoId, user?.id, sessionId, fetchComments]);

  const deleteComment = useCallback(async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('video_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast.success('Comentário excluído');
      await fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Erro ao excluir comentário');
    }
  }, [fetchComments]);

  const hideComment = useCallback(async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('video_comments')
        .update({ is_hidden: true })
        .eq('id', commentId);

      if (error) throw error;

      toast.success('Comentário ocultado');
      await fetchComments();
    } catch (error) {
      console.error('Error hiding comment:', error);
      toast.error('Erro ao ocultar comentário');
    }
  }, [fetchComments]);

  return {
    comments,
    isLoading,
    fetchComments,
    addComment,
    deleteComment,
    hideComment,
    totalComments: comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0),
  };
}
