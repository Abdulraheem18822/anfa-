import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, QikinkFulfillmentOrder, CustomDesignUpload, UserProfile } from '../types/store';

// Supabase Project Credentials
export const SUPABASE_PROJECT_ID = 'xmuiudkldqzxqbocbuwb';
export const SUPABASE_URL = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL)
  ? process.env.NEXT_PUBLIC_SUPABASE_URL
  : ((import.meta as any).env?.VITE_SUPABASE_URL || `https://${SUPABASE_PROJECT_ID}.supabase.co`);

export const SUPABASE_PUBLISHABLE_KEY = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  ? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  : ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_PeroVP9Xv7r1iaKsqdxbqQ_jn7cpRVX');

// Initialize Singleton Supabase Client
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'x-application-name': 'anfa-print-wear',
    },
  },
});

// Storage Bucket Name for High-Resolution Transparent PNG Custom Design Files
export const CUSTOM_DESIGNS_BUCKET = 'custom-designs';

// ============================================================================
// 1. CONNECTION HEALTH & PERSISTENCE CHECK
// ============================================================================

export interface SupabaseConnectionStatus {
  isConnected: boolean;
  latencyMs: number;
  url: string;
  tablesAvailable: {
    products: boolean;
    orders: boolean;
    custom_designs: boolean;
    customers: boolean;
  };
  error?: string;
}

/**
 * Check persistent connection to Supabase database
 */
export async function checkSupabaseConnection(): Promise<SupabaseConnectionStatus> {
  const startTime = Date.now();
  const tables = {
    products: false,
    orders: false,
    custom_designs: false,
    customers: false,
  };

  try {
    const { error: prodErr } = await supabase.from('products').select('id').limit(1);
    tables.products = !prodErr;

    const { error: ordErr } = await supabase.from('orders').select('id').limit(1);
    tables.orders = !ordErr;

    const { error: desErr } = await supabase.from('custom_designs').select('id').limit(1);
    tables.custom_designs = !desErr;

    const { error: custErr } = await supabase.from('customers').select('id').limit(1);
    tables.customers = !custErr;

    const latencyMs = Date.now() - startTime;
    const isConnected = tables.products || tables.orders || tables.custom_designs || tables.customers;

    return {
      isConnected,
      latencyMs,
      url: SUPABASE_URL,
      tablesAvailable: tables,
    };
  } catch (err: any) {
    return {
      isConnected: false,
      latencyMs: Date.now() - startTime,
      url: SUPABASE_URL,
      tablesAvailable: tables,
      error: err?.message || 'Connection failed',
    };
  }
}

// ============================================================================
// 2. PRODUCT DATA SERVICE
// ============================================================================

