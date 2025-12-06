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

/**
 * Upload image to AWS S3 via Edge Function
 */
export async function uploadToS3(
  file: File,
  type: UploadType = 'products',
  establishmentId?: string
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  formData.append('establishmentId', establishmentId || 'general');

  const { data, error } = await supabase.functions.invoke('s3-upload', {
    body: formData,
  });

  if (error) {
    console.error('S3 upload error:', error);
    throw new Error(error.message || 'Erro ao fazer upload');
  }

  return data as UploadResult;
}

/**
 * Delete image from AWS S3 via Edge Function
 */
export async function deleteFromS3(
  url: string,
  establishmentId?: string
): Promise<DeleteResult> {
  const { data, error } = await supabase.functions.invoke('s3-delete', {
    body: { url, establishmentId },
  });

  if (error) {
    console.error('S3 delete error:', error);
    throw new Error(error.message || 'Erro ao excluir arquivo');
  }

  return data as DeleteResult;
}

/**
 * Upload video to AWS S3 via Edge Function
 */
export async function uploadVideoToS3(
  file: File,
  establishmentId?: string
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', 'videos');
  formData.append('establishmentId', establishmentId || 'general');

  const { data, error } = await supabase.functions.invoke('s3-upload', {
    body: formData,
  });

  if (error) {
    console.error('S3 video upload error:', error);
    throw new Error(error.message || 'Erro ao fazer upload do vídeo');
  }

  return data as UploadResult;
}

/**
 * Get optimized image URL from CloudFront/S3
 */
export function getImageUrl(path: string | null | undefined): string {
  if (!path) return '/placeholder.svg';
  
  // Already a full URL
  if (path.startsWith('http')) {
    return path;
  }
  
  // Return path as-is (likely already a CDN URL)
  return path;
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
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
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
    maxSize?: number;
    maxDuration?: number; // in seconds
  } = {}
): { valid: boolean; error?: string } {
  const {
    maxSize = 50 * 1024 * 1024, // 50MB default for videos
  } = options;

  const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

  if (!allowedTypes.includes(file.type)) {
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
