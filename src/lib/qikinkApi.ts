import { Product, QikinkFulfillmentOrder, CustomDesignUpload, QikinkWebhookPayload } from '../types/store';

async function safeParseJsonResponse<T>(res: Response, fallback: T): Promise<T> {
  try {
    const text = await res.text();
    if (!text || !text.trim()) {
      return fallback;
    }
    return JSON.parse(text) as T;
  } catch (e) {
    console.warn('qikinkApi safeParseJsonResponse fallback:', e);
    return fallback;
  }
}

/**
 * Fetch products from the backend API (Supabase backed)
 */
export async function getBackendProducts(showAll: boolean = false): Promise<Product[]> {
  try {
    const res = await fetch(`/api/products?all=${showAll}`);
    if (!res.ok) return [];
    const json = await safeParseJsonResponse<{ success?: boolean; products?: Product[] }>(res, {});
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
    const json = await safeParseJsonResponse<{ success?: boolean; product?: Product; error?: string }>(res, {});
    if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update product');
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
    const json = await safeParseJsonResponse<{ success?: boolean; message?: string; product?: Product; error?: string }>(res, {});
    return {
      success: json.success ?? false,
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
    const json = await safeParseJsonResponse<{ success?: boolean; order?: QikinkFulfillmentOrder; message?: string; error?: string }>(res, {});
    return {
      success: json.success ?? false,
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
    const json = await safeParseJsonResponse<{ success?: boolean; design?: CustomDesignUpload; error?: string }>(res, {});
    return {
      success: json.success ?? false,
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
    const json = await safeParseJsonResponse<{ success?: boolean; orders?: QikinkFulfillmentOrder[] }>(res, {});
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
    const json = await safeParseJsonResponse<{ success?: boolean; logs?: Array<{ id: string; timestamp: string; event: string; payload: unknown; status: string }> }>(res, {});
    return json.logs || [];
  } catch {
    return [];
  }
}

export interface SandboxStatusResponse {
  success: boolean;
  environment: string;
  qikink: {
    status: string;
    clientId: string;
    apiKeyMasked: string;
    webhookSecretMasked: string;
    baseUrl: string;
    webhookEndpointUrl: string;
    mode: string;
  };
  payment: {
    status: string;
    gateway: string;
    keyIdMasked: string;
    supportedGateways: string[];
  };
  logistics: {
    status: string;
    provider: string;
    shiprocketEmail: string;
    defaultCourier: string;
  };
  database: {
    provider: string;
    projectId: string;
    url: string;
    status: string;
  };
  verifiedAt: string;
}

/**
 * Fetch sandbox configuration status
 */
export async function fetchSandboxStatus(): Promise<SandboxStatusResponse | null> {
  try {
    const res = await fetch('/api/sandbox/status');
    if (!res.ok) return null;
    const json = await safeParseJsonResponse<SandboxStatusResponse>(res, {} as SandboxStatusResponse);
    return json.success ? json : null;
  } catch {
    return null;
  }
}

/**
 * Trigger an automated test order in sandbox mode
 */
export async function dispatchSandboxTestOrder(params?: {
  sku?: string;
  title?: string;
  price?: number;
  size?: string;
  color?: string;
}): Promise<{ success: boolean; message?: string; order?: QikinkFulfillmentOrder; error?: string }> {
  try {
    const res = await fetch('/api/sandbox/test-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {}),
    });
    const json = await safeParseJsonResponse<{ success?: boolean; message?: string; order?: QikinkFulfillmentOrder; error?: string }>(res, {});
    return {
      success: json.success ?? false,
      message: json.message,
      order: json.order,
      error: json.error,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Sandbox test order dispatch failed' };
  }
}

/**
 * Simulate a Qikink sandbox webhook event
 */
export async function triggerSandboxWebhook(params: {
  eventType?: string;
  orderId?: string;
  status?: string;
  trackingNumber?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/sandbox/test-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const json = await safeParseJsonResponse<{ success?: boolean; message?: string; error?: string }>(res, {});
    return {
      success: json.success ?? false,
      message: json.message,
      error: json.error,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Webhook trigger failed' };
  }
}

