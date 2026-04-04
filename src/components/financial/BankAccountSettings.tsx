/**
 * BankAccountSettings - Gestão de contas bancárias para recebimento
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Building2, CreditCard, QrCode, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BankAccountSettingsProps {
  establishmentId: string;
}

interface BankData {
  pix_key: string | null;
  pix_key_type: string | null;
  bank_name: string | null;
  bank_code: string | null;
  bank_agency: string | null;
  bank_agency_digit: string | null;
  bank_account: string | null;
  bank_account_digit: string | null;
  bank_account_type: string | null;
  bank_holder_name: string | null;
  bank_holder_cpf_cnpj: string | null;
}

const BANKS = [
  { code: '001', name: 'Banco do Brasil' },
  { code: '033', name: 'Santander' },
  { code: '104', name: 'Caixa Econômica' },
  { code: '237', name: 'Bradesco' },
  { code: '341', name: 'Itaú' },
  { code: '422', name: 'Banco Safra' },
  { code: '077', name: 'Banco Inter' },
  { code: '260', name: 'Nubank' },
  { code: '336', name: 'C6 Bank' },
  { code: '212', name: 'Banco Original' },
  { code: '748', name: 'Sicredi' },
  { code: '756', name: 'Sicoob' },
  { code: '290', name: 'PagBank' },
  { code: '380', name: 'PicPay' },
  { code: '323', name: 'Mercado Pago' },
];

const PIX_KEY_TYPES = [
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'random', label: 'Chave aleatória' },
];

export function BankAccountSettings({ establishmentId }: BankAccountSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<BankData>({
    pix_key: null,
    pix_key_type: null,
    bank_name: null,
    bank_code: null,
    bank_agency: null,
    bank_agency_digit: null,
    bank_account: null,
    bank_account_digit: null,
    bank_account_type: 'checking',
    bank_holder_name: null,
    bank_holder_cpf_cnpj: null,
  });

  useEffect(() => {
    fetchBankData();
  }, [establishmentId]);

  const fetchBankData = async () => {
    try {
      const { data: estData, error } = await supabase
        .from('establishments')
        .select('pix_key, pix_key_type, bank_name, bank_code, bank_agency, bank_agency_digit, bank_account, bank_account_digit, bank_account_type, bank_holder_name, bank_holder_cpf_cnpj')
        .eq('id', establishmentId)
        .single();

      if (error) throw error;
      
      // Type assertion since types.ts may not be updated yet
      const bankData = estData as unknown as BankData;
      
      setData({
        pix_key: bankData.pix_key || null,
        pix_key_type: bankData.pix_key_type || null,
        bank_name: bankData.bank_name || null,
        bank_code: bankData.bank_code || null,
        bank_agency: bankData.bank_agency || null,
        bank_agency_digit: bankData.bank_agency_digit || null,
        bank_account: bankData.bank_account || null,
        bank_account_digit: bankData.bank_account_digit || null,
        bank_account_type: bankData.bank_account_type || 'checking',
        bank_holder_name: bankData.bank_holder_name || null,
        bank_holder_cpf_cnpj: bankData.bank_holder_cpf_cnpj || null,
      });
    } catch (error) {
      console.error('Error fetching bank data:', error);
      toast.error('Erro ao carregar dados bancários');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('establishments')
        .update({
          pix_key: data.pix_key,
          pix_key_type: data.pix_key_type,
          bank_name: data.bank_name,
          bank_code: data.bank_code,
          bank_agency: data.bank_agency,
          bank_agency_digit: data.bank_agency_digit,
          bank_account: data.bank_account,
          bank_account_digit: data.bank_account_digit,
          bank_account_type: data.bank_account_type,
          bank_holder_name: data.bank_holder_name,
          bank_holder_cpf_cnpj: data.bank_holder_cpf_cnpj,
        })
        .eq('id', establishmentId);

      if (error) throw error;
      toast.success('Dados bancários salvos com sucesso');
    } catch (error) {
      console.error('Error saving bank data:', error);
      toast.error('Erro ao salvar dados bancários');
    } finally {
      setSaving(false);
    }
  };

  const handleBankSelect = (code: string) => {
    const bank = BANKS.find(b => b.code === code);
    setData(prev => ({
      ...prev,
      bank_code: code,
      bank_name: bank?.name || null,
    }));
  };

  const isPixConfigured = data.pix_key && data.pix_key_type;
  const isBankConfigured = data.bank_code && data.bank_agency && data.bank_account;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={isPixConfigured ? 'border-green-500/50' : 'border-yellow-500/50'}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-3 rounded-full ${isPixConfigured ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
              <QrCode className={`h-6 w-6 ${isPixConfigured ? 'text-green-600' : 'text-yellow-600'}`} />
            </div>
            <div className="flex-1">
              <p className="font-medium">Chave PIX</p>
              <p className="text-sm text-muted-foreground">
                {isPixConfigured ? 'Configurada' : 'Não configurada'}
              </p>
            </div>
            {isPixConfigured ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            )}
          </CardContent>
        </Card>

        <Card className={isBankConfigured ? 'border-green-500/50' : 'border-muted'}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-3 rounded-full ${isBankConfigured ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}>
              <Building2 className={`h-6 w-6 ${isBankConfigured ? 'text-green-600' : 'text-muted-foreground'}`} />
            </div>
            <div className="flex-1">
              <p className="font-medium">Conta Bancária</p>
              <p className="text-sm text-muted-foreground">
                {isBankConfigured ? `${data.bank_name}` : 'Não configurada'}
              </p>
            </div>
            {isBankConfigured ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <Badge variant="outline">Opcional</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PIX Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            <CardTitle>Chave PIX para Recebimento</CardTitle>
          </div>
          <CardDescription>
            Configure sua chave PIX para receber pagamentos dos clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo da Chave</Label>
              <Select
                value={data.pix_key_type || ''}
                onValueChange={(value) => setData(prev => ({ ...prev, pix_key_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {PIX_KEY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Chave PIX</Label>
              <Input
                placeholder="Insira sua chave PIX"
                value={data.pix_key || ''}
                onChange={(e) => setData(prev => ({ ...prev, pix_key: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Account Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>Conta Bancária</CardTitle>
          </div>
          <CardDescription>
            Dados bancários para TED/DOC (usado para estornos e transferências)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Banco</Label>
              <Select
                value={data.bank_code || ''}
                onValueChange={handleBankSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o banco" />
                </SelectTrigger>
                <SelectContent>
                  {BANKS.map((bank) => (
                    <SelectItem key={bank.code} value={bank.code}>
                      {bank.code} - {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Conta</Label>
              <Select
                value={data.bank_account_type || 'checking'}
                onValueChange={(value) => setData(prev => ({ ...prev, bank_account_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Conta Corrente</SelectItem>
                  <SelectItem value="savings">Conta Poupança</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Agência</Label>
              <Input
                placeholder="0000"
                value={data.bank_agency || ''}
                onChange={(e) => setData(prev => ({ ...prev, bank_agency: e.target.value.replace(/\D/g, '') }))}
                maxLength={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Dígito Ag.</Label>
              <Input
                placeholder="0"
                value={data.bank_agency_digit || ''}
                onChange={(e) => setData(prev => ({ ...prev, bank_agency_digit: e.target.value }))}
                maxLength={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Conta</Label>
              <Input
                placeholder="00000000"
                value={data.bank_account || ''}
                onChange={(e) => setData(prev => ({ ...prev, bank_account: e.target.value.replace(/\D/g, '') }))}
                maxLength={12}
              />
            </div>

            <div className="space-y-2">
              <Label>Dígito Conta</Label>
              <Input
                placeholder="0"
                value={data.bank_account_digit || ''}
                onChange={(e) => setData(prev => ({ ...prev, bank_account_digit: e.target.value }))}
                maxLength={2}
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Titular</Label>
              <Input
                placeholder="Nome completo ou razão social"
                value={data.bank_holder_name || ''}
                onChange={(e) => setData(prev => ({ ...prev, bank_holder_name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>CPF/CNPJ do Titular</Label>
              <Input
                placeholder="000.000.000-00"
                value={data.bank_holder_cpf_cnpj || ''}
                onChange={(e) => setData(prev => ({ ...prev, bank_holder_cpf_cnpj: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Dados Bancários'}
        </Button>
      </div>
    </div>
  );
}
