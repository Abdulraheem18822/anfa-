import { Product, QikinkFulfillmentOrder, CustomDesignUpload, QikinkWebhookPayload } from '../types/store';

/**
 * Fetch products from the backend API (Supabase backed)
 */
export async function getBackendProducts(showAll: boolean = false): Promise<Product[]> {
  try {
    const res = await fetch(`/api/products?all=${showAll}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    const json = await res.json();
    return json.products || [];
  } catch (error) {
    console.warn('API getBackendProducts fallback to local:', error);
    return [];
  }
}

/**
 * Update and enhance product information (Title, description, price, isLive)
 */
export async function updateProductDetails(
  productId: string,
  updates: Partial<Product>
): Promise<{ success: boolean; product?: Product; error?: string }> {
  try {
    const res = await fetch(`/api/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update product');
    const json = await res.json();
    return { success: true, product: json.product };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Update failed' };
  }
}

/**
 * Trigger simulated or real Qikink Webhook Product Push
 */
export async function simulateQikinkProductPush(params: {
  title: string;
  category: string;
  basePrice: number;
  retailPrice: number;
  mockupUrl?: string;
  colors?: { name: string; hex: string }[];
  sizes?: string[];
  printArea?: 'chest' | 'back' | 'pocket';
}): Promise<{ success: boolean; message?: string; product?: Product; error?: string }> {
  try {
    const res = await fetch('/api/products/simulate-qikink-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const json = await res.json();
    return {
      success: json.success,
      message: json.message,
      product: json.product,
      error: json.error,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Simulation failed' };
  }
}

/**
 * Automatically send order to Qikink POD fulfillment
 */
export async function dispatchOrderToQikink(orderData: {
  orderNumber?: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  items: Array<{
    productId: string;
    sku?: string;
    name: string;
    size: string;
    color: string;
    quantity: number;
    price: number;
    printFileUrl?: string;
    printPlacement?: string;
    customNotes?: string;
  }>;
  totalAmount: number;
}): Promise<{ success: boolean; order?: QikinkFulfillmentOrder; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/orders/fulfillment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    const json = await res.json();
    return {
      success: json.success,
      order: json.order,
      message: json.message,
      error: json.error,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Fulfillment call failed' };
  }
}

/**
 * Upload high-res transparent PNG design linked to customer account
 */
export async function uploadDesignToAccount(params: {
  customerId: string;
  customerEmail?: string;
  fileName: string;
  fileBase64: string;
  width: number;
  height: number;
  isTransparent: boolean;
}): Promise<{ success: boolean; design?: CustomDesignUpload; error?: string }> {
  try {
    const res = await fetch('/api/storage/upload-design', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const json = await res.json();
    return {
      success: json.success,
      design: json.design,
      error: json.error,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Upload failed' };
  }
}

/**
 * Fetch all fulfilled orders
 */
export async function fetchAllOrders(customerId?: string): Promise<QikinkFulfillmentOrder[]> {
  try {
    const url = customerId ? `/api/orders?customerId=${customerId}` : '/api/orders';
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    return json.orders || [];
  } catch {
    return [];
  }
}

/**
 * Fetch webhook logs for monitoring
 */
export async function fetchWebhookLogs(): Promise<Array<{ id: string; timestamp: string; event: string; payload: unknown; status: string }>> {
  try {
    const res = await fetch('/api/webhooks/logs');
    if (!res.ok) return [];
    const json = await res.json();
    return json.logs || [];
  } catch {
    return [];
  }
}
