import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Video, 
  Eye, 
  Heart, 
  Share2, 
  Trash2,
  Edit,
  Play
} from "lucide-react";
import { toast } from "sonner";
import StoriesCreator, { type StoryData } from "@/components/stories/StoriesCreator";
import { useEstablishment } from "@/hooks/useEstablishment";

const StoriesManagement = () => {
  const { slug } = useParams();
  const { establishment } = useEstablishment(slug);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  const { data: stories, isLoading, refetch } = useQuery({
    queryKey: ["stories", establishment?.id],
    queryFn: async () => {
      if (!establishment?.id) return [];
      
      const { data, error } = await supabase
        .from("establishment_videos")
        .select("*")
        .eq("establishment_id", establishment.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!establishment?.id,
  });

  const handlePublish = async (storyData: StoryData) => {
    if (!establishment?.id) return;

    try {
      // In production, upload to S3 first
      const { error } = await supabase
        .from("establishment_videos")
        .insert({
          establishment_id: establishment.id,
          video_url: storyData.videoUrl,
          thumbnail_url: storyData.thumbnailUrl,
          description: storyData.description,
          duration: storyData.duration,
          is_active: true,
        });

      if (error) throw error;
      
      await refetch();
      setIsCreatorOpen(false);
    } catch (error) {
      console.error("Error publishing story:", error);
      throw error;
    }
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from("establishment_videos")
        .update({ is_active: !currentState })
        .eq("id", id);

      if (error) throw error;
      
      toast.success(currentState ? "Story desativado" : "Story ativado");
      refetch();
    } catch (error) {
      console.error("Error toggling story:", error);
      toast.error("Erro ao atualizar story");
    }
  };

  const deleteStory = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este story?")) return;

    try {
      const { error } = await supabase
        .from("establishment_videos")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Story excluído");
      refetch();
    } catch (error) {
      console.error("Error deleting story:", error);
      toast.error("Erro ao excluir story");
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <AdminLayout title="Stories">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Stories</h1>
            <p className="text-muted-foreground">
              Crie vídeos curtos para promover seus produtos
            </p>
          </div>
          <Button onClick={() => setIsCreatorOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Criar Story
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Video className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stories?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stories?.reduce((acc, s) => acc + (s.views_count || 0), 0) || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Visualizações</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stories?.reduce((acc, s) => acc + (s.likes_count || 0), 0) || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Curtidas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stories?.reduce((acc, s) => acc + (s.shares_count || 0), 0) || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Compartilhamentos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stories Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[9/16] rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : stories && stories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {stories.map(story => (
              <Card key={story.id} className="overflow-hidden">
                <div className="relative aspect-[9/16] bg-muted">
                  {story.thumbnail_url ? (
                    <img
                      src={story.thumbnail_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={story.video_url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  )}
                  
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center">
                      <Play className="w-5 h-5 text-black ml-0.5" />
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="absolute top-2 right-2">
                    <Badge variant={story.is_active ? "default" : "secondary"}>
                      {story.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>

                  {/* Stats overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex items-center gap-3 text-white text-xs">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {story.views_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {story.likes_count || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <CardContent className="p-3">
                  <p className="text-sm font-medium truncate mb-1">
                    {story.title || story.description || "Sem título"}
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    {formatDate(story.created_at || "")}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <Switch
                      checked={story.is_active || false}
                      onCheckedChange={() => toggleActive(story.id, story.is_active || false)}
                    />
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteStory(story.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Video className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-1">Nenhum story criado</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Crie seu primeiro story para promover seus produtos
              </p>
              <Button onClick={() => setIsCreatorOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Criar Story
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stories Creator Modal */}
      {isCreatorOpen && establishment && (
        <StoriesCreator
          establishmentId={establishment.id}
          onClose={() => setIsCreatorOpen(false)}
          onPublish={handlePublish}
        />
      )}
    </AdminLayout>
  );
};

export default StoriesManagement;
