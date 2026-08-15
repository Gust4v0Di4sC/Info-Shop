import { ImageLoaderConfig } from '@angular/common';

const SUPABASE_STORAGE_OBJECT_PATH = '/storage/v1/object/public/';
const SUPABASE_STORAGE_RENDER_PATH = '/storage/v1/render/image/public/';
const DEFAULT_IMAGE_QUALITY = 75;

export function supabaseImageLoader(config: ImageLoaderConfig): string {
  const src = config.src;
  const storagePath = supabaseStoragePath(src);

  if (!storagePath) {
    return src;
  }

  const params = new URLSearchParams({
    quality: String(config.loaderParams?.['quality'] ?? DEFAULT_IMAGE_QUALITY),
    format: 'webp',
  });

  if (config.width) {
    params.set('width', String(config.width));
  }

  return `/api/supabase${SUPABASE_STORAGE_RENDER_PATH}${storagePath}?${params.toString()}`;
}

function supabaseStoragePath(src: string): string | null {
  try {
    const url = new URL(src);

    if (!url.hostname.endsWith('.supabase.co')) {
      return null;
    }

    if (url.pathname.startsWith(SUPABASE_STORAGE_OBJECT_PATH)) {
      return url.pathname.slice(SUPABASE_STORAGE_OBJECT_PATH.length);
    }

    if (url.pathname.startsWith(SUPABASE_STORAGE_RENDER_PATH)) {
      return url.pathname.slice(SUPABASE_STORAGE_RENDER_PATH.length);
    }

    return null;
  } catch {
    return null;
  }
}
