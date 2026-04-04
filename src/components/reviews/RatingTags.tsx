import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Tag {
  id: string;
  tag_text: string;
  icon: string;
  sentiment: string;
}

interface RatingTagsProps {
  category: 'product' | 'delivery' | 'establishment' | 'platform';
  rating: number | null;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  disabled?: boolean;
}

const RatingTags = ({ category, rating, selectedTags, onTagsChange, disabled }: RatingTagsProps) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (rating === null) {
      setTags([]);
      return;
    }

    const fetchTags = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('review_tags')
          .select('id, tag_text, icon, sentiment')
          .eq('category', category)
          .eq('is_active', true)
          .lte('rating_min', rating)
          .gte('rating_max', rating)
          .order('sort_order');

        if (error) throw error;
        setTags(data || []);
      } catch (error) {
        console.error('Error fetching tags:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, [category, rating]);

  const toggleTag = (tagText: string) => {
    if (disabled) return;
    
    if (selectedTags.includes(tagText)) {
      onTagsChange(selectedTags.filter(t => t !== tagText));
    } else {
      onTagsChange([...selectedTags, tagText]);
    }
  };

  if (rating === null || tags.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Selecione o que mais se aplica (opcional):
      </p>
      <div className="flex flex-wrap gap-2">
        {loading ? (
          <span className="text-sm text-muted-foreground">Carregando...</span>
        ) : (
          tags.map((tag) => (
            <Badge
              key={tag.id}
              variant={selectedTags.includes(tag.tag_text) ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer transition-all duration-200 py-1.5 px-3 text-sm',
                selectedTags.includes(tag.tag_text) 
                  ? tag.sentiment === 'positive'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                  : 'hover:bg-muted',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => toggleTag(tag.tag_text)}
            >
              {tag.icon} {tag.tag_text}
            </Badge>
          ))
        )}
      </div>
    </div>
  );
};

export default RatingTags;
