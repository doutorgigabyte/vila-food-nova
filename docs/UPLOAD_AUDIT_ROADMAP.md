# Auditoria de Upload de Imagens - S3

## Objetivo
Garantir que TODAS as imagens do sistema sejam salvas no AWS S3 via CloudFront CDN.

## Status Atual: ✅ Corrigido

### Arquivos Verificados e Corrigidos

| Arquivo | Componente | Bucket | Status |
|---------|------------|--------|--------|
| `src/pages/dashboard/ProductKitsManagement.tsx` | ImageUpload para kits | products | ✅ Corrigido - establishmentId adicionado |
| `src/pages/dashboard/BannersManagement.tsx` | ImageUpload para banners | establishments | ✅ Corrigido - establishmentId adicionado |
| `src/pages/dashboard/CategoriesManagement.tsx` | ImageUpload para categorias | establishments | ✅ Corrigido - establishmentId adicionado |
| `src/pages/admin/EstablishmentsManagement.tsx` | ImageUpload para logo/banner | establishments | ✅ Corrigido - establishmentId adicionado |
| `src/pages/dashboard/EstablishmentSettings.tsx` | ImageUpload para logo/banner | establishments | ✅ Já estava correto |
| `src/components/products/ProductFormIntelligent.tsx` | ImageUpload para produtos | products | ✅ Já estava correto |
| `src/pages/dashboard/VideosManagement.tsx` | uploadToS3 direto | videos | ✅ Já estava correto |

### Casos Especiais (Sem establishmentId disponível)

| Arquivo | Contexto | Solução |
|---------|----------|---------|
| `src/components/onboarding/steps/BasicDataStep.tsx` | Onboarding - estabelecimento ainda não criado | Edge function permite super_admin/system uploads |
| `src/components/onboarding/steps/FirstProductStep.tsx` | Onboarding - produto antes do estabelecimento | Edge function permite super_admin/system uploads |
| `src/components/reviews/ReviewForm.tsx` | Reviews de clientes | Upload vai para pasta 'system' |
| `src/pages/admin/VilasManagement.tsx` | Admin gerenciando vilas | Super admin pode fazer upload sem establishmentId |

## Arquitetura de Upload

```
┌─────────────────────┐
│   ImageUpload       │
│   Component         │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   src/lib/s3.ts     │
│   uploadToS3()      │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Edge Function      │
│  s3-upload          │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   AWS S3            │
│   _uploads/{type}/  │
│   {estId}/{y}/{m}/  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   CloudFront CDN    │
│   d2fhl3f70zfvod    │
└─────────────────────┘
```

## Validações de Segurança

1. **Autenticação**: Usuário deve estar logado
2. **Autorização**: 
   - Dono do estabelecimento pode fazer upload
   - Super admin pode fazer upload em qualquer estabelecimento
   - Super admin pode fazer upload sem establishmentId (vai para pasta 'system')
3. **Validação de Arquivo**:
   - Imagens: max 5MB (avatars: 2MB)
   - Vídeos: max 100MB
   - Tipos permitidos: JPEG, PNG, WebP, GIF, MP4, WebM, MOV

## Estrutura de Pastas no S3

```
_uploads/
├── products/
│   └── {establishment_id}/
│       └── {year}/{month}/{filename}
├── establishments/
│   └── {establishment_id}/
│       └── {year}/{month}/{filename}
├── categories/
│   └── {establishment_id}/
│       └── {year}/{month}/{filename}
├── banners/
│   └── {establishment_id}/
│       └── {year}/{month}/{filename}
├── avatars/
│   └── {establishment_id}/
│       └── {year}/{month}/{filename}
├── videos/
│   └── {establishment_id}/
│       └── {year}/{month}/{filename}
└── system/
    └── {year}/{month}/{filename}  (uploads sem establishment)
```

## Checklist de Verificação

- [x] ProductKitsManagement - establishmentId passado
- [x] BannersManagement - establishmentId passado
- [x] CategoriesManagement - establishmentId passado
- [x] EstablishmentsManagement (admin) - establishmentId passado
- [x] EstablishmentSettings - establishmentId passado
- [x] ProductFormIntelligent - establishmentId passado
- [x] VideosManagement - establishmentId passado via uploadToS3
- [x] BasicDataStep (onboarding) - handled by super_admin/system logic
- [x] FirstProductStep (onboarding) - handled by super_admin/system logic
- [x] ReviewForm - handled by system folder
- [x] VilasManagement (admin) - super_admin can upload

## Data da Auditoria
- **Data**: 2025-12-10
- **Status**: ✅ Completo
