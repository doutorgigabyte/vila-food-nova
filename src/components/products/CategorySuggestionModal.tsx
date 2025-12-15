import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Lightbulb } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const suggestionSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  parent_segment_id: z.string().optional(),
});

type SuggestionFormData = z.infer<typeof suggestionSchema>;

interface CategorySuggestionModalProps {
  establishmentId: string;
  onCategoryCreated: (categoryId: string, categoryName: string) => void;
  trigger?: React.ReactNode;
}

export function CategorySuggestionModal({
  establishmentId,
  onCategoryCreated,
  trigger,
}: CategorySuggestionModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: segments } = useQuery({
    queryKey: ["segments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("segments")
        .select("id, name, icon")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<SuggestionFormData>({
    resolver: zodResolver(suggestionSchema),
    defaultValues: {
      name: "",
      description: "",
      parent_segment_id: "",
    },
  });

  const handleSubmit = async (data: SuggestionFormData) => {
    setIsSubmitting(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      
      // 1. Create local category for immediate use
      const { data: newCategory, error: categoryError } = await supabase
        .from("categories")
        .insert({
          name: data.name,
          description: data.description || null,
          establishment_id: establishmentId,
          is_active: true,
        })
        .select()
        .single();

      if (categoryError) throw categoryError;

      // 2. Create suggestion for admin review
      const { error: suggestionError } = await supabase
        .from("category_suggestions")
        .insert({
          establishment_id: establishmentId,
          user_id: user.user?.id,
          name: data.name,
          description: data.description || null,
          parent_segment_id: data.parent_segment_id || null,
          local_category_id: newCategory.id,
          status: "pending",
        });

      if (suggestionError) throw suggestionError;

      toast.success("Categoria criada e sugestão enviada para aprovação!");
      onCategoryCreated(newCategory.id, newCategory.name);
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Error creating category suggestion:", error);
      toast.error("Erro ao criar categoria");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button type="button" variant="outline" size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Sugerir Categoria
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Sugerir Nova Categoria
          </DialogTitle>
          <DialogDescription>
            Sua categoria será criada imediatamente para uso. A equipe irá
            avaliar se ela pode ser adicionada às categorias globais do sistema.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Categoria *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Açaí, Sushi, Eletrônicos..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva brevemente esta categoria..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parent_segment_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Área de Negócio (opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a área..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {segments?.map((segment) => (
                        <SelectItem key={segment.id} value={segment.id}>
                          {segment.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Criando..." : "Criar Categoria"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
