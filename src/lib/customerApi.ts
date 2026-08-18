import { UserProfile, QikinkFulfillmentOrder } from '../types/store';
import { supabase } from './supabase';

export interface CustomerProfileData {
  id: string;
  phone: string;
  name: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReturnExchangeRequest {
  id: string;
  orderNumber: string;
  customerPhone: string;
  customerName: string;
  requestType: 'return' | 'exchange';
  itemTitle: string;
  reason: string;
  exchangeSize?: string;
  status: 'requested' | 'pickup_scheduled' | 'received' | 'refunded' | 'exchanged_delivered';
  pickupAddress: string;
  createdAt: string;
}

const CUSTOMER_SESSION_KEY = 'anfa_customer_phone_session';

export function getStoredCustomerPhone(): string | null {
  try {
    return localStorage.getItem(CUSTOMER_SESSION_KEY) || null;
  } catch {
    return null;
  }
}

export function setStoredCustomerPhone(phone: string) {
  try {
    localStorage.setItem(CUSTOMER_SESSION_KEY, phone);
  } catch {
    // ignore
  }
}

export function clearStoredCustomerPhone() {
  try {
    localStorage.removeItem(CUSTOMER_SESSION_KEY);
  } catch {
    // ignore
  }
}

/**
 * Clean & normalize Indian mobile number (e.g. "+91 9603344954" -> "9603344954")
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
}

/**
 * Meesho-Style Customer Login / Signup via Mobile Number & OTP
 * Deduplication: single record per mobile number in database & server
 */
export async function authenticateCustomerWithMobile(
  phoneRaw: string,
  otp: string,
  fullName?: string,
  email?: string,
  address?: string,
  city?: string
): Promise<{ success: boolean; customer?: CustomerProfileData; userProfile?: UserProfile; isNewUser?: boolean; error?: string }> {
  const phone = normalizePhone(phoneRaw);
  if (!phone || phone.length < 10) {
    return { success: false, error: 'Please enter a valid 10-digit mobile number' };
  }

  try {
    const res = await fetch('/api/customer/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        otp,
        name: fullName || 'Valued Customer',
        email: email || `${phone}@anfaprintwear.in`,
        address: address || 'Nilofar complex, main road, cloth market',
        city: city || 'Bhainsa, Telangana, 504103',
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.customer) {
        setStoredCustomerPhone(data.customer.phone);
        const profile: UserProfile = {
          id: data.customer.id,
          name: data.customer.name,
          email: data.customer.email || `${data.customer.phone}@anfaprintwear.in`,
          phone: data.customer.phone,
          address: data.customer.address || 'Nilofar complex, main road, cloth market',
          city: data.customer.city || 'Bhainsa, Telangana, 504103',
          country: 'India',
        };
        return {
          success: true,
          customer: data.customer,
          userProfile: profile,
          isNewUser: data.isNewUser,
        };
      }
    }
  } catch (err) {
    console.warn('Backend customer auth fallback:', err);
  }

