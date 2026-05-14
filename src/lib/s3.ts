import { supabase } from "@/integrations/supabase/client";

export type UploadType = 'products' | 'establishments' | 'categories' | 'banners' | 'avatars' | 'videos';

interface UploadResult {
  url: string;
  key: string;
  bucket: string;
}

interface DeleteResult {
  success: boolean;
  deletedKey: string;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

// Legacy CDN do tempo AWS+CloudFront, mantido pra deletar URLs antigas que
// ainda existem no banco. Hoje a infra usa Supabase Storage self-hosted.
const LEGACY_CDN_HOSTS = ['cloudfront.net', 's3.amazonaws.com'];

function generateFileName(originalName: string): string {
  const extension = originalName.split('.').pop()?.toLowerCase() || 'bin';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}_${random}.${extension}`;
}

async function buildOnboardingFolder(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id ?? 'anonymous';
  return `onboarding/${userId}`;
}

/**
 * Upload de imagem/video para Supabase Storage.
 * Bucket = type. Path = {establishmentId|system|onboarding/uid}/{year}/{month}/{filename}.
 */
export async function uploadToS3(
  file: File,
  type: UploadType = 'products',
  establishmentId?: string
): Promise<UploadResult> {
  const fileName = generateFileName(file.name);

  let folder: string;
  if (!establishmentId || establishmentId === 'general') {
    folder = 'system';
  } else if (establishmentId === 'onboarding') {
    folder = await buildOnboardingFolder();
  } else {
    folder = establishmentId;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const path = `${folder}/${year}/${month}/${fileName}`;

  const { error } = await supabase.storage.from(type).upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
    contentType: file.type,
  });

  if (error) {
    console.error('Storage upload error:', error);
    throw new Error(error.message || 'Erro ao fazer upload');
  }

  const { data } = supabase.storage.from(type).getPublicUrl(path);

  return {
    url: data.publicUrl,
    key: path,
    bucket: type,
  };
}

/**
 * Upload de video. Wrapper de uploadToS3 com bucket fixo em 'videos'.
 */
export async function uploadVideoToS3(
  file: File,
  establishmentId?: string
): Promise<UploadResult> {
  return uploadToS3(file, 'videos', establishmentId);
}

/**
 * Parse de URL publica do Supabase Storage. Extrai bucket e path.
 * Formato esperado: https://<host>/storage/v1/object/public/<bucket>/<path>
 */
function parseStorageUrl(url: string): { bucket: string; path: string } | null {
  try {
    const u = new URL(url);
    const marker = '/storage/v1/object/public/';
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    const rest = u.pathname.slice(idx + marker.length);
    const slash = rest.indexOf('/');
    if (slash === -1) return null;
    return {
      bucket: rest.slice(0, slash),
      path: decodeURIComponent(rest.slice(slash + 1)),
    };
  } catch {
    return null;
  }
}

/**
 * Delete de objeto a partir da URL publica.
 * Legacy URLs (CloudFront/S3 AWS) sao ignoradas — o bucket nao existe mais.
 */
export async function deleteFromS3(
  url: string,
  _establishmentId?: string
): Promise<DeleteResult> {
  const parsed = parseStorageUrl(url);

  if (!parsed) {
    return { success: true, deletedKey: '' };
  }

  const { error } = await supabase.storage.from(parsed.bucket).remove([parsed.path]);

  if (error) {
    console.error('Storage delete error:', error);
    throw new Error(error.message || 'Erro ao excluir arquivo');
  }

  return { success: true, deletedKey: parsed.path };
}

/**
 * URL final pra exibir. Aceita URL completa ou caminho relativo.
 */
export function getImageUrl(path: string | null | undefined): string {
  if (!path) return '/placeholder.svg';
  if (path.startsWith('http')) return path;
  return path;
}

/**
 * Checa se a URL aponta pra um storage gerenciado pelo proprio Vila Food
 * (Supabase Storage ativo OU legacy CloudFront/S3 ainda referenciado no DB).
 * Usado pelos componentes de upload pra decidir se rodam o delete do antigo
 * antes de salvar o novo.
 */
export function isManagedStorageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (LEGACY_CDN_HOSTS.some(host => url.includes(host))) return true;
  return parseStorageUrl(url) !== null;
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ALLOWED_IMAGE_TYPES,
  } = options;

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Formato inválido. Use: ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}`,
    };
  }

  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `Arquivo muito grande. Máximo: ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Validate video file before upload
 */
export function validateVideoFile(
  file: File,
  options: {
    maxSize?: number; // default 100MB
    maxDuration?: number; // in seconds
  } = {}
): { valid: boolean; error?: string } {
  const {
    maxSize = 100 * 1024 * 1024, // 100MB default for videos
  } = options;

  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Formato de vídeo inválido. Use: MP4, WebM ou MOV`,
    };
  }

  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `Vídeo muito grande. Máximo: ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}
