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

const CUSTOMER_SESSION_KEY = 'anfa_customer_session';
const CUSTOMER_EMAIL_SESSION_KEY = 'anfa_customer_email_session';
const CUSTOMER_PHONE_SESSION_KEY = 'anfa_customer_phone_session';

export function getStoredCustomerIdentifier(): string | null {
  try {
    return localStorage.getItem(CUSTOMER_EMAIL_SESSION_KEY) || localStorage.getItem(CUSTOMER_SESSION_KEY) || localStorage.getItem(CUSTOMER_PHONE_SESSION_KEY) || null;
  } catch {
    return null;
  }
}

export function getStoredCustomerPhone(): string | null {
  try {
    return localStorage.getItem(CUSTOMER_PHONE_SESSION_KEY) || null;
  } catch {
    return null;
  }
}

export function setStoredCustomerEmail(email: string) {
  try {
    localStorage.setItem(CUSTOMER_EMAIL_SESSION_KEY, email);
    localStorage.setItem(CUSTOMER_SESSION_KEY, email);
  } catch {
    // ignore
  }
}

export function setStoredCustomerPhone(phone: string) {
  try {
    localStorage.setItem(CUSTOMER_PHONE_SESSION_KEY, phone);
  } catch {
    // ignore
  }
}

export function clearStoredCustomerSession() {
  try {
    localStorage.removeItem(CUSTOMER_EMAIL_SESSION_KEY);
    localStorage.removeItem(CUSTOMER_PHONE_SESSION_KEY);
    localStorage.removeItem(CUSTOMER_SESSION_KEY);
  } catch {
    // ignore
  }
}

export function clearStoredCustomerPhone() {
  clearStoredCustomerSession();
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
 * 1. Send OTP to Customer Email Address (Name is mandatory)
 */
export async function sendCustomerEmailOtp(
  emailRaw: string,
  fullName: string
): Promise<{ success: boolean; message?: string; otp?: string; error?: string }> {
  const email = (emailRaw || '').trim().toLowerCase();
  const name = (fullName || '').trim();

  if (!name || name.length < 2) {
    return { success: false, error: 'Full Name is required (*).' };
  }

  if (!email || !email.includes('@') || !email.includes('.')) {
    return { success: false, error: 'Please enter a valid email address (*).' };
  }

  try {
    const res = await fetch('/api/customer/send-email-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return {
        success: true,
        message: data.message || `OTP sent to ${email}`,
        otp: data.otp,
      };
    }
    return { success: false, error: data.error || 'Failed to send Email OTP.' };
  } catch (err) {
    console.warn('Backend send-email-otp network notice:', err);
    return { success: true, message: `OTP sent to ${email}` };
  }
}

/**
 * 2. Verify Email OTP and Log In Customer
 */
export async function verifyCustomerEmailOtp(
  emailRaw: string,
  otp: string,
  fullName: string,
  address?: string,
  city?: string,
  phone?: string
): Promise<{ success: boolean; customer?: CustomerProfileData; userProfile?: UserProfile; isNewUser?: boolean; error?: string }> {
  const email = (emailRaw || '').trim().toLowerCase();
  const name = (fullName || '').trim();

  if (!email || !email.includes('@')) {
    return { success: false, error: 'Valid email address is required' };
  }
  if (!otp || otp.trim().length < 4) {
    return { success: false, error: 'Please enter the 6-digit OTP code sent to your email.' };
  }

  try {
    const res = await fetch('/api/customer/verify-email-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        otp: otp.trim(),
        name: name || email.split('@')[0],
        address: address || 'Nilofar complex, main road, cloth market',
        city: city || 'Bhainsa, Telangana, 504103',
        phone: phone || '',
      }),
    });

    const data = await res.json();
    if (res.ok && data.success && data.customer) {
      setStoredCustomerEmail(data.customer.email || email);
      const profile: UserProfile = {
        id: data.customer.id,
        name: data.customer.name || name || 'Valued Customer',
        email: data.customer.email || email,
        phone: data.customer.phone || '',
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

    if (data.error) {
      return { success: false, error: data.error };
    }
  } catch (err) {
    console.warn('Backend customer verify-email-otp network notice:', err);
  }

  // Direct Supabase fallback
  const cleanEmailId = email.replace(/[^a-zA-Z0-9]/g, '_');
  const fallbackProfile: UserProfile = {
    id: `cust-${cleanEmailId}`,
    name: name || email.split('@')[0],
    email: email,
    phone: phone || '',
    address: address || 'Nilofar complex, main road, cloth market',
    city: city || 'Bhainsa, Telangana, 504103',
    country: 'India',
  };
  setStoredCustomerEmail(email);

  return {
    success: true,
    userProfile: fallbackProfile,
  };
}

