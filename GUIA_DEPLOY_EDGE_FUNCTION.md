# Guia de Deploy da Edge Function migrate-legacy-data

## Opção 1: Deploy Manual pelo Dashboard do Supabase (Recomendado)

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione o projeto: `gyagfsjbdaacgmmofqip`
3. Vá em **Edge Functions** no menu lateral
4. Clique em **migrate-legacy-data**
5. Clique em **Edit Function** ou **Deploy**
6. Cole o conteúdo do arquivo `supabase/functions/migrate-legacy-data/index.ts`
7. Clique em **Deploy** ou **Save**

## Opção 2: Instalar Supabase CLI (Para Deploy Automático)

### Windows (PowerShell)

```powershell
# Instalar via Scoop (se tiver)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# OU instalar via npm
npm install -g supabase
```

### Verificar instalação

```powershell
supabase --version
```

### Fazer login

```powershell
supabase login
```

### Linkar ao projeto

```powershell
supabase link --project-ref gyagfsjbdaacgmmofqip
```

### Deploy da função

```powershell
supabase functions deploy migrate-legacy-data
```

## Opção 3: Deploy via Git (Se Lovable faz deploy automático)

Se o Lovable faz deploy automático das Edge Functions:

1. Faça commit das mudanças:
```powershell
git add supabase/functions/migrate-legacy-data/index.ts
git commit -m "Atualizar função migrate-legacy-data com novas ações"
git push
```

2. Aguarde o deploy automático (pode levar alguns minutos)

## Verificar se o Deploy Funcionou

Após o deploy, teste a função:

1. Acesse `/admin/diagnostico`
2. Clique em "Verificar Tabelas Duplicadas"
3. Se funcionar, você verá os resultados
4. Se ainda der erro 400, verifique os logs no dashboard do Supabase:
   - Edge Functions → migrate-legacy-data → Logs

## Logs da Função

Para ver os logs detalhados:

1. Dashboard do Supabase
2. Edge Functions → migrate-legacy-data
3. Aba "Logs"
4. Você verá os console.log que adicionamos:
   - Request method
   - Request body
   - Action received
   - Qualquer erro com detalhes



