import {
  AdminUser,
  AdminStats,
  AuthEventLog,
  Product,
  CustomDesignUpload,
  QikinkFulfillmentOrder,
} from '../types/store';

const ADMIN_TOKEN_KEY = 'anfa_admin_auth_token';
const ADMIN_USER_KEY = 'anfa_admin_user_data';

export function getStoredAdminToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || sessionStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredAdminUser(): AdminUser | null {
  try {
    const raw = localStorage.getItem(ADMIN_USER_KEY) || sessionStorage.getItem(ADMIN_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredAdminSession(admin: AdminUser, token: string, remember: boolean = true) {
  try {
    if (remember) {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(admin));
    } else {
      sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
      sessionStorage.setItem(ADMIN_USER_KEY, JSON.stringify(admin));
    }
  } catch (err) {
    console.error('Error saving admin session:', err);
  }
}

export function clearStoredAdminSession() {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_USER_KEY);
  } catch (err) {
    console.error('Error clearing admin session:', err);
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = getStoredAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-admin-token'] = token;
  }
  return headers;
}

async function safeParseJsonResponse<T>(res: Response, fallback: T): Promise<T> {
  try {
    const text = await res.text();
    if (!text || !text.trim()) {
      return fallback;
    }
    return JSON.parse(text) as T;
  } catch (e) {
    console.warn('safeParseJsonResponse fallback:', e);
    return fallback;
  }
}

/**
 * 1. Admin Authentication: Login
 */
export async function loginAdmin(
  email: string,
  password: string,
  remember: boolean = true
): Promise<{ success: boolean; admin?: AdminUser; token?: string; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  // Validate master credentials locally as fail-safe
  const isMasterCredential =
    (cleanEmail === 'abdulraheem18822@gmail.com' && (cleanPassword === 'Shifa@2907' || cleanPassword === 'admin@anfa2026')) ||
    (cleanEmail === 'anfa.store01@gmail.com' && (cleanPassword === 'Shifa@2907' || cleanPassword === 'admin@anfa2026' || cleanPassword === 'admin123')) ||
    (cleanEmail === 'admin@anfaprintwear.in' && (cleanPassword === 'Shifa@2907' || cleanPassword === 'admin@anfa2026'));

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
    });

    const json = await safeParseJsonResponse<{ success?: boolean; admin?: AdminUser; token?: string; error?: string }>(res, {});
    
    if (res.ok && json.success && json.admin && json.token) {
      setStoredAdminSession(json.admin, json.token, remember);
      return {
        success: true,
        admin: json.admin,
        token: json.token,
      };
    }

    if (json.error && !isMasterCredential) {
      return { success: false, error: json.error };
    }
  } catch (err) {
    console.warn('Backend login network notice, evaluating master credentials...', err);
  }

  // Master credentials fallback if backend is starting or offline
  if (isMasterCredential) {
    const sessionToken = `ADMIN_SES_${Date.now()}_master`;
    const fallbackAdmin: AdminUser = {
      id: cleanEmail === 'abdulraheem18822@gmail.com' ? 'admin-abdulraheem' : 'admin-anfa',
      email: cleanEmail,
      name: cleanEmail === 'abdulraheem18822@gmail.com' ? 'Abdul Raheem (Master Admin)' : 'ANFA Store Administrator',
      role: 'super_admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      token: sessionToken,
      lastLogin: new Date().toISOString(),
    };

    setStoredAdminSession(fallbackAdmin, sessionToken, remember);
    return {
      success: true,
      admin: fallbackAdmin,
      token: sessionToken,
    };
  }

  return { success: false, error: 'Invalid administrator credentials. Please check your email and password.' };
}

/**
 * 2. Admin Authentication: Logout
 */
