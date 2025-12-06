import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Video, Trash2, Eye, EyeOff, Link2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/hooks/useEstablishment';
import { uploadToS3, validateFile, UploadType } from '@/lib/s3';
import { toast } from 'sonner';
import { getImageUrl } from '@/lib/s3';

interface EstablishmentVideo {
  id: string;
  video_url: string;
  thumbnail_url: string | null;
  title: string | null;
  description: string | null;
  product_id: string | null;
  views_count: number;
  likes_count: number;
  shares_count: number;
  is_active: boolean;
  sort_order: number;
  product?: {
    id: string;
    name: string;
    image_url: string | null;
  } | null;
}

interface Product {
  id: string;
  name: string;
}

export default function VideosManagement() {
  const { slug } = useParams();
  const { establishment } = useEstablishment(slug);
  const [products, setProducts] = useState<Product[]>([]);
  const [videos, setVideos] = useState<EstablishmentVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    product_id: '',
    video: null as File | null,
    thumbnail: null as File | null,
  });

  const fetchProducts = async () => {
    if (!establishment?.id) return;
    const { data } = await supabase
      .from('products')
      .select('id, name')
      .eq('establishment_id', establishment.id)
      .eq('is_active', true);
    setProducts(data || []);
  };

  const fetchVideos = async () => {
    if (!establishment?.id) return;

    try {
      const { data, error } = await supabase
        .from('establishment_videos')
        .select(`*, product:products(id, name, image_url)`)
        .eq('establishment_id', establishment.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error('Erro ao carregar vídeos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (establishment?.id) {
      fetchVideos();
      fetchProducts();
    }
  }, [establishment?.id]);

  const handleUpload = async () => {
    if (!formData.video || !establishment?.id) {
      toast.error('Selecione um vídeo para enviar');
      return;
    }

    const validation = validateFile(formData.video, {
      maxSize: 100 * 1024 * 1024,
      allowedTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    });

    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      setUploadProgress(20);
      const videoResult = await uploadToS3(formData.video, 'videos' as UploadType, establishment.id);
      setUploadProgress(60);

      let thumbnailUrl = null;
      if (formData.thumbnail) {
        const thumbResult = await uploadToS3(formData.thumbnail, 'videos' as UploadType, establishment.id);
        thumbnailUrl = thumbResult.url;
      }
      setUploadProgress(80);

      const { error } = await supabase
        .from('establishment_videos')
        .insert({
          establishment_id: establishment.id,
          video_url: videoResult.url,
          thumbnail_url: thumbnailUrl,
          title: formData.title || null,
          description: formData.description || null,
          product_id: formData.product_id || null,
          sort_order: videos.length,
        });

      if (error) throw error;

      setUploadProgress(100);
      toast.success('Vídeo enviado com sucesso!');
      setIsDialogOpen(false);
      setFormData({ title: '', description: '', product_id: '', video: null, thumbnail: null });
      fetchVideos();
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error('Erro ao enviar vídeo');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const toggleVideoStatus = async (videoId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('establishment_videos')
        .update({ is_active: !isActive })
        .eq('id', videoId);

      if (error) throw error;
      toast.success(isActive ? 'Vídeo desativado' : 'Vídeo ativado');
      fetchVideos();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const deleteVideo = async (videoId: string) => {
    try {
      const { error } = await supabase
        .from('establishment_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;
      toast.success('Vídeo excluído');
      fetchVideos();
    } catch (error) {
      toast.error('Erro ao excluir vídeo');
    }
  };

  return (
    <AdminLayout title="VilaTok - Vídeos">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">Gerencie seus vídeos promocionais</p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Novo Vídeo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Adicionar Vídeo</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Vídeo *</Label>
                  <Input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(e) => setFormData({ ...formData, video: e.target.files?.[0] || null })} className="mt-1" />
                </div>
                <div>
                  <Label>Capa (opcional)</Label>
                  <Input type="file" accept="image/*" onChange={(e) => setFormData({ ...formData, thumbnail: e.target.files?.[0] || null })} className="mt-1" />
                </div>
                <div>
                  <Label>Título</Label>
                  <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Ex: Promoção de terça!" className="mt-1" />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descreva seu vídeo..." className="mt-1" rows={2} />
                </div>
                <div>
                  <Label>Vincular Produto</Label>
                  <Select value={formData.product_id} onValueChange={(value) => setFormData({ ...formData, product_id: value })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {products?.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                {isUploading && (
                  <div className="space-y-2">
                    <div className="w-full bg-muted rounded-full h-2"><div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} /></div>
                    <p className="text-sm text-muted-foreground text-center">Enviando... {uploadProgress}%</p>
                  </div>
                )}
                <Button onClick={handleUpload} disabled={!formData.video || isUploading} className="w-full">{isUploading ? 'Enviando...' : 'Enviar Vídeo'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card><CardContent className="py-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><Video className="w-8 h-8 text-primary" /><div><p className="font-medium">Vídeos Utilizados</p><p className="text-sm text-muted-foreground">{videos.length} vídeos</p></div></div><Badge variant="outline" className="text-lg px-4 py-2">{videos.length} / 10</Badge></div></CardContent></Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <Card key={video.id} className="overflow-hidden">
              <div className="relative aspect-[9/16] bg-muted">
                {video.thumbnail_url ? (<img src={getImageUrl(video.thumbnail_url)} alt={video.title || 'Vídeo'} className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center"><Video className="w-12 h-12 text-muted-foreground" /></div>)}
                <div className="absolute top-2 left-2"><Badge variant={video.is_active ? 'default' : 'secondary'}>{video.is_active ? 'Ativo' : 'Inativo'}</Badge></div>
                <div className="absolute bottom-2 left-2 right-2 flex gap-2"><Badge variant="secondary" className="text-xs">👁 {video.views_count}</Badge><Badge variant="secondary" className="text-xs">❤️ {video.likes_count}</Badge></div>
              </div>
              <CardContent className="p-4 space-y-3">
                <div><h3 className="font-medium line-clamp-1">{video.title || 'Sem título'}</h3>{video.product && (<div className="flex items-center gap-1 text-sm text-muted-foreground mt-1"><Link2 className="w-3 h-3" /><span className="line-clamp-1">{video.product.name}</span></div>)}</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => toggleVideoStatus(video.id, video.is_active)} className="flex-1">{video.is_active ? (<><EyeOff className="w-4 h-4 mr-1" />Desativar</>) : (<><Eye className="w-4 h-4 mr-1" />Ativar</>)}</Button>
                  <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir vídeo?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteVideo(video.id)}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
          {videos.length === 0 && !isLoading && (<Card className="col-span-full"><CardContent className="py-12 text-center"><Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-medium mb-2">Nenhum vídeo ainda</h3><p className="text-muted-foreground mb-4">Adicione vídeos para aparecer no VilaTok!</p><Button onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Adicionar Primeiro Vídeo</Button></CardContent></Card>)}
        </div>
      </div>
    </AdminLayout>
  );
}
