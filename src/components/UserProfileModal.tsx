import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Check,
  ShoppingBag,
  Package,
  Truck,
  Settings,
  Heart,
  LogOut,
  ArrowRight,
  Clock,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { UserProfile, StoreSettings } from '../types/store';
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
  cartCount,
  wishlistCount,
  settings,
  onOpenWishlist,
}) => {
  // Navigation tabs inside logged-in profile: 'orders' | 'track' | 'account' | 'wishlist'
  const [profileTab, setProfileTab] = useState<'orders' | 'track' | 'account' | 'wishlist'>('orders');

  // Login form state (if guest or logged out)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');

  // Account editing form state
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editEmail, setEditEmail] = useState(currentUser?.email || '');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '');
  const [editAddress, setEditAddress] = useState(
    currentUser?.address || 'Nilofar complex, main road, cloth market'
  );
  const [editCity, setEditCity] = useState(currentUser?.city || 'Bhainsa, Telangana, 504103');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state when currentUser changes
  React.useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name);
      setEditEmail(currentUser.email || '');
      setEditPhone(currentUser.phone || '');
      setEditAddress(currentUser.address || 'Nilofar complex, main road, cloth market');
      setEditCity(currentUser.city || 'Bhainsa, Telangana, 504103');
    }
  }, [currentUser]);

  // Order Tracking State
  const [trackQuery, setTrackQuery] = useState('ANFA-96033');
  const [trackedOrder, setTrackedOrder] = useState({
    id: 'ANFA-96033',
    item: 'Mountain Wanderer Traveling T-Shirt (Size L, Sunset Orange)',
    date: '14 Aug 2026',
    status: 'In Transit',
    courier: 'BlueDart Express',
    trackingNumber: 'BLUEDART-849201948',
    estDelivery: '18 Aug 2026',
    step: 3, // 1: Placed, 2: Printed, 3: Shipped, 4: Delivered
  });

  if (!isOpen) return null;

  // Mock standard order history
  const standardOrders = [
    {
      id: 'ANFA-96033',
      date: '14 Aug 2026',
      items: 'Mountain Wanderer Traveling T-Shirt',
      size: 'L',
      color: 'Sunset Orange',
      qty: 1,
      total: 899.0,
      status: 'In Transit',
      statusColor: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    {
      id: 'ANFA-88124',
      date: '02 Aug 2026',
      items: 'Paws & Adventure Dog Lovers Heavyweight T-Shirt',
      size: 'XL',
      color: 'Optic White',
      qty: 1,
      total: 1199.0,
      status: 'Delivered',
      statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
  ];

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) return;

    const isEmail = loginIdentifier.includes('@');
    const userEmail = isEmail ? loginIdentifier.trim() : `${loginIdentifier.trim()}@anfaprintwear.in`;
    const userName = isEmail ? loginIdentifier.split('@')[0] : 'Customer';

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: userName,
      email: userEmail,
      phone: !isEmail ? loginIdentifier.trim() : '+91 9603344954',
      address: 'Nilofar complex, main road, cloth market',
      city: 'Bhainsa, Telangana, 504103',
      country: 'India',
    };

    // Log customer login event for admin monitoring
    logCustomerAuthEvent({
      userId: newUser.id,
      userEmail: newUser.email || '',
      userName: newUser.name,
      eventType: 'login',
      status: 'success',
      details: 'Customer authenticated via storefront login modal.',
    });

    onAddNewUser(newUser);
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpEmail.trim() || !signUpName.trim()) return;

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: signUpName.trim(),
      email: signUpEmail.trim(),
      phone: signUpPhone.trim() || '+91 9603344954',
      address: 'Nilofar complex, main road, cloth market',
      city: 'Bhainsa, Telangana, 504103',
      country: 'India',
    };

    // Log customer signup event for admin monitoring
    logCustomerAuthEvent({
      userId: newUser.id,
      userEmail: newUser.email,
      userName: newUser.name,
      eventType: 'signup',
      status: 'success',
      details: 'New customer account registered on ANFA storefront.',
    });

    onAddNewUser(newUser);
  };

  const handleLogoutCustomer = () => {
    if (currentUser) {
      logCustomerAuthEvent({
        userId: currentUser.id,
        userEmail: currentUser.email || '',
        userName: currentUser.name,
        eventType: 'logout',
        status: 'success',
        details: 'Customer logged out of active session.',
      });
    }
    if (onLogout) onLogout();
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser) {
      onUpdateProfile({
        ...currentUser,
        name: editName,
        email: editEmail,
        phone: editPhone,
        address: editAddress,
        city: editCity,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  const handleSearchTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackQuery.trim()) {
      setTrackedOrder({
        id: trackQuery.trim().toUpperCase(),
        item: 'Custom Printed T-Shirt Order',
        date: 'Recent Order',
        status: 'In Transit',
        courier: 'Express Courier Services',
        trackingNumber: `TRACK-${Math.floor(100000 + Math.random() * 900000)}`,
        estDelivery: 'In 2-3 Business Days',
        step: 3,
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl overflow-hidden max-w-xl w-full shadow-2xl border border-neutral-200 relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-neutral-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-base shadow-md">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-['Oswald'] text-lg font-bold tracking-wider uppercase">
                {currentUser ? currentUser.name : 'ACCOUNT LOGIN'}
              </h3>
              <p className="text-xs text-neutral-400">
                {currentUser ? (currentUser.email || currentUser.phone) : 'Login with Email or Mobile Number'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {currentUser && onLogout && (
              <button
                onClick={handleLogoutCustomer}
                className="text-xs font-bold text-rose-400 hover:text-rose-300 bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded-lg flex items-center space-x-1 transition"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>LOGOUT</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* LOGGED OUT / NEW USER VIEW */}
        {!currentUser ? (
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="flex border-b border-neutral-200 text-xs font-bold uppercase tracking-wider">
              <button
                onClick={() => setAuthMode('signin')}
                className={`flex-1 py-3 text-center border-b-2 transition ${
                  authMode === 'signin'
                    ? 'border-amber-500 text-amber-600 font-bold'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-3 text-center border-b-2 transition ${
                  authMode === 'signup'
                    ? 'border-amber-500 text-amber-600 font-bold'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                New Customer
              </button>
            </div>

            {authMode === 'signin' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                <p className="text-xs text-neutral-600">
                  Enter your <strong>Email Address</strong> or <strong>Contact Number</strong> to view your orders, tracking, and manage your profile.
                </p>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Email Address or Mobile Number
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. customer@gmail.com or 9603344954"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-black font-['Oswald'] font-bold text-xs tracking-wider uppercase rounded-xl transition shadow-md active:scale-95 flex items-center justify-center space-x-2"
                  >
                    <span>LOGIN TO PROFILE</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignUpSubmit} className="space-y-4 text-xs">
                <p className="text-xs text-neutral-600">
                  Create a new account to track orders and save your customized t-shirts.
                </p>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="e.g. yourname@gmail.com"
                    required
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Mobile Phone Number
                  </label>
                  <input
                    type="tel"
                    value={signUpPhone}
                    onChange={(e) => setSignUpPhone(e.target.value)}
                    placeholder="e.g. +91 9603344954"
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-black font-['Oswald'] font-bold text-xs tracking-wider uppercase rounded-xl transition shadow-md active:scale-95 flex items-center justify-center space-x-2"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>CREATE PROFILE & LOGIN</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* LOGGED IN STANDARD PROFILE VIEW */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Standard Profile Navigation Tabs */}
            <div className="flex border-b border-neutral-200 bg-neutral-50 text-xs font-bold uppercase tracking-wider overflow-x-auto no-scrollbar">
              <button
                onClick={() => setProfileTab('orders')}
                className={`flex-1 py-3 px-3 text-center whitespace-nowrap transition border-b-2 flex items-center justify-center space-x-1.5 ${
                  profileTab === 'orders'
                    ? 'border-amber-500 text-amber-600 bg-white font-black'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Orders</span>
              </button>

              <button
                onClick={() => setProfileTab('track')}
                className={`flex-1 py-3 px-3 text-center whitespace-nowrap transition border-b-2 flex items-center justify-center space-x-1.5 ${
                  profileTab === 'track'
                    ? 'border-amber-500 text-amber-600 bg-white font-black'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Track Order</span>
              </button>

              <button
                onClick={() => setProfileTab('account')}
                className={`flex-1 py-3 px-3 text-center whitespace-nowrap transition border-b-2 flex items-center justify-center space-x-1.5 ${
                  profileTab === 'account'
                    ? 'border-amber-500 text-amber-600 bg-white font-black'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Manage Account</span>
              </button>

              <button
                onClick={() => setProfileTab('wishlist')}
                className={`flex-1 py-3 px-3 text-center whitespace-nowrap transition border-b-2 flex items-center justify-center space-x-1.5 ${
                  profileTab === 'wishlist'
                    ? 'border-amber-500 text-amber-600 bg-white font-black'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>Saved Wishlist ({wishlistCount})</span>
              </button>
            </div>

            {/* Profile Tab Contents */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* TAB 1: ORDERS */}
              {profileTab === 'orders' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                      Recent Orders History
                    </h4>
                    <span className="text-xs font-semibold text-neutral-400">
                      {standardOrders.length} Completed / In-Transit
                    </span>
                  </div>

                  <div className="space-y-3">
                    {standardOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="bg-neutral-50/80 border border-neutral-200 rounded-2xl p-4 space-y-3 hover:border-amber-400/60 transition"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-mono text-xs font-bold text-neutral-900 block">
                              Order #{ord.id}
                            </span>
                            <span className="text-[11px] text-neutral-400">{ord.date}</span>
                          </div>
                          <span
                            className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${ord.statusColor}`}
                          >
                            {ord.status}
                          </span>
                        </div>

                        <div className="text-xs text-neutral-700 bg-white p-3 rounded-xl border border-neutral-100 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-neutral-900">{ord.items}</p>
                            <p className="text-[11px] text-neutral-400">
                              Size: {ord.size} | Color: {ord.color} | Qty: {ord.qty}
                            </p>
                          </div>
                          <span className="font-bold text-neutral-900 text-sm">
                            {settings.currencySymbol || '₹'}
                            {ord.total.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <button
                            onClick={() => {
                              setTrackQuery(ord.id);
                              setProfileTab('track');
                            }}
                            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Track Package</span>
                          </button>

                          <span className="text-[10px] text-neutral-400">GST Paid Invoice Generated</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: TRACK ORDER */}
              {profileTab === 'track' && (
                <div className="space-y-5">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                      Live Courier Tracking
                    </h4>
                    <form onSubmit={handleSearchTrack} className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={trackQuery}
                          onChange={(e) => setTrackQuery(e.target.value)}
                          placeholder="Enter Order ID (e.g. ANFA-96033)"
                          className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase rounded-xl transition"
                      >
                        Track
                      </button>
                    </form>
                  </div>

                  {/* Tracking Detail Card */}
                  <div className="bg-neutral-900 text-white rounded-2xl p-5 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                      <div>
                        <span className="text-[10px] uppercase text-neutral-400 font-bold block">
                          Current Shipment
                        </span>
                        <span className="font-['Oswald'] text-base font-bold text-amber-400">
                          #{trackedOrder.id}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase text-neutral-400 font-bold block">
                          Est. Delivery
                        </span>
                        <span className="text-xs font-bold text-white">{trackedOrder.estDelivery}</span>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-300">{trackedOrder.item}</p>

                    {/* Step Progress Bar */}
                    <div className="pt-2">
                      <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold uppercase">
                        <div className="text-amber-400 flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center mb-1">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                          <span>Placed</span>
                        </div>
                        <div className="text-amber-400 flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center mb-1">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                          <span>Printed</span>
                        </div>
                        <div className="text-amber-400 flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center mb-1 animate-pulse">
                            <Truck className="w-3.5 h-3.5" />
                          </div>
                          <span>In Transit</span>
                        </div>
                        <div className="text-neutral-500 flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full bg-neutral-800 text-neutral-500 flex items-center justify-center mb-1">
                            <span>4</span>
                          </div>
                          <span>Delivered</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-neutral-800 rounded-xl p-3 flex items-center justify-between text-[11px] text-neutral-300">
                      <span>Courier: {trackedOrder.courier}</span>
                      <span className="font-mono text-amber-400">{trackedOrder.trackingNumber}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: MANAGE ACCOUNT & EDIT DETAILS */}
              {profileTab === 'account' && (
                <form onSubmit={handleSaveAccount} className="space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                      Manage Account Details
                    </h4>
                    {saveSuccess && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Saved successfully!</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                      Customer Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          required
                          className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                        Mobile Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                      Saved Delivery Address
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        placeholder="Nilofar complex, main road, cloth market, Bhainsa"
                        className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                      City, State & Pincode
                    </label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      placeholder="Bhainsa, Telangana, 504103"
                      className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-neutral-900 hover:bg-black text-white font-['Oswald'] font-bold text-xs tracking-wider uppercase rounded-xl transition shadow-md active:scale-95 flex items-center space-x-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>SAVE ACCOUNT CHANGES</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 4: WISHLIST OVERVIEW */}
              {profileTab === 'wishlist' && (
                <div className="space-y-4">
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-400/20 text-rose-600 flex items-center justify-center">
                        <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-neutral-900 uppercase">
                          Saved Favorites ({wishlistCount})
                        </h4>
                        <p className="text-[11px] text-neutral-500">
                          {wishlistCount > 0
                            ? 'Your saved custom t-shirts are ready to add to cart'
                            : 'No custom designs saved to your wishlist yet'}
                        </p>
                      </div>
                    </div>

                    {onOpenWishlist && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenWishlist();
                        }}
                        className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase rounded-xl transition shadow-sm"
                      >
                        View Wishlist
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