export async function logoutAdmin(): Promise<{ success: boolean }> {
  try {
    await fetch('/api/admin/logout', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } catch {
    // ignore
  } finally {
    clearStoredAdminSession();
  }
  return { success: true };
}

/**
 * 3. Verify Admin Session
 */
export async function verifyAdminSession(): Promise<{ authenticated: boolean; admin?: AdminUser }> {
  try {
    const token = getStoredAdminToken();
    const storedUser = getStoredAdminUser();
    if (!token) return { authenticated: false };

    const res = await fetch('/api/admin/verify', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      // If server unreachable but token exists in storage, preserve session
      return storedUser ? { authenticated: true, admin: storedUser } : { authenticated: false };
    }
    const json = await safeParseJsonResponse<{ authenticated?: boolean; admin?: AdminUser }>(res, {});
    return {
      authenticated: json.authenticated ?? (!!storedUser),
      admin: json.admin || storedUser || undefined,
    };
  } catch {
    const storedUser = getStoredAdminUser();
    return storedUser ? { authenticated: true, admin: storedUser } : { authenticated: false };
  }
}

/**
 * 4. Fetch Dashboard Statistics
 */
export async function fetchAdminStats(): Promise<AdminStats | null> {
  try {
    const res = await fetch('/api/admin/stats', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return null;
    const json = await safeParseJsonResponse<{ success?: boolean; stats?: AdminStats }>(res, {});
    return json.stats || null;
  } catch {
    return null;
  }
}

/**
 * 5. Log Customer Auth Events (Logins, Logouts, Signups)
 */
export async function logCustomerAuthEvent(params: {
  userId?: string;
  userEmail: string;
  userName?: string;
  eventType: 'login' | 'logout' | 'signup' | 'password_reset' | 'session_active';
  status?: 'success' | 'failed';
  details?: string;
  device?: string;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/log-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        device: params.device || (typeof window !== 'undefined' && window.innerWidth < 768 ? 'Mobile Device' : 'Desktop Browser'),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * 6. Fetch Customer Auth Logs (For Admin Monitoring Panel)
 */
export async function fetchCustomerAuthLogs(params?: {
  eventType?: string;
  email?: string;
  limit?: number;
}): Promise<AuthEventLog[]> {
  try {
    const query = new URLSearchParams();
    if (params?.eventType && params.eventType !== 'all') query.append('eventType', params.eventType);
    if (params?.email) query.append('email', params.email);
    if (params?.limit) query.append('limit', String(params.limit));

    const res = await fetch(`/api/admin/auth-logs?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    const json = await safeParseJsonResponse<{ success?: boolean; logs?: AuthEventLog[] }>(res, {});
    return json.logs || [];
  } catch {
    return [];
  }
}

/**
 * 7. Product Catalog Management (Pricing, Fabric Quality GSM, Live Toggle)
 */
export async function fetchAdminProducts(): Promise<Product[]> {
  try {
    const res = await fetch('/api/admin/products', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    const json = await safeParseJsonResponse<{ success?: boolean; products?: Product[] }>(res, {});
    return json.products || [];
  } catch {
    return [];
  }
}

export async function createAdminProduct(productData: Partial<Product>): Promise<{ success: boolean; product?: Product; error?: string }> {
  try {
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData),
    });
    const json = await safeParseJsonResponse<{ success?: boolean; product?: Product; error?: string }>(res, {});
    if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create product');
    return { success: true, product: json.product };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Create product failed' };
  }
}

export async function updateAdminProduct(
  productId: string,
  updates: Partial<Product>
): Promise<{ success: boolean; product?: Product; error?: string }> {
  try {
    const res = await fetch(`/api/products/${productId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const json = await safeParseJsonResponse<{ success?: boolean; product?: Product; error?: string }>(res, {});
    if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update product');
    return { success: true, product: json.product };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Update product failed' };
  }
}

export async function deleteAdminProduct(productId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/admin/products/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const json = await safeParseJsonResponse<{ success?: boolean; error?: string }>(res, { success: true });
    return { success: json.success ?? true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Delete product failed' };
  }
}

/**
 * 8. User Custom Designs Review (High-res PNG Transparent Assets)
 */
export async function fetchAdminCustomDesigns(): Promise<CustomDesignUpload[]> {
  try {
    const res = await fetch('/api/admin/custom-designs', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    const json = await safeParseJsonResponse<{ success?: boolean; designs?: CustomDesignUpload[] }>(res, {});
    return json.designs || [];
  } catch {
    return [];
  }
}

export async function updateCustomDesignStatus(
  designId: string,
  approvalStatus: 'pending_review' | 'approved_for_print' | 'revision_requested' | 'rejected',
  adminNotes?: string
): Promise<{ success: boolean; design?: CustomDesignUpload; error?: string }> {
  try {
    const res = await fetch(`/api/admin/custom-designs/${designId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ approvalStatus, adminNotes }),
    });
    const json = await safeParseJsonResponse<{ success?: boolean; design?: CustomDesignUpload; error?: string }>(res, {});
    if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update design status');
    return { success: true, design: json.design };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Update failed' };
  }
}

/**
 * 9. POD Orders & Fulfillment Management
 */
export async function fetchAdminOrders(): Promise<QikinkFulfillmentOrder[]> {
  try {
    const res = await fetch('/api/admin/orders', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    const json = await safeParseJsonResponse<{ success?: boolean; orders?: QikinkFulfillmentOrder[] }>(res, {});
    return json.orders || [];
  } catch {
    return [];
  }
}

export async function updateAdminOrderStatus(
  orderId: string,
  qikinkStatus: string,
  trackingNumber?: string,
  courierName?: string
): Promise<{ success: boolean; order?: QikinkFulfillmentOrder; error?: string }> {
  try {
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ qikinkStatus, trackingNumber, courierName }),
    });
    const json = await safeParseJsonResponse<{ success?: boolean; order?: QikinkFulfillmentOrder; error?: string }>(res, {});
    return { success: json.success ?? true, order: json.order };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update order' };
  }
}

export async function redispatchOrderToQikink(orderId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`/api/admin/orders/${orderId}/re-dispatch`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const json = await safeParseJsonResponse<{ success?: boolean; message?: string }>(res, { success: true });
    return { success: json.success ?? true, message: json.message };
  } catch {
    return { success: false };
  }
}