  // Client-side Fallback & Supabase Direct Deduplication
  try {
    let existingData: CustomerProfileData | null = null;

    // Check Supabase
    try {
      const { data: dbData } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

      if (dbData) {
        existingData = {
          id: dbData.id || `cust-${phone}`,
          phone: dbData.phone,
          name: dbData.name || fullName || 'Valued Customer',
          email: dbData.email || `${phone}@anfaprintwear.in`,
          address: dbData.address || 'Nilofar complex, main road, cloth market',
          city: dbData.city || 'Bhainsa, Telangana, 504103',
          createdAt: dbData.created_at,
          updatedAt: dbData.updated_at,
        };
      }
    } catch {
      // ignore
    }

    if (!existingData) {
      // New Customer Record
      const newCustomer: CustomerProfileData = {
        id: `cust-${phone}`,
        phone,
        name: fullName?.trim() || 'Customer ' + phone.slice(-4),
        email: email?.trim() || `${phone}@anfaprintwear.in`,
        address: address || 'Nilofar complex, main road, cloth market',
        city: city || 'Bhainsa, Telangana, 504103',
        state: 'Telangana',
        pincode: '504103',
        country: 'India',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to Supabase
      try {
        await supabase.from('customers').upsert({
          id: newCustomer.id,
          phone: newCustomer.phone,
          name: newCustomer.name,
          email: newCustomer.email,
          address: newCustomer.address,
          city: newCustomer.city,
          state: newCustomer.state,
          pincode: newCustomer.pincode,
          country: newCustomer.country,
          created_at: newCustomer.createdAt,
          updated_at: newCustomer.updatedAt,
        });
      } catch {
        // ignore
      }

      existingData = newCustomer;
    }

    setStoredCustomerPhone(existingData.phone);
    const profile: UserProfile = {
      id: existingData.id,
      name: existingData.name,
      email: existingData.email || `${existingData.phone}@anfaprintwear.in`,
      phone: existingData.phone,
      address: existingData.address,
      city: existingData.city,
      country: 'India',
    };

    return { success: true, customer: existingData, userProfile: profile };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Authentication failed' };
  }
}

/**
 * Fetch Full Customer Profile, Saved Address, and Orders
 */
export async function fetchCustomerProfile(phoneRaw: string): Promise<{
  customer: CustomerProfileData | null;
  orders: QikinkFulfillmentOrder[];
  returns: ReturnExchangeRequest[];
}> {
  const phone = normalizePhone(phoneRaw);

  let customer: CustomerProfileData | null = null;
  let orders: QikinkFulfillmentOrder[] = [];
  let returns: ReturnExchangeRequest[] = [];

  try {
    const res = await fetch(`/api/customer/profile/${phone}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          customer: data.customer || null,
          orders: data.orders || [],
          returns: data.returns || [],
        };
      }
    }
  } catch {
    // fallback
  }

  // Fallback direct read from Supabase
  try {
    const { data: cData } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (cData) {
      customer = {
        id: cData.id || `cust-${phone}`,
        phone: cData.phone,
        name: cData.name || 'Valued Customer',
        email: cData.email,
        address: cData.address,
        city: cData.city,
        state: cData.state,
        pincode: cData.pincode,
        country: cData.country,
      };
    }
  } catch {
    // ignore
  }

  return { customer, orders, returns };
}

/**
 * Update Customer Profile & Saved Address in Database
 */
export async function updateCustomerAddressAndProfile(
  phoneRaw: string,
  data: Partial<CustomerProfileData>
): Promise<{ success: boolean; customer?: CustomerProfileData; error?: string }> {
  const phone = normalizePhone(phoneRaw);

  try {
    const res = await fetch('/api/customer/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, ...data }),
    });

    if (res.ok) {
      const resJson = await res.json();
      if (resJson.success) {
        return { success: true, customer: resJson.customer };
      }
    }
  } catch {
    // fallback
  }

  // Supabase fallback
  try {
    const updatePayload = {
      phone,
      ...data,
      updated_at: new Date().toISOString(),
    };
    await supabase.from('customers').upsert(updatePayload);
    return { success: true, customer: updatePayload as any };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update address' };
  }
}

/**
 * Submit Return or Exchange Request
 */
export async function submitReturnExchange(
  payload: Omit<ReturnExchangeRequest, 'id' | 'createdAt' | 'status'>
): Promise<{ success: boolean; request?: ReturnExchangeRequest; error?: string }> {
  try {
    const res = await fetch('/api/customer/returns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return { success: true, request: data.request };
      }
    }
  } catch {
    // fallback
  }

  const newReq: ReturnExchangeRequest = {
    id: `ret-${Date.now()}`,
    ...payload,
    status: 'pickup_scheduled',
    createdAt: new Date().toISOString(),
  };

  try {
    await supabase.from('returns_exchanges').insert([newReq]);
  } catch {
    // ignore
  }

  return { success: true, request: newReq };
}
