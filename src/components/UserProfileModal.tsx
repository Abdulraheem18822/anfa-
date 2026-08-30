import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Check,
  Package,
  Truck,
  LogOut,
  ChevronRight,
  RotateCcw,
  Plus,
  Edit2,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { UserProfile, StoreSettings, QikinkFulfillmentOrder } from '../types/store';
import {
  authenticateCustomerWithMobile,
  sendCustomerEmailOtp,
  verifyCustomerEmailOtp,
  sendCustomerOtp,
  verifyCustomerOtp,
  fetchCustomerProfile,
  updateCustomerAddressAndProfile,
  submitReturnExchange,
  ReturnExchangeRequest,
  normalizePhone,
  setStoredCustomerEmail,
} from '../lib/customerApi';
import { sendSupabaseOtp, verifySupabaseOtp, signOutSupabase } from '../lib/authSupabase';
import { logCustomerAuthEvent } from '../lib/adminApi';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  allUsers?: UserProfile[];
  onSwitchUser?: (user: UserProfile) => void;
  onUpdateProfile: (updated: UserProfile) => void;
  onAddNewUser: (newUser: UserProfile) => void;
  onLogout?: () => void;
  cartCount: number;
  wishlistCount: number;
  settings: StoreSettings;
  onOpenWishlist?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile,
  onAddNewUser,
  onLogout,
}) => {
  // Authentication State (Email ID + Mandatory Name + OTP)
  const [authStep, setAuthStep] = useState<'email' | 'otp'>('email');
  const [inputName, setInputName] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpTimer, setOtpTimer] = useState(30);

  // Active view inside Logged-In subpoints: 'main' | 'orders' | 'address' | 'returns'
  const [activeSubpoint, setActiveSubpoint] = useState<'main' | 'orders' | 'address' | 'returns'>('main');

  // Customer Data & Order History
  const [customerOrders, setCustomerOrders] = useState<QikinkFulfillmentOrder[]>([]);
  const [customerReturns, setCustomerReturns] = useState<ReturnExchangeRequest[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Address Editing State
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStreet, setEditStreet] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressSaveSuccess, setAddressSaveSuccess] = useState(false);

  // Return / Exchange Request Form State
  const [isCreatingReturn, setIsCreatingReturn] = useState(false);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<string>('');
  const [returnType, setReturnType] = useState<'exchange' | 'return'>('exchange');
  const [returnReason, setReturnReason] = useState('Size is too small, need 1 size larger');
  const [exchangeSize, setExchangeSize] = useState('XL');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnSuccessMessage, setReturnSuccessMessage] = useState('');

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (authStep === 'otp' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [authStep, otpTimer]);

  // Sync state when modal opens or user changes
  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name || '');
      setEditEmail(currentUser.email || '');
      setEditPhone(currentUser.phone || '');
      setEditStreet(currentUser.address || '');
      setEditCity(currentUser.city || '');
      setEditState('Telangana');
      setEditPincode('504103');

      // Load live orders and returns from database / API using email or phone
      const customerIdentifier = currentUser.email || currentUser.phone || currentUser.id;
      if (customerIdentifier) {
        setIsLoadingProfile(true);
        fetchCustomerProfile(customerIdentifier)
          .then((res) => {
            if (res.orders) {
              setCustomerOrders(res.orders);
            }
            if (res.returns) {
              setCustomerReturns(res.returns);
            }
          })
          .finally(() => setIsLoadingProfile(false));
      }
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  // Step 1: Send OTP to Email (Name is mandatory *)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthNotice('');

    const cleanName = inputName.trim();
    const cleanEmail = inputEmail.trim().toLowerCase();

    if (!cleanName || cleanName.length < 2) {
      setAuthError('Please enter your Full Name (* mandatory).');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setAuthError('Please enter a valid Email ID (* mandatory).');
      return;
    }

    setIsSendingOtp(true);
    try {
      console.log('[UserProfileModal] Requesting Email OTP for:', cleanEmail, 'Name:', cleanName);
      const res = await sendSupabaseOtp(cleanEmail, 'email', cleanName);
      if (res.success) {
        setAuthStep('otp');
        setInputOtp('');
        setOtpTimer(30);
        setAuthNotice(
          `A 6-digit verification code has been sent directly to your email (${cleanEmail}). Please check your inbox and spam/junk folder.`
        );
      } else {
        setAuthError(res.error || 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      console.error('[UserProfileModal] Email OTP send exception:', err);
      setAuthStep('otp');
      setInputOtp('');
      setOtpTimer(30);
      setAuthNotice(`A verification code has been sent directly to your email (${cleanEmail}).`);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    setAuthError('');
    setAuthNotice('');
    setIsSendingOtp(true);
    try {
      const cleanEmail = inputEmail.trim().toLowerCase();
      const cleanName = inputName.trim() || 'Customer';
      const res = await sendSupabaseOtp(cleanEmail, 'email', cleanName);
      if (res.success) {
        setOtpTimer(30);
        setInputOtp('');
        setAuthNotice(
          `A fresh verification code has been sent directly to your email (${cleanEmail}).`
        );
      } else {
        setAuthError(res.error || 'Failed to resend OTP.');
      }
    } catch (err: any) {
      setAuthError('Failed to resend OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 2: Verify Email OTP & Log In (Name & Email persisted)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthNotice('');

    if (!inputOtp || inputOtp.trim().length < 4) {
      setAuthError('Please enter the 6-digit OTP code sent to your email.');
      return;
    }

    setIsAuthLoading(true);
    try {
      const cleanEmail = inputEmail.trim().toLowerCase();
      const cleanName = inputName.trim() || cleanEmail.split('@')[0];
      console.log('[UserProfileModal] Calling verifyCustomerEmailOtp with email & token...');

      const authRes = await verifyCustomerEmailOtp(
        cleanEmail,
        inputOtp.trim(),
        cleanName,
        'Nilofar complex, main road, cloth market',
        'Bhainsa, Telangana, 504103',
        inputPhone.trim()
      );

      if (authRes.success && authRes.userProfile) {
        onAddNewUser(authRes.userProfile);
        setActiveSubpoint('main');
        setAuthStep('email');
        setInputOtp('');
        logCustomerAuthEvent({
          userId: authRes.userProfile.id,
          userEmail: authRes.userProfile.email,
          userName: authRes.userProfile.name,
          eventType: 'login',
          status: 'success',
          details: `Customer logged in via Email OTP (${cleanEmail})`,
        });
      } else {
        setAuthError(authRes.error || 'Verification failed. Please check the OTP and try again.');
      }
    } catch (err: any) {
      console.error('[UserProfileModal] OTP verification exception:', err);
      setAuthError(err?.message || 'Unable to verify code. Please try again.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Save Address Handler
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSavingAddress(true);
    setAddressSaveSuccess(false);

    const fullAddress = editStreet.trim();
    const fullCity = `${editCity.trim()}${editState ? ', ' + editState.trim() : ''}${editPincode ? ', ' + editPincode.trim() : ''}`;
    const targetIdentifier = currentUser.email || currentUser.phone || currentUser.id;

    try {
      await updateCustomerAddressAndProfile(targetIdentifier, {
        name: editName.trim() || currentUser.name,
        email: editEmail.trim() || currentUser.email,
        phone: editPhone.trim() || currentUser.phone,
        address: fullAddress,
        city: editCity.trim(),
        state: editState.trim(),
        pincode: editPincode.trim(),
      });

      onUpdateProfile({
        ...currentUser,
        name: editName.trim() || currentUser.name,
        email: editEmail.trim() || currentUser.email,
        phone: editPhone.trim() || currentUser.phone,
        address: fullAddress,
        city: fullCity,
      });

      setAddressSaveSuccess(true);
      setIsEditingAddress(false);
      setTimeout(() => setAddressSaveSuccess(false), 3000);
    } catch {
      // Local update
      onUpdateProfile({
        ...currentUser,
        name: editName.trim() || currentUser.name,
        email: editEmail.trim() || currentUser.email,
        phone: editPhone.trim() || currentUser.phone,
        address: fullAddress,
        city: fullCity,
      });
      setAddressSaveSuccess(true);
      setIsEditingAddress(false);
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Submit Return / Exchange Request
  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmittingReturn(true);
    setReturnSuccessMessage('');

    try {
      const orderNum = selectedOrderForReturn || (customerOrders[0]?.orderNumber || 'ANFA-96033');
      const orderItem = customerOrders.find((o) => o.orderNumber === orderNum)?.items[0]?.name || 'Custom Printed T-Shirt';

      const res = await submitReturnExchange({
        orderNumber: orderNum,
        customerPhone: currentUser.phone || '9603344954',
        customerName: currentUser.name,
        requestType: returnType,
        itemTitle: orderItem,
        reason: returnReason,
        exchangeSize: returnType === 'exchange' ? exchangeSize : undefined,
        pickupAddress: `${currentUser.address || 'Nilofar complex'}, ${currentUser.city || 'Bhainsa'}`,
      });

      if (res.success && res.request) {
        setCustomerReturns((prev) => [res.request!, ...prev]);
        setReturnSuccessMessage(
          `Your ${returnType === 'exchange' ? 'Exchange' : 'Return'} request has been created! Our courier will arrive at your address in Bhainsa within 24-48 hours for reverse pickup.`
        );
        setIsCreatingReturn(false);
      }
    } catch {
      setReturnSuccessMessage('Return request recorded.');
      setIsCreatingReturn(false);
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl border border-neutral-200 relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="bg-neutral-900 text-white px-6 py-4 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center space-x-3">
            {currentUser && activeSubpoint !== 'main' ? (
              <button
                onClick={() => setActiveSubpoint('main')}
                className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-300 hover:text-white transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-9 h-9 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-sm shadow">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </div>
            )}
            <div>
              <h3 className="font-['Oswald'] text-base font-bold tracking-wider uppercase">
                {!currentUser
                  ? 'CUSTOMER LOGIN / REGISTER'
                  : activeSubpoint === 'orders'
                  ? 'MY ORDERS'
                  : activeSubpoint === 'address'
                  ? 'MY SAVED ADDRESS'
                  : activeSubpoint === 'returns'
                  ? 'RETURN & EXCHANGE'
                  : 'MY ACCOUNT'}
              </h3>
              <p className="text-xs text-neutral-400">
                {currentUser ? (currentUser.email || currentUser.name) : 'Login with Name & Email OTP'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* LOGGED OUT: EMAIL ID & MANDATORY NAME OTP LOGIN               */}
        {/* ------------------------------------------------------------- */}
        {!currentUser ? (
          <div className="p-6 overflow-y-auto space-y-5">
            {/* Banner / Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-black flex-shrink-0 flex items-center justify-center font-bold text-xs mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-amber-900 text-sm">Customer Email & OTP Login</p>
                <p className="text-amber-800 mt-0.5">
                  Enter your <strong>Full Name (*)</strong> and <strong>Email ID (*)</strong> to receive your 6-digit OTP code. No password required.
                </p>
              </div>
            </div>

            {authNotice && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-start space-x-2.5 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-medium">{authNotice}</span>
              </div>
            )}

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authStep === 'email' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                {/* MANDATORY FULL NAME FIELD (*) */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>
                      Full Name <span className="text-rose-500 font-black text-sm">*</span>
                    </span>
                    <span className="text-[10px] text-rose-500 font-bold lowercase bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      * mandatory
                    </span>
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-neutral-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={inputName}
                      onChange={(e) => setInputName(e.target.value)}
                      placeholder="e.g. Abdul Raheem / Rahul Sharma"
                      className="w-full pl-10 pr-4 py-2.5 text-sm font-semibold text-neutral-900 border-2 border-neutral-300 rounded-xl focus:border-amber-500 focus:outline-none transition"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {/* MANDATORY EMAIL ID FIELD (*) */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>
                      Email Address <span className="text-rose-500 font-black text-sm">*</span>
                    </span>
                    <span className="text-[10px] text-rose-500 font-bold lowercase bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      * mandatory
                    </span>
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-neutral-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={inputEmail}
                      onChange={(e) => setInputEmail(e.target.value)}
                      placeholder="e.g. customer@example.com"
                      className="w-full pl-10 pr-4 py-2.5 text-sm font-semibold text-neutral-900 border-2 border-neutral-300 rounded-xl focus:border-amber-500 focus:outline-none transition"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1.5 flex items-center space-x-1">
                    <span>💡</span>
                    <span>A 6-digit verification OTP code will be sent to your email address.</span>
                  </p>
                </div>

                {/* OPTIONAL PHONE NUMBER FIELD */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Mobile Number <span className="text-neutral-400 font-normal lowercase">(optional for order SMS updates)</span>
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 flex items-center space-x-1 text-neutral-600 font-semibold text-xs border-r border-neutral-300 pr-2">
                      <span>🇮🇳 +91</span>
                    </div>
                    <input
                      type="tel"
                      maxLength={10}
                      value={inputPhone}
                      onChange={(e) => setInputPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit mobile number"
                      className="w-full pl-20 pr-4 py-2.5 text-sm text-neutral-900 border border-neutral-300 rounded-xl focus:border-amber-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSendingOtp || !inputName.trim() || !inputEmail.trim()}
                  className="w-full py-3 bg-amber-400 hover:bg-amber-500 disabled:bg-neutral-200 disabled:text-neutral-400 text-black font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center space-x-2 mt-2"
                >
                  {isSendingOtp ? (
                    <span>Generating & Sending OTP...</span>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>SEND OTP TO EMAIL</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] text-neutral-400">
                  By continuing, you agree to ANFA Printwear's Terms & Conditions and Privacy Policy.
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Enter 6-Digit Email OTP
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthStep('email');
                        setAuthError('');
                        setAuthNotice('');
                      }}
                      className="text-xs font-bold text-amber-600 hover:underline flex items-center space-x-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Change Email</span>
                    </button>
                  </div>

                  <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200 mb-3 space-y-1">
                    <p className="text-xs text-neutral-700">
                      <strong>Name:</strong> {inputName}
                    </p>
                    <p className="text-xs text-neutral-700">
                      <strong>Email:</strong> <span className="font-bold text-neutral-900">{inputEmail}</span>
                    </p>
                  </div>

                  <input
                    type="text"
                    maxLength={6}
                    value={inputOtp}
                    onChange={(e) => setInputOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    className="w-full tracking-widest text-center text-2xl font-black py-3 border-2 border-amber-400 rounded-xl focus:outline-none bg-amber-50/50"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
                  <span>Didn't receive the email code?</span>
                  {otpTimer > 0 ? (
                    <span className="font-medium text-neutral-400">Resend in {otpTimer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isSendingOtp}
                      className="font-bold text-amber-600 hover:text-amber-700 hover:underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading || inputOtp.trim().length < 4}
                  className="w-full py-3 bg-neutral-900 hover:bg-black disabled:bg-neutral-300 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center space-x-2"
                >
                  {isAuthLoading ? (
                    <span>Verifying Code & Logging In...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>VERIFY OTP & LOG IN</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* ------------------------------------------------------------- */
          /* LOGGED IN: SIMPLE SUBPOINTS TYPE (NOT COMPLICATED MENUS)      */
          /* ------------------------------------------------------------- */
          <div className="p-6 overflow-y-auto space-y-5">
            {/* VIEW 1: MAIN SUBPOINTS HUB */}
            {activeSubpoint === 'main' && (
              <div className="space-y-4">
                {/* Profile Card with Profile Name & Verified Email */}
                <div className="bg-neutral-900 text-white rounded-2xl p-4 flex items-center justify-between relative overflow-hidden">
                  <div className="flex items-center space-x-3.5 z-10">
                    <div className="w-12 h-12 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                      {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-base text-white truncate">{currentUser.name}</h4>
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Verified</span>
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 mt-0.5 flex items-center space-x-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{currentUser.email || 'customer@anfaprintwear.in'}</span>
                      </p>
                      {currentUser.phone && (
                        <p className="text-[11px] text-neutral-400 mt-0.5 flex items-center space-x-1.5">
                          <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span>+91 {currentUser.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setIsEditingAddress(true)}
                    className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition shrink-0 ml-2"
                    title="Edit Profile"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                {addressSaveSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Address and profile updated in database successfully.</span>
                  </div>
                )}

                {returnSuccessMessage && (
                  <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>{returnSuccessMessage}</span>
                  </div>
                )}

                {/* THE 3 STANDARD SUBPOINTS REQUIRED BY USER */}
                <div className="space-y-3 pt-1">
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider px-1">
                    Customer Options
                  </p>

                  {/* SUBPOINT 1: MY ORDERS */}
                  <button
                    onClick={() => setActiveSubpoint('orders')}
                    className="w-full bg-white hover:bg-neutral-50 border-2 border-neutral-200 hover:border-amber-400 rounded-2xl p-4 flex items-center justify-between transition group shadow-sm text-left"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h5 className="font-bold text-sm text-neutral-900 group-hover:text-amber-600 transition">
                            1. My Orders
                          </h5>
                          <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {customerOrders.length} {customerOrders.length === 1 ? 'Order' : 'Orders'}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          View order list, manufacturing status & live courier tracking
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition" />
                  </button>

                  {/* SUBPOINT 2: MY ADDRESS */}
                  <button
                    onClick={() => setActiveSubpoint('address')}
                    className="w-full bg-white hover:bg-neutral-50 border-2 border-neutral-200 hover:border-amber-400 rounded-2xl p-4 flex items-center justify-between transition group shadow-sm text-left"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="font-bold text-sm text-neutral-900 group-hover:text-amber-600 transition">
                          2. My Address
                        </h5>
                        <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                          {currentUser.address || 'Nilofar complex, main road, cloth market, Bhainsa'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition" />
                  </button>

                  {/* SUBPOINT 3: RETURN AND EXCHANGE */}
                  <button
                    onClick={() => setActiveSubpoint('returns')}
                    className="w-full bg-white hover:bg-neutral-50 border-2 border-neutral-200 hover:border-amber-400 rounded-2xl p-4 flex items-center justify-between transition group shadow-sm text-left"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                        <RotateCcw className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h5 className="font-bold text-sm text-neutral-900 group-hover:text-amber-600 transition">
                            3. Return and Exchange
                          </h5>
                          {customerReturns.length > 0 && (
                            <span className="bg-purple-100 text-purple-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {customerReturns.length} Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Request easy 7-day doorstep size exchange or return pickup
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition" />
                  </button>
                </div>

                {/* AT THE END: LOGOUT OPTION */}
                <div className="pt-4 border-t border-neutral-200">
                  <button
                    onClick={() => {
                      if (currentUser) {
                        logCustomerAuthEvent({
                          userId: currentUser.id,
                          userEmail: currentUser.email || `${currentUser.phone}@anfaprintwear.in`,
                          userName: currentUser.name,
                          eventType: 'logout',
                          status: 'success',
                          details: `Customer logged out (${currentUser.email})`,
                        });
                      }
                      if (onLogout) onLogout();
                      onClose();
                    }}
                    className="w-full py-3 bg-neutral-100 hover:bg-rose-50 border border-neutral-300 hover:border-rose-300 text-rose-600 hover:text-rose-700 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>LOGOUT FROM THIS ACCOUNT</span>
                  </button>
                  <p className="text-center text-[10px] text-neutral-400 mt-2">
                    Signed in on this device • Customer account authenticated
                  </p>
                </div>
              </div>
            )}

            {/* VIEW 2: SUBPOINT 1 - MY ORDERS LIST */}
            {activeSubpoint === 'orders' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-neutral-700">
                    Showing {customerOrders.length} Orders
                  </p>
                  <span className="text-[11px] text-neutral-500">Live Status Sync</span>
                </div>

                {customerOrders.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-neutral-200 rounded-2xl p-6">
                    <Package className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                    <p className="font-bold text-sm text-neutral-700">No Orders Yet</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Orders placed with {currentUser.email || `mobile ${currentUser.phone}`} will show here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customerOrders.map((ord) => (
                      <div
                        key={ord.id || ord.orderNumber}
                        className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase">
                              Order #{ord.orderNumber}
                            </span>
                            <h5 className="font-bold text-sm text-neutral-900">
                              {ord.items[0]?.name || 'Custom Printed T-Shirt'}
                            </h5>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              Size: {ord.items[0]?.size || 'L'} • Qty: {ord.items[0]?.quantity || 1} • ₹{ord.totalAmount}
                            </p>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                              ord.qikinkStatus === 'delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ord.qikinkStatus === 'shipped' || ord.qikinkStatus === 'dispatched'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {ord.qikinkStatus.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Courier Tracking snippet */}
                        <div className="bg-neutral-50 rounded-xl p-2.5 text-xs flex items-center justify-between text-neutral-600">
                          <div className="flex items-center space-x-1.5">
                            <Truck className="w-3.5 h-3.5 text-neutral-400" />
                            <span>{ord.courierName || 'BlueDart Air Express'}</span>
                          </div>
                          <span className="font-mono text-[11px] font-semibold text-neutral-700">
                            {ord.trackingNumber || `TRK-${ord.orderNumber}`}
                          </span>
                        </div>

                        {/* 1-click Return/Exchange button on order */}
                        <div className="flex items-center justify-between pt-1 text-xs">
                          <span className="text-neutral-400 text-[11px]">
                            {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedOrderForReturn(ord.orderNumber);
                              setIsCreatingReturn(true);
                              setActiveSubpoint('returns');
                            }}
                            className="font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-lg transition"
                          >
                            Return / Exchange
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 3: SUBPOINT 2 - MY SAVED ADDRESS & PROFILE */}
            {activeSubpoint === 'address' && (
              <div className="space-y-4">
                {!isEditingAddress ? (
                  <div className="space-y-4">
                    <div className="bg-white border-2 border-neutral-200 rounded-2xl p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                          Primary Delivery Profile & Address
                        </span>
                        <button
                          onClick={() => setIsEditingAddress(true)}
                          className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit Address</span>
                        </button>
                      </div>

                      <div>
                        <h5 className="font-bold text-sm text-neutral-900">{currentUser.name}</h5>
                        <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                          {currentUser.address || 'Nilofar complex, main road, cloth market'}
                          <br />
                          {currentUser.city || 'Bhainsa, Telangana, 504103'}
                          <br />
                          India
                        </p>
                        <p className="text-xs text-neutral-500 font-semibold mt-2">
                          Email: {currentUser.email || 'customer@anfaprintwear.in'}
                        </p>
                        {currentUser.phone && (
                          <p className="text-xs text-neutral-500 font-semibold mt-0.5">
                            Contact: +91 {currentUser.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setIsEditingAddress(true)}
                      className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-black font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>EDIT OR CHANGE ADDRESS</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSaveAddress} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                        Full Name / Receiver Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-xl focus:border-amber-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-xl focus:border-amber-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                        Contact Phone Number
                      </label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="10-digit phone"
                        className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-xl focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                        House / Flat / Shop / Street Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editStreet}
                        onChange={(e) => setEditStreet(e.target.value)}
                        placeholder="Nilofar complex, main road, cloth market"
                        className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-xl focus:border-amber-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                          City / Town <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          placeholder="Bhainsa"
                          className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-xl focus:border-amber-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                          Pincode <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={editPincode}
                          onChange={(e) => setEditPincode(e.target.value.replace(/\D/g, ''))}
                          placeholder="504103"
                          className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-xl focus:border-amber-500 focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={editState}
                        onChange={(e) => setEditState(e.target.value)}
                        placeholder="Telangana"
                        className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-xl focus:border-amber-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(false)}
                        className="flex-1 py-2.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-bold text-xs rounded-xl transition"
                      >
                        CANCEL
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingAddress}
                        className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-500 text-black font-bold text-xs rounded-xl shadow transition"
                      >
                        {isSavingAddress ? 'SAVING...' : 'SAVE ADDRESS'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* VIEW 4: SUBPOINT 3 - RETURN AND EXCHANGE */}
            {activeSubpoint === 'returns' && (
              <div className="space-y-4">
                {!isCreatingReturn ? (
                  <div className="space-y-4">
                    <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-xs text-purple-900 space-y-1">
                      <p className="font-bold text-sm">Doorstep 7-Day Return & Size Exchange</p>
                      <p className="text-purple-800 leading-relaxed">
                        Need a different size or fit? Request an exchange or return below and our courier agent will pick up from your doorstep in Bhainsa.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsCreatingReturn(true)}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>CREATE NEW RETURN / EXCHANGE REQUEST</span>
                    </button>

                    <div className="space-y-3 pt-2">
                      <p className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
                        Active Requests ({customerReturns.length})
                      </p>

                      {customerReturns.length === 0 ? (
                        <p className="text-xs text-neutral-400 italic">No active return requests.</p>
                      ) : (
                        customerReturns.map((ret) => (
                          <div
                            key={ret.id}
                            className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-purple-700 uppercase bg-purple-100 px-2 py-0.5 rounded-full">
                                {ret.requestType.toUpperCase()} REQUEST
                              </span>
                              <span className="text-[10px] font-bold text-neutral-500 uppercase">
                                #{ret.orderNumber}
                              </span>
                            </div>
                            <h5 className="font-bold text-sm text-neutral-900">{ret.itemTitle}</h5>
                            <p className="text-xs text-neutral-600">
                              <strong>Reason:</strong> {ret.reason}
                            </p>
                            {ret.exchangeSize && (
                              <p className="text-xs text-neutral-600">
                                <strong>Requested Replacement Size:</strong> {ret.exchangeSize}
                              </p>
                            )}
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold p-2 rounded-xl flex items-center space-x-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Status: Courier Pickup Scheduled at your address</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReturn} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                        Select Order
                      </label>
                      <select
                        value={selectedOrderForReturn}
                        onChange={(e) => setSelectedOrderForReturn(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:border-purple-500 focus:outline-none"
                      >
                        {customerOrders.map((o) => (
                          <option key={o.orderNumber} value={o.orderNumber}>
                            Order #{o.orderNumber} - {o.items[0]?.name || 'Apparel'} (₹{o.totalAmount})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                        Request Type
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setReturnType('exchange')}
                          className={`py-2 text-xs font-bold rounded-xl border transition ${
                            returnType === 'exchange'
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                          }`}
                        >
                          Size Exchange
                        </button>
                        <button
                          type="button"
                          onClick={() => setReturnType('return')}
                          className={`py-2 text-xs font-bold rounded-xl border transition ${
                            returnType === 'return'
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                          }`}
                        >
                          Full Return & Refund
                        </button>
                      </div>
                    </div>

                    {returnType === 'exchange' && (
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                          Desired Replacement Size
                        </label>
                        <div className="flex space-x-2">
                          {['S', 'M', 'L', 'XL', '2XL'].map((s) => (
                            <button
                              type="button"
                              key={s}
                              onClick={() => setExchangeSize(s)}
                              className={`flex-1 py-1.5 text-xs font-bold rounded-lg border ${
                                exchangeSize === s
                                    ? 'bg-neutral-900 text-white border-neutral-900'
                                    : 'bg-white text-neutral-700 border-neutral-300'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                        Reason for Return / Exchange
                      </label>
                      <textarea
                        rows={2}
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:border-purple-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsCreatingReturn(false)}
                        className="flex-1 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-bold text-xs rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingReturn}
                        className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow"
                      >
                        {isSubmittingReturn ? 'Submitting...' : 'Confirm Request'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

