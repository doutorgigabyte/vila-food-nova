import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Database, AlertCircle, Store, Package, Image, ArrowLeft, CheckCircle, Upload } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Link } from 'react-router-dom';

interface EstablishmentStats {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  categoryCount: number;
  hasCloudFrontImages: boolean;
  logoUrl: string | null;
  bannerUrl: string | null;
}

interface SystemDiagnosis {
  totalEstablishments: number;
  establishmentsWithProducts: number;
  establishmentsWithoutProducts: number;
  totalProducts: number;
  establishmentsWithCloudFrontImages: number;
  establishmentsStats: EstablishmentStats[];
}

export default function DiagnosticoSistema() {
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<SystemDiagnosis | null>(null);

  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);

  const importProductsFromCSV = async () => {
    if (!csvText.trim()) {
      toast.error('Cole os dados CSV primeiro');
      return;
    }

    setImporting(true);
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4b3bb9d5-0bd3-4d19-9163-674db6e8b95b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DiagnosticoSistema.tsx:importProductsFromCSV',message:'Starting CSV import',data:{csvLength:csvText.length},timestamp:Date.now(),sessionId:'debug-session',runId:'import-products',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      // Parse CSV
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('CSV deve ter pelo menos um cabeçalho e uma linha de dados');
      }

      const headers = lines[0].split(',');
      const products = [];

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4b3bb9d5-0bd3-4d19-9163-674db6e8b95b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DiagnosticoSistema.tsx:importProductsFromCSV',message:'Parsing CSV',data:{headerCount:headers.length,lineCount:lines.length-1},timestamp:Date.now(),sessionId:'debug-session',runId:'import-products',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        // Simple CSV parsing (handles quoted fields)
        const values: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current);

        if (values.length !== headers.length) {
          console.warn(`Linha ${i + 1} tem ${values.length} colunas, esperado ${headers.length}`);
          continue;
        }

        const product: any = {};
        headers.forEach((header, idx) => {
          const value = values[idx]?.trim() || '';
          const cleanValue = value.replace(/^"|"$/g, ''); // Remove quotes
          
          // Parse based on header
          if (header === 'price' || header === 'promotional_price') {
            product[header] = cleanValue ? parseFloat(cleanValue) : null;
          } else if (header === 'is_active' || header === 'is_featured') {
            product[header] = cleanValue === 'true' || cleanValue === '1';
          } else if (header === 'stock_quantity' || header === 'preparation_time') {
            product[header] = cleanValue ? parseInt(cleanValue) : null;
          } else if (header === 'variations' || header === 'additionals') {
            try {
              product[header] = cleanValue ? JSON.parse(cleanValue) : [];
            } catch {
              product[header] = [];
            }
          } else {
            product[header] = cleanValue || null;
          }
        });

        products.push(product);
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4b3bb9d5-0bd3-4d19-9163-674db6e8b95b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DiagnosticoSistema.tsx:importProductsFromCSV',message:'Parsed products',data:{productCount:products.length},timestamp:Date.now(),sessionId:'debug-session',runId:'import-products',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      const { data: result, error } = await supabase.functions.invoke('migrate-legacy-data', {
        body: { action: 'import_products_csv', data: { csvData: products } }
      });

      if (error) throw error;
      if (!result.success) throw new Error(result.error || 'Erro desconhecido');

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4b3bb9d5-0bd3-4d19-9163-674db6e8b95b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DiagnosticoSistema.tsx:importProductsFromCSV',message:'Import completed',data:result,timestamp:Date.now(),sessionId:'debug-session',runId:'import-products',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      toast.success(result.message || `Importados ${result.imported || 0} produtos`);
      setCsvText('');
      await runDiagnosis();
    } catch (err: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4b3bb9d5-0bd3-4d19-9163-674db6e8b95b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DiagnosticoSistema.tsx:importProductsFromCSV',message:'Import error',data:{error:err.message},timestamp:Date.now(),sessionId:'debug-session',runId:'import-products',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      toast.error(`Erro: ${err.message}`);
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  const [tableCheck, setTableCheck] = useState<any>(null);

  const migrateProductsPtToEn = async () => {
    setLoading(true);
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4b3bb9d5-0bd3-4d19-9163-674db6e8b95b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DiagnosticoSistema.tsx:migrateProductsPtToEn',message:'Starting products migration',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'migrate-products',hypothesisId:'E'})}).catch(()=>{});
      // #endregion

      const { data: result, error } = await supabase.functions.invoke('migrate-legacy-data', {
        body: { action: 'migrate_products_pt_to_en' }
      });

      if (error) throw error;
      if (!result.success) throw new Error(result.error || 'Erro desconhecido');

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4b3bb9d5-0bd3-4d19-9163-674db6e8b95b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DiagnosticoSistema.tsx:migrateProductsPtToEn',message:'Migration completed',data:result,timestamp:Date.now(),sessionId:'debug-session',runId:'migrate-products',hypothesisId:'E'})}).catch(()=>{});
      // #endregion

      toast.success(result.message || `Migrados ${result.migrated || 0} produtos`);
      await checkDuplicateTables();
      await runDiagnosis();
    } catch (err: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4b3bb9d5-0bd3-4d19-9163-674db6e8b95b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DiagnosticoSistema.tsx:migrateProductsPtToEn',message:'Migration error',data:{error:err.message},timestamp:Date.now(),sessionId:'debug-session',runId:'migrate-products',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      toast.error(`Erro: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkDuplicateTables = async () => {
    setLoading(true);
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4b3bb9d5-0bd3-4d19-9163-674db6e8b95b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DiagnosticoSistema.tsx:checkDuplicateTables',message:'Starting table check',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'check-tables',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      const requestBody = { action: 'check_duplicate_tables' };
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4b3bb9d5-0bd3-4d19-9163-674db6e8b95b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DiagnosticoSistema.tsx:checkDuplicateTables',message:'About to invoke function',data:{requestBody:requestBody},timestamp:Date.now(),sessionId:'debug-session',runId:'check-tables',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      // Try direct fetch first to get full HTTP response
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const functionUrl = `${supabaseUrl}/functions/v1/migrate-legacy-data`;
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4b3bb9d5-0bd3-4d19-9163-674db6e8b95b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DiagnosticoSistema.tsx:checkDuplicateTables',message:'Making direct fetch call',data:{functionUrl:functionUrl,hasKey:!!supabaseKey},timestamp:Date.now(),sessionId:'debug-session',runId:'check-tables',hypothesisId:'H'})}).catch(()=>{});
      // #endregion

      const directResponse = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey || ''
        },
        body: JSON.stringify(requestBody)
      });

      const responseText = await directResponse.text();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4b3bb9d5-0bd3-4d19-9163-674db6e8b95b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DiagnosticoSistema.tsx:checkDuplicateTables',message:'Direct fetch response',data:{status:directResponse.status,statusText:directResponse.statusText,responseText:responseText,headers:Object.fromEntries(directResponse.headers.entries())},timestamp:Date.now(),sessionId:'debug-session',runId:'check-tables',hypothesisId:'H'})}).catch(()=>{});
      // #endregion

      if (!directResponse.ok) {
        let errorBody;
        try {
          errorBody = JSON.parse(responseText);
        } catch {
          errorBody = { raw: responseText };
        }
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/4b3bb9d5-0bd3-4d19-9163-674db6e8b95b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DiagnosticoSistema.tsx:checkDuplicateTables',message:'Direct fetch error response',data:{status:directResponse.status,errorBody:errorBody},timestamp:Date.now(),sessionId:'debug-session',runId:'check-tables',hypothesisId:'H'})}).catch(()=>{});
        // #endregion
        throw new Error(`Edge Function returned ${directResponse.status}: ${errorBody.error || errorBody.raw || directResponse.statusText}`);
      }

      const result = JSON.parse(responseText);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4b3bb9d5-0bd3-4d19-9163-674db6e8b95b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DiagnosticoSistema.tsx:checkDuplicateTables',message:'Direct fetch success',data:{result:result},timestamp:Date.now(),sessionId:'debug-session',runId:'check-tables',hypothesisId:'H'})}).catch(()=>{});
      // #endregion

      if (!result || !result.success) {
        const errorMsg = result?.error || 'Erro desconhecido';
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/4b3bb9d5-0bd3-4d19-9163-674db6e8b95b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DiagnosticoSistema.tsx:checkDuplicateTables',message:'Function returned unsuccessful result',data:{result:result,error:errorMsg},timestamp:Date.now(),sessionId:'debug-session',runId:'check-tables',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        throw new Error(errorMsg);
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4b3bb9d5-0bd3-4d19-9163-674db6e8b95b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DiagnosticoSistema.tsx:checkDuplicateTables',message:'Table check completed',data:result,timestamp:Date.now(),sessionId:'debug-session',runId:'check-tables',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      setTableCheck(result);
      toast.success('Verificação de tabelas concluída!');
    } catch (err: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4b3bb9d5-0bd3-4d19-9163-674db6e8b95b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DiagnosticoSistema.tsx:checkDuplicateTables',message:'Table check error',data:{error:err.message,details:err},timestamp:Date.now(),sessionId:'debug-session',runId:'check-tables',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      const errorMsg = err.message || err.error || 'Erro desconhecido';
      const errorDetails = err.details || err.context || '';
      toast.error(`Erro: ${errorMsg}${errorDetails ? ` - ${errorDetails}` : ''}`);
      console.error('Full error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fixCloudFrontImages = async () => {
    setLoading(true);
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4b3bb9d5-0bd3-4d19-9163-674db6e8b95b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DiagnosticoSistema.tsx:fixCloudFrontImages',message:'Starting CloudFront image fix',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'fix-images',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      const requestBody = { action: 'update_cloudfront_images' };
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4b3bb9d5-0bd3-4d19-9163-674db6e8b95b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DiagnosticoSistema.tsx:fixCloudFrontImages',message:'About to invoke function',data:{requestBody:requestBody},timestamp:Date.now(),sessionId:'debug-session',runId:'fix-images',hypothesisId:'E'})}).catch(()=>{});
      // #endregion

      // Try direct fetch first to get full HTTP response
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const functionUrl = `${supabaseUrl}/functions/v1/migrate-legacy-data`;
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4b3bb9d5-0bd3-4d19-9163-674db6e8b95b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DiagnosticoSistema.tsx:fixCloudFrontImages',message:'Making direct fetch call',data:{functionUrl:functionUrl,hasKey:!!supabaseKey},timestamp:Date.now(),sessionId:'debug-session',runId:'fix-images',hypothesisId:'I'})}).catch(()=>{});
      // #endregion

      const directResponse = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey || ''
        },
        body: JSON.stringify(requestBody)
      });

      const responseText = await directResponse.text();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4b3bb9d5-0bd3-4d19-9163-674db6e8b95b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DiagnosticoSistema.tsx:fixCloudFrontImages',message:'Direct fetch response',data:{status:directResponse.status,statusText:directResponse.statusText,responseText:responseText,headers:Object.fromEntries(directResponse.headers.entries())},timestamp:Date.now(),sessionId:'debug-session',runId:'fix-images',hypothesisId:'I'})}).catch(()=>{});
      // #endregion

      if (!directResponse.ok) {
        let errorBody;
        try {
          errorBody = JSON.parse(responseText);
        } catch {
          errorBody = { raw: responseText };
        }
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/4b3bb9d5-0bd3-4d19-9163-674db6e8b95b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DiagnosticoSistema.tsx:fixCloudFrontImages',message:'Direct fetch error response',data:{status:directResponse.status,errorBody:errorBody},timestamp:Date.now(),sessionId:'debug-session',runId:'fix-images',hypothesisId:'I'})}).catch(()=>{});
        // #endregion
        throw new Error(`Edge Function returned ${directResponse.status}: ${errorBody.error || errorBody.raw || directResponse.statusText}`);
      }

      const result = JSON.parse(responseText);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4b3bb9d5-0bd3-4d19-9163-674db6e8b95b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DiagnosticoSistema.tsx:fixCloudFrontImages',message:'Direct fetch success',data:{result:result},timestamp:Date.now(),sessionId:'debug-session',runId:'fix-images',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      if (!result || !result.success) {
        const errorMsg = result?.error || 'Erro desconhecido';
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/4b3bb9d5-0bd3-4d19-9163-674db6e8b95b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DiagnosticoSistema.tsx:fixCloudFrontImages',message:'Function returned unsuccessful result',data:{result:result,error:errorMsg},timestamp:Date.now(),sessionId:'debug-session',runId:'fix-images',hypothesisId:'I'})}).catch(()=>{});
        // #endregion
        throw new Error(errorMsg);
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4b3bb9d5-0bd3-4d19-9163-674db6e8b95b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DiagnosticoSistema.tsx:fixCloudFrontImages',message:'CloudFront fix completed',data:result,timestamp:Date.now(),sessionId:'debug-session',runId:'fix-images',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      toast.success(result.message || `Atualizadas ${result.updated || 0} URLs de imagens`);
      await runDiagnosis();
    } catch (err: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4b3bb9d5-0bd3-4d19-9163-674db6e8b95b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DiagnosticoSistema.tsx:fixCloudFrontImages',message:'CloudFront fix error',data:{error:err.message,details:err},timestamp:Date.now(),sessionId:'debug-session',runId:'fix-images',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      const errorMsg = err.message || err.error || 'Erro desconhecido';
      const errorDetails = err.details || err.context || '';
      toast.error(`Erro: ${errorMsg}${errorDetails ? ` - ${errorDetails}` : ''}`);
      console.error('Full error:', err);
    } finally {
      setLoading(false);
    }
  };

  const runDiagnosis = async () => {
    setLoading(true);
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4b3bb9d5-0bd3-4d19-9163-674db6e8b95b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DiagnosticoSistema.tsx:42',message:'Starting system diagnosis',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'diagnosis',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      // Fetch all active establishments
      const { data: establishments, error: estError } = await supabase
        .from('establishments')
        .select('id, name, slug, logo_url, banner_url')
        .eq('status', 'active');

      if (estError) throw estError;

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4b3bb9d5-0bd3-4d19-9163-674db6e8b95b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DiagnosticoSistema.tsx:52',message:'Fetched establishments',data:{count:establishments?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'diagnosis',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      if (!establishments || establishments.length === 0) {
        toast.error('Nenhum estabelecimento encontrado');
        return;
      }

      // For each establishment, get product and category counts
      const statsPromises = establishments.map(async (est) => {
        const [productsRes, categoriesRes] = await Promise.all([
          supabase
            .from('products')
            .select('id, image_url', { count: 'exact', head: false })
            .eq('establishment_id', est.id)
            .eq('is_active', true),
          supabase
            .from('categories')
            .select('id', { count: 'exact', head: true })
            .eq('establishment_id', est.id)
            .eq('is_active', true),
        ]);

        const productCount = productsRes.count || 0;
        const categoryCount = categoriesRes.count || 0;
        
        // Check if any images use old CloudFront
        const hasCloudFrontImages = 
          (est.logo_url?.includes('d2fhl3f70zfvod.cloudfront.net') || false) ||
          (est.banner_url?.includes('d2fhl3f70zfvod.cloudfront.net') || false) ||
          (productsRes.data?.some(p => p.image_url?.includes('d2fhl3f70zfvod.cloudfront.net')) || false);

        return {
          id: est.id,
          name: est.name,
          slug: est.slug,
          productCount,
          categoryCount,
          hasCloudFrontImages,
          logoUrl: est.logo_url,
          bannerUrl: est.banner_url,
        };
      });

      const establishmentsStats = await Promise.all(statsPromises);

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4b3bb9d5-0bd3-4d19-9163-674db6e8b95b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DiagnosticoSistema.tsx:88',message:'Calculated stats for all establishments',data:{total:establishmentsStats.length,withProducts:establishmentsStats.filter(s=>s.productCount>0).length,withoutProducts:establishmentsStats.filter(s=>s.productCount===0).length},timestamp:Date.now(),sessionId:'debug-session',runId:'diagnosis',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      const totalProducts = establishmentsStats.reduce((sum, s) => sum + s.productCount, 0);
      const establishmentsWithProducts = establishmentsStats.filter(s => s.productCount > 0).length;
      const establishmentsWithoutProducts = establishmentsStats.filter(s => s.productCount === 0).length;
      const establishmentsWithCloudFrontImages = establishmentsStats.filter(s => s.hasCloudFrontImages).length;

      const diagnosisResult: SystemDiagnosis = {
        totalEstablishments: establishments.length,
        establishmentsWithProducts,
        establishmentsWithoutProducts,
        totalProducts,
        establishmentsWithCloudFrontImages,
        establishmentsStats: establishmentsStats.sort((a, b) => b.productCount - a.productCount),
      };

      setDiagnosis(diagnosisResult);

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4b3bb9d5-0bd3-4d19-9163-674db6e8b95b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DiagnosticoSistema.tsx:105',message:'Diagnosis completed',data:diagnosisResult,timestamp:Date.now(),sessionId:'debug-session',runId:'diagnosis',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      toast.success('Diagnóstico concluído!');
    } catch (err: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4b3bb9d5-0bd3-4d19-9163-674db6e8b95b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DiagnosticoSistema.tsx:110',message:'Diagnosis error',data:{error:err.message},timestamp:Date.now(),sessionId:'debug-session',runId:'diagnosis',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      toast.error(`Erro: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnosis();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Diagnóstico do Sistema</h1>
      </div>

      <div className="mb-6 flex gap-4">
        <Button onClick={runDiagnosis} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Analisando...' : 'Atualizar Diagnóstico'}
        </Button>
        <Button onClick={checkDuplicateTables} disabled={loading} variant="outline">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verificar Tabelas Duplicadas
        </Button>
      </div>

      {/* Table Check Results */}
      {tableCheck && (
        <Card className="mb-6 border-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-600">
              <Database className="h-5 w-5" />
              Verificação de Tabelas Duplicadas
            </CardTitle>
            <CardDescription>
              {tableCheck.recommendation}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Tabelas em Inglês (Usadas pelo Sistema)</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>products:</span>
                      <Badge variant={tableCheck.tables?.products?.exists ? 'default' : 'destructive'}>
                        {tableCheck.tables?.products?.exists ? `${tableCheck.productsInEnglish} registros` : 'Não existe'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>establishments:</span>
                      <Badge variant={tableCheck.tables?.establishments?.exists ? 'default' : 'destructive'}>
                        {tableCheck.tables?.establishments?.exists ? `${tableCheck.tables.establishments.count} registros` : 'Não existe'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>categories:</span>
                      <Badge variant={tableCheck.tables?.categories?.exists ? 'default' : 'destructive'}>
                        {tableCheck.tables?.categories?.exists ? `${tableCheck.tables.categories.count} registros` : 'Não existe'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>segments:</span>
                      <Badge variant={tableCheck.tables?.segments?.exists ? 'default' : 'destructive'}>
                        {tableCheck.tables?.segments?.exists ? `${tableCheck.tables.segments.count} registros` : 'Não existe'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Tabelas em Português (Legado)</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>produtos:</span>
                      <Badge variant={tableCheck.tables?.produtos?.exists ? 'default' : 'secondary'}>
                        {tableCheck.tables?.produtos?.exists ? `${tableCheck.productsInPortuguese} registros` : 'Não existe'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>estabelecimentos:</span>
                      <Badge variant={tableCheck.tables?.estabelecimentos?.exists ? 'default' : 'secondary'}>
                        {tableCheck.tables?.estabelecimentos?.exists ? `${tableCheck.tables.estabelecimentos.count} registros` : 'Não existe'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>categorias:</span>
                      <Badge variant={tableCheck.tables?.categorias?.exists ? 'default' : 'secondary'}>
                        {tableCheck.tables?.categorias?.exists ? `${tableCheck.tables.categorias.count} registros` : 'Não existe'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>segmentos:</span>
                      <Badge variant={tableCheck.tables?.segmentos?.exists ? 'default' : 'secondary'}>
                        {tableCheck.tables?.segmentos?.exists ? `${tableCheck.tables.segmentos.count} registros` : 'Não existe'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              {tableCheck.productsInPortuguese > 0 && tableCheck.productsInEnglish === 0 && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        Produtos encontrados apenas na tabela em português
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        Migre os produtos para a tabela "products" (inglês) para que apareçam no sistema.
                      </p>
                    </div>
                    <Button 
                      onClick={migrateProductsPtToEn} 
                      disabled={loading}
                      variant="default"
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Package className="mr-2 h-4 w-4" />
                      Migrar Produtos
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {diagnosis && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total de Estabelecimentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{diagnosis.totalEstablishments}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Com Produtos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{diagnosis.establishmentsWithProducts}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {((diagnosis.establishmentsWithProducts / diagnosis.totalEstablishments) * 100).toFixed(1)}% do total
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Sem Produtos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{diagnosis.establishmentsWithoutProducts}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {((diagnosis.establishmentsWithoutProducts / diagnosis.totalEstablishments) * 100).toFixed(1)}% do total
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{diagnosis.totalProducts}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Média: {(diagnosis.totalProducts / diagnosis.totalEstablishments).toFixed(1)} por estabelecimento
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CloudFront Images Warning */}
          {diagnosis.establishmentsWithCloudFrontImages > 0 && (
            <Card className="mb-6 border-yellow-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="h-5 w-5" />
                  Imagens do CloudFront Antigo
                </CardTitle>
                <CardDescription>
                  {diagnosis.establishmentsWithCloudFrontImages} estabelecimento(s) ainda usam URLs do CloudFront antigo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={fixCloudFrontImages} 
                  disabled={loading}
                  className="w-full"
                  variant="default"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Image className="mr-2 h-4 w-4" />
                  Corrigir URLs de Imagens
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Import Products CSV */}
          <Card className="mb-6 border-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Upload className="h-5 w-5" />
                Importar Produtos (CSV)
              </CardTitle>
              <CardDescription>
                Cole os dados CSV dos produtos para importação em massa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Cole aqui os dados CSV (com cabeçalho)..."
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
              <Button 
                onClick={importProductsFromCSV} 
                disabled={importing || !csvText.trim()}
                className="w-full"
                variant="default"
              >
                {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Package className="mr-2 h-4 w-4" />
                {importing ? 'Importando...' : 'Importar Produtos'}
              </Button>
              <div className="text-xs text-muted-foreground">
                <p>Formato esperado: CSV com cabeçalho contendo as colunas do banco de dados</p>
                <p>As imagens serão convertidas automaticamente para URLs do CloudFront</p>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento por Estabelecimento</CardTitle>
              <CardDescription>
                Lista completa de estabelecimentos com contagem de produtos e categorias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Estabelecimento</th>
                      <th className="text-center p-2">Slug</th>
                      <th className="text-center p-2">Produtos</th>
                      <th className="text-center p-2">Categorias</th>
                      <th className="text-center p-2">CloudFront Antigo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diagnosis.establishmentsStats.map((stat) => (
                      <tr key={stat.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{stat.name}</td>
                        <td className="p-2 text-center">
                          <code className="text-xs bg-muted px-2 py-1 rounded">{stat.slug}</code>
                        </td>
                        <td className="p-2 text-center">
                          {stat.productCount > 0 ? (
                            <Badge variant="default" className="bg-green-500">
                              {stat.productCount}
                            </Badge>
                          ) : (
                            <Badge variant="destructive">0</Badge>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          <Badge variant="outline">{stat.categoryCount}</Badge>
                        </td>
                        <td className="p-2 text-center">
                          {stat.hasCloudFrontImages ? (
                            <Badge variant="destructive">Sim</Badge>
                          ) : (
                            <Badge variant="secondary">Não</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

