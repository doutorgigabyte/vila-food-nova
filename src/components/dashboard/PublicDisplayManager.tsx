import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Plus, Trash2, ExternalLink, Monitor, ChefHat, Tv } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generateUUID } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DisplayToken {
  id: string;
  token: string;
  display_type: string;
  name: string | null;
  is_active: boolean;
  created_at: string;
}

interface PublicDisplayManagerProps {
  establishmentId: string;
}

export function PublicDisplayManager({ establishmentId }: PublicDisplayManagerProps) {
  const [tokens, setTokens] = useState<DisplayToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTokenName, setNewTokenName] = useState("");
  const [newTokenType, setNewTokenType] = useState("kitchen");

  useEffect(() => {
    fetchTokens();
  }, [establishmentId]);

  const fetchTokens = async () => {
    try {
      const { data, error } = await (supabase
        .from("public_display_tokens" as any)
        .select("*")
        .eq("establishment_id", establishmentId)
        .order("created_at", { ascending: false }) as any);

      if (error) throw error;
      setTokens((data || []) as DisplayToken[]);
    } catch (error) {
      console.error("Error fetching tokens:", error);
    } finally {
      setLoading(false);
    }
  };

  const createToken = async () => {
    if (!newTokenName.trim()) {
      toast.error("Digite um nome para identificar o display");
      return;
    }

    try {
      const token = generateUUID().replace(/-/g, '').substring(0, 16);
      
      const { error } = await (supabase
        .from("public_display_tokens" as any)
        .insert({
          establishment_id: establishmentId,
          token,
          display_type: newTokenType,
          name: newTokenName.trim(),
        }) as any);

      if (error) throw error;

      toast.success("Link público criado!");
      setIsDialogOpen(false);
      setNewTokenName("");
      setNewTokenType("kitchen");
      fetchTokens();
    } catch (error) {
      console.error("Error creating token:", error);
      toast.error("Erro ao criar link");
    }
  };

  const deleteToken = async (id: string) => {
    try {
      const { error } = await (supabase
        .from("public_display_tokens" as any)
        .delete()
        .eq("id", id) as any);

      if (error) throw error;

      toast.success("Link removido!");
      fetchTokens();
    } catch (error) {
      console.error("Error deleting token:", error);
      toast.error("Erro ao remover link");
    }
  };

  const copyToClipboard = async (token: string, type: string) => {
    const baseUrl = window.location.origin;
    const url = type === "kitchen" 
      ? `${baseUrl}/display/cozinha/${token}`
      : `${baseUrl}/display/tv/${token}`;
    
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    } catch {
      toast.error("Erro ao copiar link");
    }
  };

  const openDisplay = (token: string, type: string) => {
    const baseUrl = window.location.origin;
    const url = type === "kitchen" 
      ? `${baseUrl}/display/cozinha/${token}`
      : `${baseUrl}/display/tv/${token}`;
    window.open(url, '_blank');
  };

  const getDisplayIcon = (type: string) => {
    switch (type) {
      case "kitchen": return <ChefHat className="w-5 h-5" />;
      case "tv_slides": return <Tv className="w-5 h-5" />;
      default: return <Monitor className="w-5 h-5" />;
    }
  };

  const getDisplayLabel = (type: string) => {
    switch (type) {
      case "kitchen": return "Cozinha/KDS";
      case "tv_slides": return "VilaTok TV";
      default: return "Display";
    }
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          Links Públicos para TV
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Novo Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Link Público</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nome do Display</Label>
                <Input
                  placeholder="Ex: TV Cozinha, Monitor Balcão..."
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Display</Label>
                <Select value={newTokenType} onValueChange={setNewTokenType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kitchen">
                      <div className="flex items-center gap-2">
                        <ChefHat className="w-4 h-4" />
                        Cozinha / KDS
                      </div>
                    </SelectItem>
                    <SelectItem value="tv_slides">
                      <div className="flex items-center gap-2">
                        <Tv className="w-4 h-4" />
                        VilaTok TV (Slides)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={createToken} className="w-full">
                Criar Link
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {tokens.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum link público criado. Crie um para exibir em TVs sem precisar de login.
          </p>
        ) : (
          <div className="space-y-3">
            {tokens.map((token) => (
              <div
                key={token.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getDisplayIcon(token.display_type)}
                  <div>
                    <p className="font-medium">{token.name}</p>
                    <Badge variant="outline" className="text-xs">
                      {getDisplayLabel(token.display_type)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(token.token, token.display_type)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openDisplay(token.token, token.display_type)}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteToken(token.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}