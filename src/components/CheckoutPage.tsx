import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Truck,
  CheckCircle2,
  AlertCircle,
  MapPin,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  Check,
  Lock,
  Package,
  RotateCcw,
  Sparkles,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem, StoreSettings, UserProfile, QikinkFulfillmentOrder } from '../types/store';
import { supabase } from '../lib/supabase';
import { TShirtMockup } from './TShirtMockup';

interface CheckoutPageProps {
  cartItems: CartItem[];
  settings: StoreSettings;
  currentUser?: UserProfile | null;
  onBack: () => void;
  onOrderSuccess: (order: QikinkFulfillmentOrder) => void;
  onClearCart: () => void;
}

interface SavedAddress {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  cartItems,
  settings,
  currentUser,
  onBack,
  onOrderSuccess,
  onClearCart,
}) => {
  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(() => {
    try {
      const raw = localStorage.getItem('ANFA_SAVED_ADDRESSES');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  const [selectedAddressId, setSelectedAddressId] = useState<string>(() => {
    try {
      const raw = localStorage.getItem('ANFA_SAVED_ADDRESSES');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0].id;
        }
      }
    } catch {}
    return 'new';
  });

  const [isAddingNewAddress, setIsAddingNewAddress] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('ANFA_SAVED_ADDRESSES');
      if (raw) {
        const parsed = JSON.parse(raw);
        return !Array.isArray(parsed) || parsed.length === 0;
      }
    } catch {}
    return true;
  });

  // Address Form State - ALL KEPT BLANK BY DEFAULT as requested (no hardcoded defaults)
  const [fullName, setFullName] = useState<string>('');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [streetAddress, setStreetAddress] = useState<string>('');
  const [villageTownCity, setVillageTownCity] = useState<string>('');
  const [stateName, setStateName] = useState<string>('');
  const [pincode, setPincode] = useState<string>('');
  const [landmark, setLandmark] = useState<string>('');

  // Payment Method Selection
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi' | 'card' | 'netbanking'>('cod');

  // Card Payment fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // UPI field
  const [upiId, setUpiId] = useState('');

  // Net banking bank
  const [selectedBank, setSelectedBank] = useState('State Bank of India (SBI)');

  // Promo code
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');

  // Form & Process Status
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<QikinkFulfillmentOrder | null>(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Calculate pricing
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountAmount = promoApplied ? (subtotal * discountPercent) / 100 : 0;
  const shippingFee = 0; // Free express delivery
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleApplyPromo = () => {
    setPromoError('');
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      setPromoError('Please enter a coupon code');
      return;
    }

    if (code === 'ANFA10' || code === 'FIRST10') {
      setDiscountPercent(10);
      setPromoApplied(true);
    } else if (code === 'ANFA20' || code === 'FESTIVE20' || code === 'BHAINSA20') {
      setDiscountPercent(20);
      setPromoApplied(true);
    } else if (code === 'FREESHIP' || code === 'POD50') {
      setDiscountPercent(15);
      setPromoApplied(true);
    } else {
      setPromoError('Invalid coupon code. Try "ANFA10" or "BHAINSA20"');
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    let activeFullName = fullName.trim();
    let activePhone = mobileNumber.replace(/\D/g, '');
    let activeStreet = streetAddress.trim();
    let activeCity = villageTownCity.trim();
    let activeState = stateName.trim();
    let activePincode = pincode.replace(/\D/g, '');
    let activeLandmark = landmark.trim();

    // If an existing saved address was selected and user is not adding a new one
    if (!isAddingNewAddress && selectedAddressId !== 'new') {
      const found = savedAddresses.find((a) => a.id === selectedAddressId);
      if (found) {
        activeFullName = found.name;
        activePhone = found.phone.replace(/\D/g, '');
        activeStreet = found.street;
        activeCity = found.city;
        activeState = found.state;
        activePincode = found.pincode.replace(/\D/g, '');
        activeLandmark = found.landmark || '';
      }
    }

    // Strict Validation for delivery address
    if (!activeFullName) {
      setErrorMessage('Please enter the recipient Full Name.');
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }
    if (!activePhone || activePhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit Mobile Number for order & courier updates.');
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }
    if (!activeStreet) {
      setErrorMessage('Please enter your Street / House No. / Flat / Building Address.');
      window.scrollTo({ top: 180, behavior: 'smooth' });
      return;
    }
    if (!activeCity) {
      setErrorMessage('Please enter your Village / Town / City Name.');
      window.scrollTo({ top: 240, behavior: 'smooth' });
      return;
    }
    if (!activeState) {
      setErrorMessage('Please enter your State Name (e.g. Telangana, Maharashtra).');
      window.scrollTo({ top: 280, behavior: 'smooth' });
      return;
    }
    if (!activePincode || activePincode.length < 6) {
      setErrorMessage('Please enter a valid 6-digit Pincode (Postal Code).');
      window.scrollTo({ top: 320, behavior: 'smooth' });
      return;
    }

    // Payment validation
    if (paymentMethod === 'card') {
      if (!cardNumber.trim() || cardNumber.replace(/\s/g, '').length < 15) {
        setErrorMessage('Please enter a valid 16-digit Card Number.');
        return;
      }
      if (!cardExpiry.trim() || !cardExpiry.includes('/')) {
        setErrorMessage('Please enter a valid Card Expiry Date (MM/YY).');
        return;
      }
      if (!cardCvv.trim() || cardCvv.length < 3) {
        setErrorMessage('Please enter the 3-digit CVV from the back of your card.');
        return;
      }
    } else if (paymentMethod === 'upi') {
      if (!upiId.trim() || !upiId.includes('@')) {
        setErrorMessage('Please enter a valid UPI ID (e.g. name@okhdfcbank or 9876543210@paytm).');
        return;
      }
    }

    if (cartItems.length === 0) {
      setErrorMessage('Your shopping cart is empty. Please add items first.');
      return;
    }

    setIsPlacingOrder(true);

    try {
      const generatedOrderNumber = `ANFA-${Math.floor(100000 + Math.random() * 900000)}`;
      const generatedTrackingNumber = `DEL-${Math.floor(100000000 + Math.random() * 900000000)}`;

      // Save or update address in saved addresses list
      const newSavedAddr: SavedAddress = {
        id: `addr-${Date.now()}`,
        name: activeFullName,
        phone: activePhone,
        street: activeStreet,
        city: activeCity,
        state: activeState,
        pincode: activePincode,
        landmark: activeLandmark,
      };

      const updatedSaved = [
        newSavedAddr,
        ...savedAddresses.filter(
          (a) =>
            a.street.toLowerCase() !== activeStreet.toLowerCase() ||
            a.pincode !== activePincode
        ),
      ].slice(0, 5);

      setSavedAddresses(updatedSaved);
      try {
        localStorage.setItem('ANFA_SAVED_ADDRESSES', JSON.stringify(updatedSaved));
      } catch (err) {
        console.warn('LocalStorage address save notice:', err);
      }

      const orderPayload: QikinkFulfillmentOrder = {
        id: `order-${Date.now()}`,
        orderNumber: generatedOrderNumber,
        customerId: currentUser?.id || `cust-${activePhone}`,
        customerName: activeFullName,
        customerEmail: currentUser?.email || `${activePhone}@anfaprintwear.in`,
        customerPhone: activePhone,
        shippingAddress: {
          street: activeLandmark ? `${activeStreet}, Near ${activeLandmark}` : activeStreet,
          city: activeCity,
          state: activeState,
          pincode: activePincode,
          country: 'India',
        },
        items: cartItems.map((item) => ({
          productId: item.productId,
          sku: item.sku || `ANFA-${item.productId}`,
          name: item.name,
          size: item.size,
          color: item.shirtColorName || 'Pitch Black',
          quantity: item.quantity,
          price: item.price,
          printFileUrl: item.graphicUrl || item.customGraphicUrl,
          printPlacement: item.printPlacement || 'Front Chest',
          customNotes: item.customText ? `Custom Text: "${item.customText}"` : 'Direct DTG Pigment High Density',
        })),
        totalAmount: finalTotal,
        qikinkStatus: 'pending',
        trackingNumber: generatedTrackingNumber,
        courierName: 'Delhivery Surface Express',
        createdAt: new Date().toISOString(),
      };

      // 1. Dispatch Order to Backend Server Fulfillment Endpoint
      try {
        await fetch('/api/orders/fulfillment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload),
        });
      } catch (err) {
        console.warn('Backend order fulfillment notice:', err);
      }

      // 2. Insert into Supabase Orders table
      try {
        await supabase.from('orders').insert([
          {
            id: orderPayload.id,
            order_number: orderPayload.orderNumber,
            customer_name: orderPayload.customerName,
            customer_email: orderPayload.customerEmail,
            customer_phone: orderPayload.customerPhone,
            shipping_address: orderPayload.shippingAddress,
            items: orderPayload.items,
            total_amount: orderPayload.totalAmount,
            status: orderPayload.qikinkStatus,
            tracking_number: orderPayload.trackingNumber,
            courier_name: orderPayload.courierName,
            payment_method: paymentMethod.toUpperCase(),
            created_at: orderPayload.createdAt,
          },
        ]);
      } catch (sbErr) {
        console.warn('Supabase orders table notice:', sbErr);
      }

      // 3. Dispatch Order Notification Alert to Store Admin Email
      try {
        await fetch('/api/orders/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber: orderPayload.orderNumber,
            customerName: orderPayload.customerName,
            customerEmail: orderPayload.customerEmail,
            customerPhone: orderPayload.customerPhone,
            shippingAddress: `${orderPayload.shippingAddress.street}, ${orderPayload.shippingAddress.city}, ${orderPayload.shippingAddress.state} - ${orderPayload.shippingAddress.pincode}`,
            totalAmount: orderPayload.totalAmount,
            items: orderPayload.items,
          }),
        });
      } catch (notifyErr) {
        console.warn('Order notification notice:', notifyErr);
      }

      // 4. Update Profile Address if logged in
      if (currentUser?.phone) {
        try {
          await fetch('/api/customer/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: activePhone,
              name: activeFullName,
              address: activeStreet,
              city: activeCity,
              state: activeState,
              pincode: activePincode,
            }),
          });
        } catch {
          // ignore
        }
      }

      // Trigger Confetti Celebration
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
      });

      // Clear the cart
      onClearCart();
      onOrderSuccess(orderPayload);
      setConfirmedOrder(orderPayload);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMessage(err?.message || 'An error occurred while placing the order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // =========================================================================
  // ORDER CONFIRMATION / SUCCESS VIEW
  // =========================================================================
  if (confirmedOrder) {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto w-full bg-white rounded-3xl border border-neutral-200/90 shadow-xl overflow-hidden p-6 sm:p-10">
          {/* Success Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 stroke-[2.5]" />
          </div>

          <div className="text-center space-y-2 mb-8">
            <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-black uppercase tracking-wider">
              Order Confirmed & Sent to DTG Line
            </span>
            <h1 className="font-['Oswald'] text-2xl sm:text-4xl font-bold uppercase tracking-tight text-neutral-900">
              Thank You, {confirmedOrder.customerName}!
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto">
              Your order has been registered and is now in line for high-density bio-cotton DTG printing.
            </p>
          </div>

          {/* Order Details Card */}
          <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-5 sm:p-6 space-y-5 mb-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-5 border-b border-neutral-200 text-xs">
              <div>
                <span className="block text-neutral-400 font-bold uppercase text-[10px]">Order Number</span>
                <span className="font-mono font-bold text-neutral-900 text-sm sm:text-base">
                  #{confirmedOrder.orderNumber}
                </span>
              </div>
              <div>
                <span className="block text-neutral-400 font-bold uppercase text-[10px]">Estimated Delivery</span>
                <span className="font-bold text-emerald-600 text-sm">3-5 Business Days</span>
              </div>
              <div>
                <span className="block text-neutral-400 font-bold uppercase text-[10px]">Payment Method</span>
                <span className="font-bold text-neutral-900 text-sm uppercase">
                  {paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="block text-neutral-400 font-bold uppercase text-[10px]">Total Amount</span>
                <span className="font-['Oswald'] font-black text-amber-600 text-base">
                  {settings.currencySymbol}
                  {confirmedOrder.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Shipping Address Summary */}
            <div className="space-y-1 text-xs">
              <span className="text-[10px] font-bold uppercase text-neutral-400 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>Delivery Address</span>
              </span>
              <p className="font-semibold text-neutral-900">
                {confirmedOrder.customerName} ({confirmedOrder.customerPhone})
              </p>
              <p className="text-neutral-700">
                {confirmedOrder.shippingAddress.street}, {confirmedOrder.shippingAddress.city},{' '}
                {confirmedOrder.shippingAddress.state} - {confirmedOrder.shippingAddress.pincode}
              </p>
            </div>

            {/* Items Summary */}
            <div className="space-y-3 pt-3 border-t border-neutral-200">
              <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                Ordered Items ({confirmedOrder.items.length})
              </span>
              {confirmedOrder.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center font-bold text-[10px]">
                      {item.quantity}×
                    </span>
                    <span className="font-semibold text-neutral-900">{item.name}</span>
                    <span className="text-neutral-500">
                      ({item.size} • {item.color})
                    </span>
                  </div>
                  <span className="font-bold text-neutral-900">
                    {settings.currencySymbol}
                    {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => {
                const message = encodeURIComponent(
                  `Hello ANFA Support! I placed order #${confirmedOrder.orderNumber} for ₹${confirmedOrder.totalAmount}. Please share DTG printing status.`
                );
                window.open(`https://wa.me/919603344954?text=${message}`, '_blank');
              }}
              className="w-full sm:flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-['Oswald'] font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 shadow-md transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Track on WhatsApp (+91 9603344954)</span>
            </button>

            <button
              onClick={onBack}
              className="w-full sm:flex-1 py-3.5 bg-neutral-900 hover:bg-black text-amber-400 font-['Oswald'] font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 shadow-md transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All T-Shirts</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // FULL PAGE CHECKOUT FORM VIEW
  // =========================================================================
  return (
    <div className="min-h-screen bg-neutral-100/70 text-neutral-900 flex flex-col selection:bg-amber-400 selection:text-black">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            id="checkout-back-btn"
            onClick={onBack}
            className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-700 hover:text-black transition group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Store</span>
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-amber-400 text-black rounded-lg flex items-center justify-center font-['Oswald'] font-black text-sm">
              A
            </div>
            <span className="font-['Oswald'] font-bold text-sm sm:text-base uppercase tracking-wider text-neutral-900">
              ANFA PRINT WEAR <span className="text-amber-600">• SECURE CHECKOUT</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center space-x-2 text-xs text-neutral-500">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-Bit SSL Encrypted</span>
          </div>
        </div>
      </header>

      {/* Main Checkout Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 w-full">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center space-x-3 animate-fade-in shadow-xs">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ============================================================= */}
          {/* LEFT COLUMN: DELIVERY ADDRESS & PAYMENT (8 Cols)              */}
          {/* ============================================================= */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. DELIVERY ADDRESS FORM */}
            <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-2xl bg-amber-400/20 text-amber-700 flex items-center justify-center font-['Oswald'] font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h2 className="font-['Oswald'] text-lg sm:text-xl font-bold uppercase tracking-wider text-neutral-900">
                      Delivery Address
                    </h2>
                    <p className="text-xs text-neutral-500">
                      Enter the recipient and location details for doorstep courier delivery
                    </p>
                  </div>
                </div>
                <MapPin className="w-5 h-5 text-neutral-400" />
              </div>

              {/* Saved Addresses List (if any exist) */}
              {savedAddresses.length > 0 && !isAddingNewAddress && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                      Select Delivery Address
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNewAddress(true);
                        setSelectedAddressId('new');
                        setFullName('');
                        setMobileNumber('');
                        setStreetAddress('');
                        setVillageTownCity('');
                        setStateName('');
                        setPincode('');
                        setLandmark('');
                      }}
                      className="text-xs font-bold text-amber-600 hover:text-amber-700 underline flex items-center space-x-1 transition"
                    >
                      <span>+ Add New Address</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start space-x-3 ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50/40 shadow-xs'
                              : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50/40'
                          }`}
                        >
                          <input
                            type="radio"
                            name="selected_saved_address"
                            checked={isSelected}
                            onChange={() => setSelectedAddressId(addr.id)}
                            className="mt-1 text-amber-600 focus:ring-amber-500"
                          />
                          <div className="flex-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-neutral-900 text-sm">
                                {addr.name}
                              </span>
                              <span className="font-mono text-neutral-600 font-semibold">
                                +91 {addr.phone}
                              </span>
                            </div>
                            <p className="text-neutral-600 mt-1">
                              {addr.street}
                              {addr.landmark ? `, Near ${addr.landmark}` : ''}
                            </p>
                            <p className="text-neutral-500">
                              {addr.city}, {addr.state} - <span className="font-mono font-semibold">{addr.pincode}</span>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add New Address Form */}
              {(isAddingNewAddress || savedAddresses.length === 0) && (
                <div className="space-y-4 pt-1">
                  {savedAddresses.length > 0 && (
                    <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-3 mb-2">
                      <span className="text-xs font-semibold text-amber-900">
                        Adding a new delivery address
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNewAddress(false);
                          if (savedAddresses.length > 0) {
                            setSelectedAddressId(savedAddresses[0].id);
                          }
                        }}
                        className="text-xs font-bold text-neutral-700 hover:text-black underline"
                      >
                        Cancel / Choose from saved addresses
                      </button>
                    </div>
                  )}

                  {/* Full Name & Phone Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                        Full Name (Recipient Name) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="checkout-fullname-input"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Enter full name"
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-hidden focus:border-amber-500 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                        10-Digit Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-500">
                          +91
                        </span>
                        <input
                          id="checkout-phone-input"
                          type="tel"
                          maxLength={10}
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                          placeholder="e.g. 9876543210 (For courier SMS & OTP)"
                          className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-hidden focus:border-amber-500 focus:bg-white transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* House / Flat / Street / Area */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                      House No. / Flat / Building / Street / Area <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="checkout-street-input"
                      type="text"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="e.g. Flat/House No., Building Name, Street Name, Area"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-hidden focus:border-amber-500 focus:bg-white transition"
                    />
                  </div>

                  {/* Landmark */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Landmark / Nearby Location (Optional)
                    </label>
                    <input
                      id="checkout-landmark-input"
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Near Gandhi Chowk, Opposite Nilofar Complex"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-hidden focus:border-amber-500 focus:bg-white transition"
                    />
                  </div>

                  {/* Village / Town / City, State, Pincode */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                        Village / Town / City <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="checkout-city-input"
                        type="text"
                        value={villageTownCity}
                        onChange={(e) => setVillageTownCity(e.target.value)}
                        placeholder="e.g. Bhainsa / Nirmal / Hyderabad"
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-hidden focus:border-amber-500 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                        State Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="checkout-state-input"
                        type="text"
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        placeholder="e.g. Telangana / Maharashtra"
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-hidden focus:border-amber-500 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                        6-Digit Pincode <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="checkout-pincode-input"
                        type="text"
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 504103"
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 font-mono focus:outline-hidden focus:border-amber-500 focus:bg-white transition"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. PAYMENT METHODS */}
            <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-2xl bg-amber-400/20 text-amber-700 flex items-center justify-center font-['Oswald'] font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h2 className="font-['Oswald'] text-lg sm:text-xl font-bold uppercase tracking-wider text-neutral-900">
                      Payment Method
                    </h2>
                    <p className="text-xs text-neutral-500">
                      Choose your preferred payment mode (Cash on Delivery or Instant Online)
                    </p>
                  </div>
                </div>
                <CreditCard className="w-5 h-5 text-neutral-400" />
              </div>

              {/* Payment Method Selector Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Cash on Delivery */}
                <label
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-4 rounded-2xl border-2 flex items-start space-x-3 cursor-pointer transition ${
                    paymentMethod === 'cod'
                      ? 'border-amber-500 bg-amber-50/40 shadow-xs'
                      : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_choice"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 text-amber-600 focus:ring-amber-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs sm:text-sm text-neutral-900">Cash on Delivery (COD)</span>
                      <Banknote className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Pay cash when courier delivers the t-shirt to your door.
                    </p>
                  </div>
                </label>

                {/* UPI & QR Code */}
                <label
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-4 rounded-2xl border-2 flex items-start space-x-3 cursor-pointer transition ${
                    paymentMethod === 'upi'
                      ? 'border-amber-500 bg-amber-50/40 shadow-xs'
                      : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_choice"
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                    className="mt-1 text-amber-600 focus:ring-amber-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs sm:text-sm text-neutral-900">UPI / QR Code</span>
                      <Smartphone className="w-4 h-4 text-purple-600" />
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Google Pay, PhonePe, Paytm, BHIM, Cred UPI.
                    </p>
                  </div>
                </label>

                {/* Credit / Debit Card */}
                <label
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-2xl border-2 flex items-start space-x-3 cursor-pointer transition ${
                    paymentMethod === 'card'
                      ? 'border-amber-500 bg-amber-50/40 shadow-xs'
                      : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_choice"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="mt-1 text-amber-600 focus:ring-amber-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs sm:text-sm text-neutral-900">Credit / Debit Card</span>
                      <CreditCard className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Visa, MasterCard, RuPay, Diners Club.
                    </p>
                  </div>
                </label>

                {/* Net Banking */}
                <label
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`p-4 rounded-2xl border-2 flex items-start space-x-3 cursor-pointer transition ${
                    paymentMethod === 'netbanking'
                      ? 'border-amber-500 bg-amber-50/40 shadow-xs'
                      : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_choice"
                    checked={paymentMethod === 'netbanking'}
                    onChange={() => setPaymentMethod('netbanking')}
                    className="mt-1 text-amber-600 focus:ring-amber-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs sm:text-sm text-neutral-900">Net Banking</span>
                      <Building2 className="w-4 h-4 text-indigo-600" />
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      All major Indian commercial & retail banks.
                    </p>
                  </div>
                </label>
              </div>

              {/* Dynamic Payment Details Input */}
              {paymentMethod === 'upi' && (
                <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-3 animate-fade-in">
                  <label className="block text-xs font-bold uppercase tracking-wider text-purple-900">
                    Enter Your UPI ID / VPA <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. mobileNumber@ybl, name@okhdfcbank, name@paytm"
                    className="w-full px-4 py-2.5 bg-white border border-purple-300 rounded-xl text-xs sm:text-sm text-neutral-900 focus:outline-hidden focus:border-purple-600"
                  />
                  <p className="text-[11px] text-purple-700">
                    A payment request will be sent to your UPI app for instant approval.
                  </p>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-3 animate-fade-in">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-blue-900 mb-1">
                      Card Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="e.g. 4532 8900 1234 5678"
                      className="w-full px-4 py-2.5 bg-white border border-blue-300 rounded-xl text-xs sm:text-sm font-mono text-neutral-900 focus:outline-hidden focus:border-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-blue-900 mb-1">
                        Expiry Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full px-4 py-2.5 bg-white border border-blue-300 rounded-xl text-xs sm:text-sm font-mono text-neutral-900 focus:outline-hidden focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-blue-900 mb-1">
                        CVV Code <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="•••"
                        className="w-full px-4 py-2.5 bg-white border border-blue-300 rounded-xl text-xs sm:text-sm font-mono text-neutral-900 focus:outline-hidden focus:border-blue-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'netbanking' && (
                <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl space-y-3 animate-fade-in">
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-900">
                    Select Your Bank
                  </label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-indigo-300 rounded-xl text-xs sm:text-sm text-neutral-900 focus:outline-hidden focus:border-indigo-600"
                  >
                    <option>State Bank of India (SBI)</option>
                    <option>HDFC Bank</option>
                    <option>ICICI Bank</option>
                    <option>Axis Bank</option>
                    <option>Kotak Mahindra Bank</option>
                    <option>Punjab National Bank</option>
                    <option>Bank of Baroda</option>
                    <option>Union Bank of India</option>
                    <option>Canara Bank</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* ============================================================= */}
          {/* RIGHT COLUMN: ORDER SUMMARY & CHECKOUT BUTTON (5 Cols)        */}
          {/* ============================================================= */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm p-6 sm:p-8 space-y-5 sticky top-20">
              <h2 className="font-['Oswald'] text-lg sm:text-xl font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-3 flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs font-normal font-sans text-neutral-500">
                  {cartItems.reduce((acc, i) => acc + i.quantity, 0)} Item(s)
                </span>
              </h2>

              {/* Items List */}
              <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 py-2 border-b border-neutral-100 last:border-0">
                    <div className="w-14 h-14 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-center p-1 shrink-0">
                      <TShirtMockup
                        shirtColor={item.shirtColor || '#1E1E24'}
                        graphicType={item.graphicType}
                        graphicUrl={item.graphicUrl || item.customGraphicUrl}
                        className="w-full h-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-neutral-900 truncate">{item.name}</h4>
                      <p className="text-[11px] text-neutral-500">
                        Size: <span className="font-semibold text-neutral-700">{item.size}</span> • Color:{' '}
                        <span className="font-semibold text-neutral-700">{item.shirtColorName || 'Black'}</span>
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        Qty: <span className="font-semibold">{item.quantity}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-neutral-900">
                        {settings.currencySymbol}
                        {(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code Input */}
              <div className="pt-2">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Coupon code (e.g. ANFA10)"
                    disabled={promoApplied}
                    className="flex-1 px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs uppercase tracking-wider text-neutral-900 focus:outline-hidden focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={promoApplied}
                    className="px-4 py-2 bg-neutral-900 hover:bg-black disabled:bg-emerald-600 text-amber-400 disabled:text-white font-['Oswald'] font-bold text-xs uppercase tracking-wider rounded-xl transition"
                  >
                    {promoApplied ? 'Applied ✓' : 'Apply'}
                  </button>
                </div>
                {promoError && <p className="text-[11px] text-rose-600 mt-1">{promoError}</p>}
                {promoApplied && (
                  <p className="text-[11px] text-emerald-600 mt-1 font-semibold">
                    ✓ {discountPercent}% discount applied to your order!
                  </p>
                )}
              </div>

              {/* Price Calculation Breakdown */}
              <div className="space-y-2 pt-3 border-t border-neutral-200 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Bag Subtotal</span>
                  <span>
                    {settings.currencySymbol}
                    {subtotal.toFixed(2)}
                  </span>
                </div>

                {promoApplied && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Coupon Discount ({discountPercent}%)</span>
                    <span>
                      -{settings.currencySymbol}
                      {discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-neutral-600">
                  <span>DTG Pigment Printing</span>
                  <span className="text-emerald-600 font-bold uppercase text-[10px]">Included Free</span>
                </div>

                <div className="flex justify-between text-neutral-600">
                  <span>Express Courier Delivery</span>
                  <span className="text-emerald-600 font-bold uppercase text-[10px]">FREE</span>
                </div>

                <div className="flex justify-between text-neutral-600">
                  <span>Taxes (GST 5%)</span>
                  <span>Included</span>
                </div>

                <div className="flex justify-between text-sm sm:text-base font-bold text-neutral-900 pt-3 border-t border-neutral-200">
                  <span>Total Payable</span>
                  <span className="font-['Oswald'] font-black text-amber-600 text-lg">
                    {settings.currencySymbol}
                    {finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Submit / Place Order CTA Button */}
              <button
                id="place-order-submit-btn"
                type="submit"
                disabled={isPlacingOrder || cartItems.length === 0}
                className="w-full py-4 bg-amber-400 hover:bg-amber-500 disabled:bg-neutral-300 text-black font-['Oswald'] font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isPlacingOrder ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>
                      {paymentMethod === 'cod'
                        ? `CONFIRM CASH ON DELIVERY • ${settings.currencySymbol}${finalTotal.toFixed(2)}`
                        : `PAY NOW • ${settings.currencySymbol}${finalTotal.toFixed(2)}`}
                    </span>
                  </>
                )}
              </button>

              {/* Trust Guarantees */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-neutral-100 text-center text-[10px] text-neutral-500">
                <div>
                  <Truck className="w-3.5 h-3.5 mx-auto text-amber-600 mb-0.5" />
                  <span>3-5 Days Delivery</span>
                </div>
                <div>
                  <ShieldCheck className="w-3.5 h-3.5 mx-auto text-amber-600 mb-0.5" />
                  <span>100% Bio Cotton</span>
                </div>
                <div>
                  <RotateCcw className="w-3.5 h-3.5 mx-auto text-amber-600 mb-0.5" />
                  <span>7 Days Exchange</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
