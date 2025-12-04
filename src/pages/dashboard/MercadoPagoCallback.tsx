import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react";

export default function MercadoPagoCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processando autorização...');

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state'); // establishment_id
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage('Autorização negada pelo usuário');
        setTimeout(() => navigate('/dashboard/mercadopago'), 3000);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Parâmetros de callback inválidos');
        setTimeout(() => navigate('/dashboard/mercadopago'), 3000);
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke('mercadopago-oauth', {
          body: {
            action: 'exchange_code',
            code,
            establishment_id: state,
            redirect_uri: `${window.location.origin}/dashboard/mercadopago/callback`
          }
        });

        if (fnError) throw fnError;

        if (data?.success) {
          setStatus('success');
          setMessage('Conta conectada com sucesso!');
          toast.success('Mercado Pago conectado com sucesso!');
        } else {
          throw new Error(data?.error || 'Erro ao processar autorização');
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setMessage('Erro ao conectar conta. Tente novamente.');
        toast.error('Erro ao conectar Mercado Pago');
      }

      setTimeout(() => navigate('/dashboard/mercadopago'), 2000);
    };

    processCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            {status === 'processing' && (
              <RefreshCw className="h-16 w-16 text-primary animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            )}
            {status === 'error' && (
              <XCircle className="h-16 w-16 text-destructive" />
            )}
            
            <h2 className="text-xl font-semibold text-foreground">{message}</h2>
            <p className="text-muted-foreground">
              {status === 'processing' 
                ? 'Aguarde enquanto validamos sua autorização...'
                : 'Você será redirecionado em instantes...'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
