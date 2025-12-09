import { useState } from "react";
import { Plus, Trash2, GripVertical, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export interface ProductAdditional {
  id: string;
  name: string;
  price: number;
  is_required: boolean;
  max_quantity: number;
  group: string;
}

interface ProductAdditionalsManagerProps {
  additionals: ProductAdditional[];
  onChange: (additionals: ProductAdditional[]) => void;
}

const defaultGroups = [
  'Extras',
  'Bordas',
  'Acompanhamentos',
  'Bebidas',
  'Molhos',
  'Tamanhos',
  'Complementos',
];

export function ProductAdditionalsManager({
  additionals,
  onChange,
}: ProductAdditionalsManagerProps) {
  const [newGroup, setNewGroup] = useState("");

  const generateId = () => `add_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addAdditional = () => {
    onChange([
      ...additionals,
      {
        id: generateId(),
        name: "",
        price: 0,
        is_required: false,
        max_quantity: 1,
        group: "Extras",
      },
    ]);
  };

  const removeAdditional = (id: string) => {
    onChange(additionals.filter((a) => a.id !== id));
  };

  const updateAdditional = (id: string, field: keyof ProductAdditional, value: any) => {
    onChange(
      additionals.map((a) =>
        a.id === id ? { ...a, [field]: value } : a
      )
    );
  };

  // Get unique groups from additionals and default groups
  const allGroups = Array.from(
    new Set([...defaultGroups, ...additionals.map((a) => a.group).filter(Boolean)])
  );

  // Group additionals by group name
  const groupedAdditionals = additionals.reduce((acc, additional) => {
    const group = additional.group || "Outros";
    if (!acc[group]) acc[group] = [];
    acc[group].push(additional);
    return acc;
  }, {} as Record<string, ProductAdditional[]>);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Adicionais do Produto
          </CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addAdditional}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure extras, bordas, acompanhamentos e outros adicionais opcionais ou obrigatórios
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {additionals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Nenhum adicional cadastrado</p>
            <p className="text-sm">Clique em "Adicionar" para criar adicionais como bordas, extras, etc.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {additionals.map((additional, index) => (
              <div
                key={additional.id}
                className="flex flex-col sm:flex-row gap-3 p-3 border rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-2 sm:hidden">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">#{index + 1}</span>
                  {additional.is_required && (
                    <Badge variant="secondary" className="text-xs">Obrigatório</Badge>
                  )}
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {/* Nome */}
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Nome</Label>
                    <Input
                      placeholder="Ex: Borda Recheada"
                      value={additional.name}
                      onChange={(e) => updateAdditional(additional.id, "name", e.target.value)}
                    />
                  </div>

                  {/* Preço */}
                  <div>
                    <Label className="text-xs">Preço (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={additional.price || ""}
                      onChange={(e) =>
                        updateAdditional(additional.id, "price", parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>

                  {/* Grupo */}
                  <div>
                    <Label className="text-xs">Grupo</Label>
                    <Select
                      value={additional.group}
                      onValueChange={(value) => updateAdditional(additional.id, "group", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {allGroups.map((group) => (
                          <SelectItem key={group} value={group}>
                            {group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Máximo */}
                  <div>
                    <Label className="text-xs">Máx. Qtd</Label>
                    <Input
                      type="number"
                      min="1"
                      max="99"
                      value={additional.max_quantity}
                      onChange={(e) =>
                        updateAdditional(additional.id, "max_quantity", parseInt(e.target.value) || 1)
                      }
                    />
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3 sm:flex-col sm:items-end justify-between sm:justify-start">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs whitespace-nowrap">Obrigatório</Label>
                    <Switch
                      checked={additional.is_required}
                      onCheckedChange={(checked) =>
                        updateAdditional(additional.id, "is_required", checked)
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeAdditional(additional.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary by Group */}
        {Object.keys(groupedAdditionals).length > 0 && (
          <div className="pt-4 border-t">
            <Label className="text-sm text-muted-foreground mb-2 block">
              Resumo por Grupo
            </Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(groupedAdditionals).map(([group, items]) => (
                <Badge key={group} variant="outline">
                  {group}: {items.length} {items.length === 1 ? 'item' : 'itens'}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
