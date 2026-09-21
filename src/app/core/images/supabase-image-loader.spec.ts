import { supabaseImageLoader } from './supabase-image-loader';

describe('supabaseImageLoader', () => {
  const publicObjectUrl =
    'https://project.supabase.co/storage/v1/object/public/admin-branding/user/logo.png';

  it('should proxy public Supabase objects without requesting image transformations', () => {
    const result = supabaseImageLoader({ src: publicObjectUrl, width: 180 });

    expect(result).toBe(
      '/api/supabase/storage/v1/object/public/admin-branding/user/logo.png',
    );
  });

  it('should convert existing Supabase render URLs back to public object URLs', () => {
    const result = supabaseImageLoader({
      src: 'https://project.supabase.co/storage/v1/render/image/public/products/item.png',
      width: 317,
    });

    expect(result).toBe('/api/supabase/storage/v1/object/public/products/item.png');
  });

  it('should leave non-Supabase images unchanged', () => {
    expect(supabaseImageLoader({ src: '/Logo3.svg', width: 180 })).toBe('/Logo3.svg');
    expect(supabaseImageLoader({
      src: 'https://images.example.com/product.png',
      width: 317,
    })).toBe('https://images.example.com/product.png');
  });
});
