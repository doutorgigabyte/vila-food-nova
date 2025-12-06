import { useState, useRef } from "react";
import { Upload, Download, FileSpreadsheet, Check, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ImportRow {
  nome: string;
  descricao?: string;
  preco: number;
  preco_promocional?: number;
  categoria?: string;
  tipo?: string;
  sabores?: string;
  tamanhos?: string;
  temperatura?: string;
  estoque?: number;
  valid: boolean;
  errors: string[];
}

interface BulkProductImportProps {
  establishmentId: string;
  categories: { id: string; name: string }[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const BulkProductImport = ({
  establishmentId,
  categories,
  onSuccess,
  onCancel,
}: BulkProductImportProps) => {
  const [previewData, setPreviewData] = useState<ImportRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const headers = ['nome', 'descricao', 'preco', 'preco_promocional', 'categoria', 'tipo', 'sabores', 'tamanhos', 'temperatura', 'estoque'];
    const exampleRows = [
      ['Pizza Calabresa', 'Deliciosa pizza de calabresa com cebola', '45.90', '39.90', 'Pizzas', 'pizza', 'Calabresa;Portuguesa;Margherita', 'P:35.90:1;M:49.90:2;G:69.90:3', '', ''],
      ['Coca-Cola 2L', 'Refrigerante gelado 2 litros', '12.90', '', 'Bebidas', 'drink', '', '', 'gelada;ambiente', '50'],
      ['Picanha 500g', 'Picanha fresca premium', '59.90', '', 'Carnes', 'fresh', '', '', 'in_natura', '20'],
      ['Sorvete 1L', 'Sorvete cremoso de chocolate', '29.90', '24.90', 'Sobremesas', 'frozen', '', '', 'congelada', '30'],
      ['Cerveja Lata', 'Cerveja lata 350ml', '5.90', '', 'Bebidas', 'combo', '', '', 'gelada;ambiente', '100'],
    ];

    const csvContent = [
      headers.join(','),
      ...exampleRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modelo_produtos_vilafood.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (content: string): string[][] => {
    const lines = content.split('\n');
    return lines.map(line => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  };

  const validateRow = (row: string[], headers: string[]): ImportRow => {
    const data: any = {};
    const errors: string[] = [];

    headers.forEach((header, index) => {
      data[header.toLowerCase()] = row[index] || '';
    });

    // Validações
    if (!data.nome) {
      errors.push('Nome é obrigatório');
    }

    const preco = parseFloat(data.preco);
    if (isNaN(preco) || preco <= 0) {
      errors.push('Preço inválido');
    }

    const precoPromo = data.preco_promocional ? parseFloat(data.preco_promocional) : undefined;
    if (precoPromo && (isNaN(precoPromo) || precoPromo >= preco)) {
      errors.push('Preço promocional deve ser menor que o preço');
    }

    return {
      nome: data.nome,
      descricao: data.descricao,
      preco,
      preco_promocional: precoPromo,
      categoria: data.categoria,
      tipo: data.tipo || 'single',
      sabores: data.sabores,
      tamanhos: data.tamanhos,
      temperatura: data.temperatura,
      estoque: data.estoque ? parseInt(data.estoque) : undefined,
      valid: errors.length === 0,
      errors,
    };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const content = await file.text();
      const rows = parseCSV(content);
      
      if (rows.length < 2) {
        toast.error('Arquivo vazio ou sem dados');
        return;
      }

      const headers = rows[0].map(h => h.toLowerCase().replace(/['"]/g, ''));
      const dataRows = rows.slice(1).filter(row => row.some(cell => cell.trim()));

      const validated = dataRows.map(row => validateRow(row, headers));
      setPreviewData(validated);

      const validCount = validated.filter(r => r.valid).length;
      toast.success(`${validCount} de ${validated.length} produtos válidos`);
    } catch (error) {
      console.error('Parse error:', error);
      toast.error('Erro ao processar arquivo');
    } finally {
      setIsProcessing(false);
    }
  };

  const importProducts = async () => {
    const validProducts = previewData.filter(p => p.valid);
    if (validProducts.length === 0) {
      toast.error('Nenhum produto válido para importar');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      for (let i = 0; i < validProducts.length; i++) {
        const product = validProducts[i];
        
        // Encontrar ou criar categoria
        let categoryId: string | null = null;
        if (product.categoria) {
          const existingCat = categories.find(
            c => c.name.toLowerCase() === product.categoria?.toLowerCase()
          );
          if (existingCat) {
            categoryId = existingCat.id;
          } else {
            const { data: newCat } = await supabase
              .from('categories')
              .insert({ 
                name: product.categoria, 
                establishment_id: establishmentId 
              })
              .select('id')
              .single();
            if (newCat) categoryId = newCat.id;
          }
        }

        // Processar variações de pizza
        let variations = null;
        if (product.tipo === 'pizza' && (product.tamanhos || product.sabores)) {
          const sizes = product.tamanhos?.split(';').map(s => {
            const [name, price, maxFlavors] = s.split(':');
            return { name, price: parseFloat(price), max_flavors: parseInt(maxFlavors) || 1 };
          }) || [];
          
          const flavors = product.sabores?.split(';').map(name => ({
            name: name.trim(),
            price_modifier: 0,
          })) || [];

          variations = { sizes, flavors };
        }

        // Processar temperaturas
        const temperatureOptions = product.temperatura?.split(';').map(t => t.trim()) || [];

        // Inserir produto
        await supabase.from('products').insert({
          name: product.nome,
          description: product.descricao,
          price: product.preco,
          promotional_price: product.preco_promocional,
          category_id: categoryId,
          establishment_id: establishmentId,
          product_type: product.tipo || 'single',
          variations,
          temperature_options: temperatureOptions.length > 0 ? temperatureOptions : null,
          stock_quantity: product.estoque,
          allows_multiple_flavors: product.tipo === 'pizza',
          max_flavors: product.tipo === 'pizza' ? Math.max(...(variations?.sizes?.map((s: any) => s.max_flavors) || [1])) : 1,
          is_active: true,
        });

        setImportProgress(Math.round(((i + 1) / validProducts.length) * 100));
      }

      toast.success(`${validProducts.length} produtos importados!`);
      onSuccess();
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.message || 'Erro ao importar produtos');
    } finally {
      setIsImporting(false);
    }
  };

  const validCount = previewData.filter(p => p.valid).length;
  const invalidCount = previewData.filter(p => !p.valid).length;

  return (
    <div className="space-y-6">
      {/* Download Template */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            1. Baixe a Planilha Modelo
          </CardTitle>
          <CardDescription>
            Use nossa planilha modelo para formatar seus produtos corretamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={downloadTemplate} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Baixar Modelo CSV
          </Button>
        </CardContent>
      </Card>

      {/* Upload File */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="w-5 h-5" />
            2. Envie sua Planilha
          </CardTitle>
          <CardDescription>
            Selecione o arquivo CSV com seus produtos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Selecionar Arquivo
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              3. Confirme os Produtos
            </CardTitle>
            <CardDescription className="flex gap-4">
              <Badge variant="default" className="gap-1">
                <Check className="w-3 h-3" /> {validCount} válidos
              </Badge>
              {invalidCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <X className="w-3 h-3" /> {invalidCount} com erros
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isImporting && (
              <div className="mb-4 space-y-2">
                <Progress value={importProgress} />
                <p className="text-sm text-muted-foreground text-center">
                  Importando... {importProgress}%
                </p>
              </div>
            )}

            <div className="max-h-96 overflow-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Erros</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {row.valid ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <X className="w-5 h-5 text-destructive" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{row.nome}</TableCell>
                      <TableCell>
                        R$ {row.preco?.toFixed(2) || '-'}
                        {row.preco_promocional && (
                          <span className="text-xs text-muted-foreground ml-1">
                            (promo: R${row.preco_promocional.toFixed(2)})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{row.categoria || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.tipo}</Badge>
                      </TableCell>
                      <TableCell>
                        {row.errors.length > 0 && (
                          <span className="text-xs text-destructive">
                            {row.errors.join(', ')}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {invalidCount > 0 && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {invalidCount} produto(s) com erros não serão importados
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 justify-end mt-4">
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button 
                onClick={importProducts}
                disabled={validCount === 0 || isImporting}
              >
                {isImporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Importar {validCount} Produtos
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