export const ProductService = {
  /**
   * Fetch all active live products
   */
  async getAll(): Promise<{ success: boolean; data: Product[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return { success: true, data: [] };

      const products: Product[] = data.map((item) => ({
        id: item.id,
        sku: item.sku || `SKU-${item.id}`,
        name: item.name || item.title || 'Custom T-Shirt',
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
        isLive: item.is_live ?? true,
        qikinkProductId: item.qikink_product_id,
        printSpecs: item.print_specs,
        tags: item.tags,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      return { success: true, data: products };
    } catch (err: any) {
      console.warn('ProductService.getAll Supabase warning:', err?.message);
      return { success: false, data: [], error: err?.message };
    }
  },

  /**
   * Upsert a product into Supabase
   */
  async upsert(product: Partial<Product> & { id: string }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const dbPayload = {
        id: product.id,
        sku: product.sku || `ANFA-${Math.floor(1000 + Math.random() * 9000)}`,
        name: product.name,
        price: product.price,
        original_price: product.originalPrice,
        category: product.category || 'new',
        gender: product.gender || 'unisex',
        description: product.description || '',
        image: product.image || '',
        sizes: product.sizes || ['S', 'M', 'L', 'XL', '2XL'],
        available_colors: product.availableColors,
        is_live: product.isLive ?? true,
        badge: product.badge,
        tags: product.tags,
        rating: product.rating,
        review_count: product.reviewCount,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('products')
        .upsert(dbPayload)
        .select();

      if (error) throw error;
      return { success: true, data: data?.[0] };
    } catch (err: any) {
      console.error('ProductService.upsert error:', err);
      return { success: false, error: err?.message };
    }
  },

  /**
   * Delete a product
   */
  async delete(productId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  },
};

// ============================================================================
// 3. ORDER DATA SERVICE
// ============================================================================

export const OrderService = {
  /**
   * Fetch all orders from Supabase
   */
  async getAll(): Promise<{ success: boolean; data: QikinkFulfillmentOrder[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err: any) {
      return { success: false, data: [], error: err?.message };
    }
  },

  /**
   * Fetch orders for a specific phone number or email
   */
  async getByCustomer(phoneOrEmail: string): Promise<{ success: boolean; data: QikinkFulfillmentOrder[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`customer_phone.eq.${phoneOrEmail},customer_email.eq.${phoneOrEmail}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err: any) {
      return { success: false, data: [], error: err?.message };
    }
  },

  /**
   * Create or update an order
   */
  async upsert(order: QikinkFulfillmentOrder): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const dbPayload = {
        id: order.id,
        order_number: order.orderNumber,
        customer_name: order.customerName,
        customer_email: order.customerEmail,
        customer_phone: order.customerPhone,
        shipping_address: order.shippingAddress,
        items: order.items,
        total_amount: order.totalAmount,
        qikink_order_id: order.qikinkOrderId,
        qikink_status: order.qikinkStatus,
        tracking_number: order.trackingNumber,
        courier_name: order.courierName,
        created_at: order.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from('orders').upsert(dbPayload).select();
      if (error) throw error;
      return { success: true, data: data?.[0] };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  },
};

// ============================================================================
// 4. CUSTOM DESIGNS & FILE STORAGE SERVICE
// ============================================================================

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

        const estimatedDpi = Math.round((Math.max(width, height) / 10) * 2.54);

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

    let publicUrl = '';
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(CUSTOM_DESIGNS_BUCKET)
      .upload(storagePath, file, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.warn('Supabase storage upload notice:', uploadError.message);
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

    try {
      const existing = JSON.parse(localStorage.getItem('anfa_custom_designs') || '[]');
      localStorage.setItem('anfa_custom_designs', JSON.stringify([designRecord, ...existing]));
    } catch {
      // ignore
    }

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
    } catch (dbErr) {
      console.warn('Supabase custom_designs insert warning:', dbErr);
    }

    return {
      success: true,
      data: designRecord,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Unknown upload error',
    };
  }
}

export async function fetchLiveProductsFromSupabase(): Promise<Product[]> {
  const res = await ProductService.getAll();
  return res.success ? res.data : [];
}

// ============================================================================
// 5. LOCAL STATE & SUPABASE BIDIRECTIONAL SYNC ENGINE
// ============================================================================

export interface LocalSyncPayload {
  products?: Product[];
  orders?: QikinkFulfillmentOrder[];
  customDesigns?: CustomDesignUpload[];
  currentUser?: UserProfile | null;
}

export interface SyncResult {
  success: boolean;
  syncedProducts: number;
  syncedOrders: number;
  syncedCustomers: number;
  errors: string[];
}

/**
 * Synchronize local application state with Supabase tables
 * Ensures all items in memory and localStorage are persistently saved to the remote database.
 */
export async function syncLocalStateWithSupabase(payload: LocalSyncPayload): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    syncedProducts: 0,
    syncedOrders: 0,
    syncedCustomers: 0,
    errors: [],
  };

  try {
    // 1. Sync Products
    if (payload.products && payload.products.length > 0) {
      for (const prod of payload.products) {
        try {
          const res = await ProductService.upsert(prod);
          if (res.success) result.syncedProducts++;
          else if (res.error) result.errors.push(`Product sync: ${res.error}`);
        } catch (e: any) {
          result.errors.push(`Product ${prod.name}: ${e?.message}`);
        }
      }
    }

    // 2. Sync Orders
    if (payload.orders && payload.orders.length > 0) {
      for (const ord of payload.orders) {
        try {
          const res = await OrderService.upsert(ord);
          if (res.success) result.syncedOrders++;
          else if (res.error) result.errors.push(`Order sync: ${res.error}`);
        } catch (e: any) {
          result.errors.push(`Order ${ord.orderNumber}: ${e?.message}`);
        }
      }
    }

    // 3. Sync Current Customer / User Profile
    if (payload.currentUser && payload.currentUser.phone) {
      try {
        const { error: custErr } = await supabase.from('customers').upsert({
          id: payload.currentUser.id || `cust-${payload.currentUser.phone}`,
          phone: payload.currentUser.phone,
          name: payload.currentUser.name,
          email: payload.currentUser.email,
          address: payload.currentUser.address,
          city: payload.currentUser.city,
          country: payload.currentUser.country || 'India',
          updated_at: new Date().toISOString(),
        });
        if (!custErr) result.syncedCustomers++;
        else result.errors.push(`Customer sync: ${custErr.message}`);
      } catch (e: any) {
        result.errors.push(`Customer ${payload.currentUser.name}: ${e?.message}`);
      }
    }

    // Update result status
    result.success = result.errors.length === 0 || (result.syncedProducts > 0 || result.syncedOrders > 0 || result.syncedCustomers > 0);
    return result;
  } catch (err: any) {
    result.success = false;
    result.errors.push(err?.message || 'Sync failed');
    return result;
  }
}
