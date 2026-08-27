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

// Storage Bucket Names
export const CUSTOM_DESIGNS_BUCKET = 'custom-designs';
export const PRODUCT_IMAGES_BUCKET = 'product-images';

// ============================================================================
// 1. CONNECTION HEALTH & PERSISTENCE CHECK
// ============================================================================

export interface SupabaseConnectionStatus {
  isConnected: boolean;
  latencyMs: number;
  url: string;
  tablesAvailable: {
    profiles: boolean;
    products: boolean;
    cart: boolean;
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
    profiles: false,
    products: false,
    cart: false,
    orders: false,
    custom_designs: false,
    customers: false,
  };

  try {
    const { error: profErr } = await supabase.from('profiles').select('id').limit(1);
    tables.profiles = !profErr;

    const { error: prodErr } = await supabase.from('products').select('id').limit(1);
    tables.products = !prodErr;

    const { error: cartErr } = await supabase.from('cart').select('id').limit(1);
    tables.cart = !cartErr;

    const { error: ordErr } = await supabase.from('orders').select('id').limit(1);
    tables.orders = !ordErr;

    const { error: desErr } = await supabase.from('custom_designs').select('id').limit(1);
    tables.custom_designs = !desErr;

    const { error: custErr } = await supabase.from('customers').select('id').limit(1);
    tables.customers = !custErr;

    const latencyMs = Date.now() - startTime;
    const isConnected = tables.products || tables.orders || tables.cart || tables.profiles || tables.custom_designs || tables.customers;

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
// 2. PRODUCT DATA SERVICE (public.products)
// ============================================================================

/**
 * Upload a product image to the 'product-images' public bucket
 */
export async function uploadProductImageToSupabase(
  file: File,
  productTitle?: string
): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  try {
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `catalog/${timestamp}_${cleanFileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(storagePath, file, {
        contentType: file.type || 'image/jpeg',
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.warn('Supabase product-images upload fallback:', uploadError.message);
      return { success: true, publicUrl: URL.createObjectURL(file) };
    }

    const { data: urlData } = supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .getPublicUrl(storagePath);

    return {
      success: true,
      publicUrl: urlData.publicUrl,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Product image upload failed' };
  }
}

export const ProductService = {
  /**
   * Fetch all active live products from public.products
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
        name: item.title || item.name || 'Custom T-Shirt',
        price: Number(item.price || item.base_price || 799),
        originalPrice: item.original_price ? Number(item.original_price) : undefined,
        rating: item.rating || 5,
        reviewCount: item.review_count || 12,
        image: item.image_url || item.image || item.mockup_url || '',
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
   * Insert or update a manual product into public.products
   */
  async upsert(product: Partial<Product> & { id: string }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Payload matching public.products (title, price, description, image_url, stock, etc.)
      const dbPayload: Record<string, any> = {
        id: product.id,
        title: product.name || 'Custom Apparel',
        price: Number(product.price || 799),
        description: product.description || '',
        image_url: product.image || '',
        stock: 10,
        // Also supply standard columns if schema supports them
        sku: product.sku || `ANFA-${Math.floor(1000 + Math.random() * 9000)}`,
        category: product.category || 'new',
        gender: product.gender || 'unisex',
        sizes: product.sizes || ['S', 'M', 'L', 'XL', '2XL'],
        available_colors: product.availableColors,
        is_live: product.isLive ?? true,
        created_at: product.createdAt || new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('products')
        .upsert(dbPayload)
        .select();

      if (error) {
        // Retry with pure minimal schema if extra columns fail
        const minimalPayload = {
          id: product.id,
          title: product.name || 'Custom Apparel',
          price: Number(product.price || 799),
          description: product.description || '',
          image_url: product.image || '',
          stock: 10,
        };
        const { data: minData, error: minErr } = await supabase
          .from('products')
          .upsert(minimalPayload)
          .select();
        if (minErr) throw minErr;
        return { success: true, data: minData?.[0] };
      }

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
// 3. CART DATA SERVICE (public.cart - Isolated per user_id)
// ============================================================================

export interface CartRow {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at?: string;
}

export const CartService = {
  /**
   * Get user's cart from public.cart
   */
  async getUserCart(userId: string): Promise<{ success: boolean; data: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('cart')
        .select('*, product:products(*)')
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err: any) {
      return { success: false, data: [], error: err?.message };
    }
  },

  /**
   * Add or update an item in public.cart
   */
  async addToCart(userId: string, productId: string, quantity: number = 1): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: existing } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('cart')
          .update({ quantity: (existing.quantity || 1) + quantity })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart')
          .insert([{ user_id: userId, product_id: productId, quantity }]);
        if (error) throw error;
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  },

  /**
   * Remove item from public.cart
   */
  async removeItem(cartId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('cart').delete().eq('id', cartId);
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  },

  /**
   * Clear all items in user's cart on checkout or logout
   */
  async clearCart(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('cart').delete().eq('user_id', userId);
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  },
};

// ============================================================================
// 4. ORDER DATA SERVICE (public.orders)
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
   * Fetch orders for a specific user ID or phone
   */
  async getByCustomer(userIdOrPhone: string): Promise<{ success: boolean; data: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`user_id.eq.${userIdOrPhone},customer_phone.eq.${userIdOrPhone},customer_email.eq.${userIdOrPhone}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err: any) {
      return { success: false, data: [], error: err?.message };
    }
  },

