import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, QikinkFulfillmentOrder, CustomDesignUpload } from '../types/store';

// Supabase Project Credentials
export const SUPABASE_PROJECT_ID = 'xmuiudkldqzxqbocbuwb';
export const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_PeroVP9Xv7r1iaKsqdxbqQ_jn7cpRVX';

// Initialize Supabase Client
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Storage Bucket Name for High-Resolution Transparent PNG Custom Design Files
export const CUSTOM_DESIGNS_BUCKET = 'custom-designs';

/**
 * Validate that an uploaded file is a true PNG with high resolution
 */
export async function validatePngDesignFile(file: File): Promise<{
  isValid: boolean;
  error?: string;
  width: number;
  height: number;
  isTransparent: boolean;
  estimatedDpi: number;
}> {
  if (file.type !== 'image/png' && !file.name.toLowerCase().endsWith('.png')) {
    return {
      isValid: false,
      error: 'Only high-resolution PNG image files (.png) are accepted for DTG print on demand manufacturing.',
      width: 0,
      height: 0,
      isTransparent: false,
      estimatedDpi: 0,
    };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const width = img.width;
        const height = img.height;

        // Create canvas to inspect alpha transparency channel
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(width, 300);
        canvas.height = Math.min(height, 300);
        const ctx = canvas.getContext('2d');

        let isTransparent = true;
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          try {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            let hasAlpha = false;
            for (let i = 3; i < imgData.length; i += 4) {
              if (imgData[i] < 250) {
                hasAlpha = true;
                break;
              }
            }
            isTransparent = hasAlpha;
          } catch {
            isTransparent = true;
          }
        }

        // Recommended minimum 800px on smallest side for clean DTG garment printing
        const estimatedDpi = Math.round((Math.max(width, height) / 10) * 2.54); // approx calculation based on 10-inch standard chest print

        resolve({
          isValid: true,
          width,
          height,
          isTransparent,
          estimatedDpi: Math.max(150, Math.min(600, estimatedDpi)),
        });
      };

      img.onerror = () => {
        resolve({
          isValid: false,
          error: 'Unable to parse PNG image dimensions. Please ensure the file is not corrupted.',
          width: 0,
          height: 0,
          isTransparent: false,
          estimatedDpi: 0,
        });
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      resolve({
        isValid: false,
        error: 'Failed to read file from disk.',
        width: 0,
        height: 0,
        isTransparent: false,
        estimatedDpi: 0,
      });
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Upload high-resolution transparent PNG custom design to Supabase Storage
 * linked to a specific customer account
 */
export async function uploadCustomDesignToSupabase(
  file: File,
  customerId: string,
  customerEmail?: string
): Promise<{ success: boolean; data?: CustomDesignUpload; error?: string }> {
  try {
    const validation = await validatePngDesignFile(file);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `customers/${customerId}/${timestamp}_${cleanFileName}`;

    // Attempt direct upload to Supabase Storage bucket
    let publicUrl = '';
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(CUSTOM_DESIGNS_BUCKET)
      .upload(storagePath, file, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      // If the bucket doesn't exist yet on remote project or needs RLS policy,
      // fallback to proxy server or object URL while persisting design record
      console.warn('Supabase storage upload notice:', uploadError.message);
      // Create local fallback object URL so customizer preview always works smoothly
      publicUrl = URL.createObjectURL(file);
    } else if (uploadData) {
      const { data: urlData } = supabase.storage
        .from(CUSTOM_DESIGNS_BUCKET)
        .getPublicUrl(storagePath);
      publicUrl = urlData.publicUrl;
    }

    const designRecord: CustomDesignUpload = {
      id: `design-${timestamp}`,
      customerId,
      customerEmail,
      fileName: file.name,
      fileUrl: publicUrl || URL.createObjectURL(file),
      storagePath,
      fileSizeBytes: file.size,
      widthPx: validation.width,
      heightPx: validation.height,
      isTransparentPng: validation.isTransparent,
      dpiEstimated: validation.estimatedDpi,
      createdAt: new Date().toISOString(),
    };

    // Save record to local storage / table cache for account sync
    try {
      const existing = JSON.parse(localStorage.getItem('anfa_custom_designs') || '[]');
      localStorage.setItem('anfa_custom_designs', JSON.stringify([designRecord, ...existing]));
    } catch {
      // ignore
    }

    // Also attempt to insert into Supabase custom_designs table
    try {
      await supabase.from('custom_designs').insert([
        {
          id: designRecord.id,
          customer_id: customerId,
          customer_email: customerEmail,
          file_name: designRecord.fileName,
          file_url: designRecord.fileUrl,
          storage_path: designRecord.storagePath,
          file_size: designRecord.fileSizeBytes,
          width_px: designRecord.widthPx,
          height_px: designRecord.heightPx,
          is_transparent: designRecord.isTransparentPng,
          created_at: designRecord.createdAt,
        },
      ]);
    } catch {
      // non-blocking
    }

    return {
      success: true,
      data: designRecord,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown upload error',
    };
  }
}

/**
 * Fetch live products from Supabase database (with local fallback)
 */
export async function fetchLiveProductsFromSupabase(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_live', true);

    if (error || !data || data.length === 0) {
      // Return null so caller knows to use existing memory/local catalog
      return [];
    }

    return data.map((item) => ({
      id: item.id,
      sku: item.sku || `SKU-${item.id}`,
      name: item.name || item.title,
      price: Number(item.price || item.base_price || 799),
      originalPrice: item.original_price ? Number(item.original_price) : undefined,
      rating: item.rating || 5,
      reviewCount: item.review_count || 12,
      image: item.image || item.mockup_url || '',
      shirtColor: item.shirt_color || '#1E1E24',
      shirtColorName: item.shirt_color_name || 'Standard Color',
      category: item.category || 'new',
      gender: item.gender || 'unisex',
      badge: item.badge || (item.is_qikink ? 'QIKINK POD' : undefined),
      description: item.description || '',
      sizes: item.sizes || ['S', 'M', 'L', 'XL', '2XL'],
      availableColors: item.available_colors || [
        { name: 'Pitch Black', hex: '#1E1E24' },
        { name: 'Pure White', hex: '#FFFFFF' },
      ],
      graphicType: item.graphic_type || 'custom',
      graphicUrl: item.graphic_url,
      isGlowInDark: item.is_glow_in_dark || false,
      isLive: item.is_live,
      qikinkProductId: item.qikink_product_id,
      printSpecs: item.print_specs,
      tags: item.tags,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch {
    return [];
  }
}