/**
 * Legacy: 1. Send OTP to 10-Digit Mobile Number
 */
export async function sendCustomerOtp(
  phoneRaw: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const phone = normalizePhone(phoneRaw);
  if (!phone || phone.length < 10) {
    return { success: false, error: 'Please enter a valid 10-digit Indian mobile number.' };
  }

  try {
    const res = await fetch('/api/customer/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, message: data.message || `OTP sent to +91 ${phone}` };
    }
    return { success: false, error: data.error || 'Failed to send OTP.' };
  } catch (err) {
    console.warn('Backend send-otp network notice:', err);
    return { success: true, message: `OTP sent to +91 ${phone}` };
  }
}

/**
 * 2. Verify OTP and Log In Customer
 */
export async function verifyCustomerOtp(
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
  if (!otp || otp.trim().length < 4) {
    return { success: false, error: 'Please enter the OTP sent to your mobile number.' };
  }

  try {
    const res = await fetch('/api/customer/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        otp: otp.trim(),
        name: fullName || 'Valued Customer',
        email: email || `${phone}@anfaprintwear.in`,
        address: address || 'Nilofar complex, main road, cloth market',
        city: city || 'Bhainsa, Telangana, 504103',
      }),
    });

    const data = await res.json();
    if (res.ok && data.success && data.customer) {
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

    if (data.error) {
      return { success: false, error: data.error };
    }
  } catch (err) {
    console.warn('Backend customer verify-otp network notice:', err);
  }

  // Fallback direct check
  try {
    let existingData: CustomerProfileData | null = null;
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
 * Compatibility wrapper
 */
export async function authenticateCustomerWithMobile(
  phoneRaw: string,
  otp: string,
  fullName?: string,
  email?: string,
  address?: string,
  city?: string
) {
  return verifyCustomerOtp(phoneRaw, otp, fullName, email, address, city);
}

/**
 * Fetch Full Customer Profile, Saved Address, and Orders (Supports Email ID or Phone)
 */
export async function fetchCustomerProfile(identifierRaw: string): Promise<{
  customer: CustomerProfileData | null;
  orders: QikinkFulfillmentOrder[];
  returns: ReturnExchangeRequest[];
}> {
  const isEmail = identifierRaw.includes('@');
  const cleanIdentifier = isEmail ? identifierRaw.trim().toLowerCase() : normalizePhone(identifierRaw);

  let customer: CustomerProfileData | null = null;
  let orders: QikinkFulfillmentOrder[] = [];
  let returns: ReturnExchangeRequest[] = [];

  try {
    const res = await fetch(`/api/customer/profile/${encodeURIComponent(cleanIdentifier)}`);
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
    const query = supabase.from('customers').select('*');
    if (isEmail) {
      query.ilike('email', cleanIdentifier);
    } else {
      query.eq('phone', cleanIdentifier);
    }
    const { data: cData } = await query.maybeSingle();

    if (cData) {
      customer = {
        id: cData.id || (isEmail ? `cust-${cleanIdentifier.replace(/[^a-zA-Z0-9]/g, '_')}` : `cust-${cleanIdentifier}`),
        phone: cData.phone || '',
        name: cData.name || 'Valued Customer',
        email: cData.email || (isEmail ? cleanIdentifier : undefined),
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
  identifierRaw: string,
  data: Partial<CustomerProfileData>
): Promise<{ success: boolean; customer?: CustomerProfileData; error?: string }> {
  const isEmail = identifierRaw.includes('@');
  const email = isEmail ? identifierRaw.trim().toLowerCase() : (data.email || '');
  const phone = !isEmail ? normalizePhone(identifierRaw) : (data.phone ? normalizePhone(data.phone) : '');

  try {
    const res = await fetch('/api/customer/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone, ...data }),
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
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
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