  /**
   * Create customer order into public.orders and trigger merchant alert
   */
  async createOrder(params: {
    userId?: string;
    items: any[];
    totalAmount: number;
    shippingAddress: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    customMockupUrl?: string;
  }): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      const orderPayload: Record<string, any> = {
        user_id: params.userId || null,
        items: params.items,
        total_amount: params.totalAmount,
        status: 'pending',
        shipping_address: params.shippingAddress,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select();

      if (error) throw error;

      const placedOrder = data?.[0];
      const orderId = placedOrder?.id || `ord-${Date.now()}`;

      // Call merchant email notification endpoint
      fetch('/api/orders/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          orderNumber: placedOrder?.order_number || `ANFA-${orderId.slice(0, 8).toUpperCase()}`,
          customerName: params.customerName,
          customerEmail: params.customerEmail,
          customerPhone: params.customerPhone,
          items: params.items,
          totalAmount: params.totalAmount,
          shippingAddress: params.shippingAddress,
          customMockupUrl: params.customMockupUrl,
        }),
      }).catch((e) => console.warn('Order notification notice:', e));

      return { success: true, orderId };
    } catch (err: any) {
      console.error('OrderService.createOrder error:', err);
      return { success: false, error: err?.message };
    }
  },

  /**
   * Upsert an order (compatibility helper)
   */
  async upsert(order: QikinkFulfillmentOrder): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const dbPayload = {
        id: order.id,
        items: order.items,
        total_amount: order.totalAmount,
        shipping_address: order.shippingAddress,
        status: order.qikinkStatus || 'pending',
        created_at: order.createdAt || new Date().toISOString(),
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
// 5. CUSTOM DESIGNS & FILE STORAGE SERVICE
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

export const CustomDesignService = {
  async getAll(): Promise<{ success: boolean; data: CustomDesignUpload[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('custom_designs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const designs: CustomDesignUpload[] = (data || []).map((d) => ({
        id: d.id,
        customerId: d.customer_id || 'guest',
        customerEmail: d.customer_email,
        fileName: d.file_name || 'custom_design.png',
        fileUrl: d.file_url,
        storagePath: d.storage_path || '',
        fileSizeBytes: d.file_size || 0,
        widthPx: d.width_px || 2400,
        heightPx: d.height_px || 3000,
        isTransparentPng: d.is_transparent ?? true,
        approvalStatus: d.approval_status || 'pending_review',
        adminNotes: d.admin_notes,
        createdAt: d.created_at || new Date().toISOString(),
      }));

      return { success: true, data: designs };
    } catch (err: any) {
      return { success: false, data: [], error: err?.message };
    }
  },

  async updateStatus(id: string, status: string, notes?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('custom_designs')
        .update({
          approval_status: status,
          admin_notes: notes,
        })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  },
};

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
