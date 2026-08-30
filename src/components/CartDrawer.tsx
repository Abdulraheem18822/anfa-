import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Plus,
  Edit2,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem, StoreSettings, UserProfile, QikinkFulfillmentOrder } from '../types/store';
import { supabase, CartService } from '../lib/supabase';

interface SavedAddress {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  settings: StoreSettings;
  currentUser?: UserProfile | null;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  settings,
  currentUser,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  if (!isOpen) return null;

  // Checkout Step: 'cart' | 'checkout' | 'success'
  const [currentStep, setCurrentStep] = useState<'cart' | 'checkout'>('cart');
  const [orderComplete, setOrderComplete] = useState(false);

  // Promo Code
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');

  // Checkout state
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [placedOrderNumber, setPlacedOrderNumber] = useState('');
  const [placedPaymentMethod, setPlacedPaymentMethod] = useState('');
  const [placedAddressSummary, setPlacedAddressSummary] = useState('');

  // Address Management
  const defaultInitialAddresses: SavedAddress[] = [
    {
      id: 'addr-default-1',
      name: currentUser?.name || localStorage.getItem('ANFA_PROFILE_NAME') || 'Abdul Raheem',
      phone: currentUser?.phone || localStorage.getItem('ANFA_AUTH_PHONE') || '9603344954',
      street: currentUser?.address || 'Nilofar Complex, Main Road, Cloth Market',
      city: currentUser?.city || 'Bhainsa',
      state: 'Telangana',
      pincode: '504103',
      isDefault: true,
    },
  ];

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(() => {
    try {
      const stored = localStorage.getItem('ANFA_SAVED_ADDRESSES');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return defaultInitialAddresses;
  });

  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    () => savedAddresses[0]?.id || 'addr-default-1'
  );
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);

  // New / Edit Address Form Fields
  const [addrName, setAddrName] = useState(currentUser?.name || 'Abdul Raheem');
  const [addrPhone, setAddrPhone] = useState(currentUser?.phone || '9603344954');
  const [addrStreet, setAddrStreet] = useState('Nilofar Complex, Main Road, Cloth Market');
  const [addrCity, setAddrCity] = useState('Bhainsa');
  const [addrState, setAddrState] = useState('Telangana');
  const [addrPincode, setAddrPincode] = useState('504103');

  // Payment Method Selection
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card' | 'upi' | 'netbanking'>('cod');

  // Card payment fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // UPI field
  const [upiId, setUpiId] = useState('');

  // Net banking bank
  const [selectedBank, setSelectedBank] = useState('State Bank of India (SBI)');

  // Sync profile data if currentUser changes
  useEffect(() => {
    if (currentUser?.name && !addrName) {
      setAddrName(currentUser.name);
    }
    if (currentUser?.address && (!addrStreet || addrStreet === '')) {
      setAddrStreet(currentUser.address);
    }
    if (currentUser?.city && (!addrCity || addrCity === '')) {
      setAddrCity(currentUser.city);
    }
    if (currentUser?.phone && (!addrPhone || addrPhone === '')) {
      setAddrPhone(currentUser.phone);
    }
  }, [currentUser]);

  // Persist addresses
  const persistAddresses = (newList: SavedAddress[]) => {
    setSavedAddresses(newList);
    try {
      localStorage.setItem('ANFA_SAVED_ADDRESSES', JSON.stringify(newList));
    } catch {
      // ignore
    }
  };

  const handleSaveNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrName.trim() || !addrStreet.trim() || !addrCity.trim() || !addrPincode.trim()) {
      alert('Please fill in all mandatory address fields.');
      return;
    }

    const newAddr: SavedAddress = {
      id: `addr-${Date.now()}`,
      name: addrName.trim(),
      phone: addrPhone.trim(),
      street: addrStreet.trim(),
      city: addrCity.trim(),
      state: addrState.trim() || 'Telangana',
      pincode: addrPincode.trim(),
      isDefault: false,
    };

    const updated = [newAddr, ...savedAddresses];
    persistAddresses(updated);
    setSelectedAddressId(newAddr.id);
    setIsAddingNewAddress(false);
  };

  const activeSelectedAddress =
    savedAddresses.find((a) => a.id === selectedAddressId) || savedAddresses[0];

  // Price calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const isFreeDelivery = subtotal >= settings.freeDeliveryThreshold;
  const deliveryFee = subtotal > 0 ? (isFreeDelivery ? 0 : 9.99) : 0;
  const total = Math.max(0, subtotal - discountAmount + deliveryFee);
  const remainingForFreeShipping = Math.max(0, settings.freeDeliveryThreshold - subtotal);
  const shippingProgress = Math.min(100, (subtotal / settings.freeDeliveryThreshold) * 100);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    if (
      promoCode.trim().toUpperCase() === 'SUMMER15' ||
      promoCode.trim().toUpperCase() === 'ORITINA15'
    ) {
      setDiscountPercent(15);
      setPromoApplied(true);
    } else if (promoCode.trim().toUpperCase() === 'VIP20') {
      setDiscountPercent(20);
      setPromoApplied(true);
    } else {
      setPromoError('Invalid coupon. Try SUMMER15 or VIP20');
    }
  };

  const handleProceedToPaymentPage = () => {
    if (cartItems.length === 0) return;
    setCheckoutError(null);
    setCurrentStep('checkout');
  };

  const handlePlaceFinalOrder = async () => {
    setIsCheckingOut(true);
    setCheckoutError(null);

    const orderNum = `ANFA-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    setPlacedOrderNumber(orderNum);

    const chosenAddr = activeSelectedAddress || {
      name: addrName || 'Abdul Raheem',
      phone: addrPhone || '9603344954',
      street: addrStreet || 'Nilofar Complex, Main Road, Cloth Market',
      city: addrCity || 'Bhainsa',
      state: addrState || 'Telangana',
      pincode: addrPincode || '504103',
    };

    const customerPhone = chosenAddr.phone || currentUser?.phone || '9603344954';
    const customerName = chosenAddr.name || currentUser?.name || 'Abdul Raheem';
    const customerEmail = currentUser?.email || 'anfa.store01@gmail.com';
    const user_id = currentUser?.id || `cust-${customerPhone}`;

    const shipping_address = {
      name: chosenAddr.name,
      phone: chosenAddr.phone,
      street: chosenAddr.street,
      city: chosenAddr.city,
      state: chosenAddr.state,
      pincode: chosenAddr.pincode,
      country: 'India',
    };

    let paymentDescription = 'Cash on Delivery (COD)';
    if (paymentMethod === 'card') {
      paymentDescription = `Credit/Debit Card (ending in ${cardNumber.slice(-4) || '4242'})`;
    } else if (paymentMethod === 'upi') {
      paymentDescription = `UPI / QR (${upiId || 'Direct UPI App'})`;
    } else if (paymentMethod === 'netbanking') {
      paymentDescription = `Net Banking (${selectedBank})`;
    }

    setPlacedPaymentMethod(paymentDescription);
    setPlacedAddressSummary(`${chosenAddr.street}, ${chosenAddr.city}, ${chosenAddr.state} - ${chosenAddr.pincode}`);

    // Format items array
    const items = cartItems.map((item) => ({
      productId: item.productId,
      name: item.name,
      size: item.size || 'L',
      color: item.shirtColorName || 'Pitch Black',
      quantity: item.quantity,
      price: item.price,
      custom_design_url:
        (item as any).custom_design_url ||
        item.graphicUrl ||
        item.customGraphicUrl ||
        item.image ||
        '',
      printFileUrl:
        (item as any).custom_design_url ||
        item.graphicUrl ||
        item.customGraphicUrl ||
        item.image ||
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
      printPlacement: 'front' as const,
      customNotes: `Direct DTG Pigment Print | Paid via ${paymentDescription}`,
    }));

    try {
      // 1. Insert order into Supabase orders table
      const { data: supabaseOrderData, error: supabaseOrderError } = await supabase
        .from('orders')
        .insert([
          {
            id: `ord-${Date.now()}`,
            order_number: orderNum,
            user_id: user_id,
            customer_id: user_id,
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: customerPhone,
            items: items,
            total_amount: total,
            shipping_address:
              typeof shipping_address === 'string'
                ? shipping_address
                : JSON.stringify(shipping_address),
            payment_method: paymentDescription,
            status: 'pending',
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (supabaseOrderError) {
        console.warn('[Order Checkout] Strict schema insert note, attempting fallback:', supabaseOrderError);
        const { error: fallbackError } = await supabase
          .from('orders')
          .insert([
            {
              user_id: user_id,
              items: items,
              total_amount: total,
              shipping_address:
                typeof shipping_address === 'string'
                  ? shipping_address
                  : JSON.stringify(shipping_address),
              status: 'pending',
            },
          ])
          .select();

        if (fallbackError) {
          console.warn('[Order Checkout] Fallback orders note:', fallbackError);
        }
      }

      // 2. Submit to backend fulfillment cache & email alerts
      try {
        await fetch('/api/orders/fulfillment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber: orderNum,
            customerId: user_id,
            customerName,
            customerEmail,
            customerPhone,
            shippingAddress: shipping_address,
            paymentMethod: paymentDescription,
            items,
            totalAmount: total,
          }),
        });

        await fetch('/api/orders/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber: orderNum,
            orderId: orderNum,
            customerName,
            customerEmail,
            customerPhone,
            shippingAddress: shipping_address,
            paymentMethod: paymentDescription,
            items,
            totalAmount: total,
          }),
        }).catch(() => null);
      } catch (backendNotice) {
        console.warn('[Order Checkout] Backend notification note:', backendNotice);
      }

      // 3. Clear cloud cart
      if (user_id) {
        CartService.clearCart(user_id).catch(() => null);
      }

      setOrderComplete(true);
      confetti({
        particleCount: 130,
        spread: 85,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      console.error('[Order Checkout] Order placement error:', err);
      setCheckoutError(
        err?.message || 'Error processing order. Please check details and try again.'
      );
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleFinishOrder = () => {
    setOrderComplete(false);
    setCurrentStep('cart');
    setCheckoutError(null);
    onClearCart();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col justify-between animate-slide-in">
          {/* Header */}
          <div className="px-5 sm:px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-900 text-white">
            <div className="flex items-center space-x-2.5">
              {currentStep === 'checkout' && !orderComplete ? (
                <button
                  onClick={() => setCurrentStep('cart')}
                  className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-300 hover:text-white transition"
                  title="Back to Bag"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              ) : (
                <div className="w-8 h-8 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              )}
              <div>
                <h2 className="font-['Oswald'] font-bold text-base sm:text-lg tracking-wider uppercase">
                  {orderComplete
                    ? 'ORDER CONFIRMED'
                    : currentStep === 'checkout'
                    ? 'DELIVERY & PAYMENT'
                    : `SHOPPING BAG (${cartItems.reduce((sum, item) => sum + item.quantity, 0)})`}
                </h2>
                <p className="text-[11px] text-neutral-400">
                  {orderComplete
                    ? 'Print-on-Demand DTG Queue'
                    : currentStep === 'checkout'
                    ? 'Select Address & Payment Method'
                    : '100% Cotton Bio-Washed Apparel'}
                </p>
              </div>
            </div>
            <button
              id="cart-drawer-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white transition"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator (in cart & checkout) */}
          {!orderComplete && (
            <div className="px-5 sm:px-6 py-2.5 bg-amber-50 border-b border-amber-100">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-800 mb-1">
                <span className="flex items-center space-x-1">
                  <Truck className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    {isFreeDelivery
                      ? '🎉 FREE Express Delivery Unlocked!'
                      : `Add ${settings.currencySymbol}${remainingForFreeShipping.toFixed(2)} more for FREE Delivery`}
                  </span>
                </span>
                <span className="text-[11px] text-amber-700 font-bold">
                  {Math.round(shippingProgress)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-amber-200/70 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 rounded-full"
                  style={{ width: `${shippingProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* VIEW 3: ORDER COMPLETED SCREEN                                */}
          {/* ------------------------------------------------------------- */}
          {orderComplete ? (
            <div className="flex-1 p-6 sm:p-8 flex flex-col items-center justify-center text-center overflow-y-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold font-['Montserrat',sans-serif] text-neutral-900">
                Order Received Successfully!
              </h3>
              <p className="text-xs text-neutral-500 mt-2 max-w-xs leading-relaxed">
                Thank you for shopping at {settings.storeName}! Your custom print-on-demand t-shirts have entered the DTG production queue.
              </p>

              <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 my-6 w-full text-left text-xs space-y-2 shadow-xs">
                <div className="flex justify-between text-neutral-600 border-b border-neutral-100 pb-1.5">
                  <span>Order Number:</span>
                  <span className="font-mono font-bold text-neutral-900">
                    #{placedOrderNumber || 'ANFA-ORD-960334'}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-600 border-b border-neutral-100 pb-1.5">
                  <span>Payment Mode:</span>
                  <span className="font-bold text-emerald-700">
                    {placedPaymentMethod || 'Cash on Delivery (COD)'}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-600 border-b border-neutral-100 pb-1.5">
                  <span>Estimated Dispatch:</span>
                  <span className="font-semibold text-neutral-900">24-48 Hours (BlueDart / Delhivery)</span>
                </div>
                <div className="flex flex-col text-neutral-600 pt-0.5">
                  <span className="text-[11px] text-neutral-400 uppercase font-bold">Delivery Address:</span>
                  <span className="font-semibold text-neutral-900 mt-0.5">
                    {placedAddressSummary || 'Nilofar Complex, Main Road, Cloth Market, Bhainsa, Telangana - 504103'}
                  </span>
                </div>
              </div>

              <button
                id="cart-finish-order-btn"
                onClick={handleFinishOrder}
                className="w-full py-3.5 bg-neutral-900 hover:bg-black text-white font-['Oswald'] font-bold text-xs tracking-wider uppercase rounded-xl transition shadow-md active:scale-95"
              >
                CONTINUE SHOPPING
              </button>
            </div>
          ) : currentStep === 'checkout' ? (
            /* ------------------------------------------------------------- */
            /* VIEW 2: DEDICATED PAYMENT & ADDRESS CHECKOUT PAGE             */
            /* ------------------------------------------------------------- */
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* SECTION 1: DELIVERY ADDRESS */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                      1. Delivery Address
                    </h3>
                  </div>
                  {!isAddingNewAddress && (
                    <button
                      type="button"
                      onClick={() => setIsAddingNewAddress(true)}
                      className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1 hover:underline"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Add / Change Address</span>
                    </button>
                  )}
                </div>

                {/* If User is Adding / Changing Address Form */}
                {isAddingNewAddress ? (
                  <form
                    onSubmit={handleSaveNewAddress}
                    className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-3 animate-fade-in"
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-amber-200/60">
                      <span className="text-xs font-bold text-amber-900">Add New Delivery Address</span>
                      <button
                        type="button"
                        onClick={() => setIsAddingNewAddress(false)}
                        className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-900"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-700 uppercase">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={addrName}
                          onChange={(e) => setAddrName(e.target.value)}
                          placeholder="e.g. Abdul Raheem"
                          className="w-full text-xs font-semibold p-2 border border-neutral-300 rounded-lg focus:border-amber-500 focus:outline-none bg-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-700 uppercase">
                          Mobile Number *
                        </label>
                        <input
                          type="tel"
                          maxLength={10}
                          value={addrPhone}
                          onChange={(e) => setAddrPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="10-digit mobile"
                          className="w-full text-xs font-semibold p-2 border border-neutral-300 rounded-lg focus:border-amber-500 focus:outline-none bg-white"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-neutral-700 uppercase">
                        Flat / House / Street / Area *
                      </label>
                      <input
                        type="text"
                        value={addrStreet}
                        onChange={(e) => setAddrStreet(e.target.value)}
                        placeholder="e.g. Nilofar Complex, Main Road, Cloth Market"
                        className="w-full text-xs font-semibold p-2 border border-neutral-300 rounded-lg focus:border-amber-500 focus:outline-none bg-white"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-700 uppercase">
                          City / Town *
                        </label>
                        <input
                          type="text"
                          value={addrCity}
                          onChange={(e) => setAddrCity(e.target.value)}
                          placeholder="Bhainsa"
                          className="w-full text-xs font-semibold p-2 border border-neutral-300 rounded-lg focus:border-amber-500 focus:outline-none bg-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-700 uppercase">
                          State *
                        </label>
                        <input
                          type="text"
                          value={addrState}
                          onChange={(e) => setAddrState(e.target.value)}
                          placeholder="Telangana"
                          className="w-full text-xs font-semibold p-2 border border-neutral-300 rounded-lg focus:border-amber-500 focus:outline-none bg-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-700 uppercase">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={addrPincode}
                          onChange={(e) => setAddrPincode(e.target.value.replace(/\D/g, ''))}
                          placeholder="504103"
                          className="w-full text-xs font-semibold p-2 border border-neutral-300 rounded-lg focus:border-amber-500 focus:outline-none bg-white"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase rounded-lg shadow-sm transition"
                    >
                      Use & Save This Address
                    </button>
                  </form>
                ) : (
                  /* Saved Address Selection Cards */
                  <div className="space-y-2">
                    {savedAddresses.map((addr) => {
                      const isSelected = addr.id === selectedAddressId;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start justify-between ${
                            isSelected
                              ? 'bg-amber-50/80 border-amber-400 shadow-sm ring-1 ring-amber-400'
                              : 'bg-neutral-50/60 border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div
                              className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'border-amber-500 bg-amber-500 text-white'
                                  : 'border-neutral-400 bg-white'
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <div className="text-xs">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-neutral-900">{addr.name}</span>
                                <span className="text-[10px] text-neutral-500 bg-neutral-200 px-1.5 py-0.5 rounded font-mono">
                                  +91 {addr.phone}
                                </span>
                              </div>
                              <p className="text-neutral-600 mt-1 leading-relaxed">
                                {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                              </p>
                              {isSelected && (
                                <span className="inline-block mt-1 text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                                  ✓ Deliver to this address
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAddrName(addr.name);
                              setAddrPhone(addr.phone);
                              setAddrStreet(addr.street);
                              setAddrCity(addr.city);
                              setAddrState(addr.state);
                              setAddrPincode(addr.pincode);
                              setIsAddingNewAddress(true);
                            }}
                            className="p-1 text-neutral-400 hover:text-neutral-800"
                            title="Edit Address"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION 2: PAYMENT METHOD SELECTION */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                    2. Select Payment Method
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {/* Option 1: Cash on Delivery (COD) */}
                  <div
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start space-x-3 ${
                      paymentMethod === 'cod'
                        ? 'bg-amber-50/80 border-amber-400 shadow-sm ring-1 ring-amber-400'
                        : 'bg-white border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                        paymentMethod === 'cod'
                          ? 'border-amber-500 bg-amber-500 text-white'
                          : 'border-neutral-400 bg-white'
                      }`}
                    >
                      {paymentMethod === 'cod' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-900 flex items-center space-x-1.5">
                          <Banknote className="w-4 h-4 text-emerald-600" />
                          <span>Cash on Delivery (COD)</span>
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          Pay at Doorstep
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        Pay cash directly to the delivery courier upon doorstep package arrival in Bhainsa.
                      </p>
                    </div>
                  </div>

                  {/* Option 2: Credit / Debit Card */}
                  <div
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'bg-amber-50/80 border-amber-400 shadow-sm ring-1 ring-amber-400'
                        : 'bg-white border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                          paymentMethod === 'card'
                            ? 'border-amber-500 bg-amber-500 text-white'
                            : 'border-neutral-400 bg-white'
                        }`}
                      >
                        {paymentMethod === 'card' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-900 flex items-center space-x-1.5">
                            <CreditCard className="w-4 h-4 text-neutral-800" />
                            <span>Credit / Debit Card</span>
                          </span>
                          <span className="text-[10px] text-neutral-500 font-semibold">
                            Visa / MasterCard / RuPay
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-1">
                          Safe & instant 256-bit encrypted card checkout.
                        </p>

                        {/* Expandable Card Form */}
                        {paymentMethod === 'card' && (
                          <div
                            className="mt-3 pt-3 border-t border-amber-200/70 space-y-2.5 animate-fade-in"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div>
                              <label className="block text-[10px] font-bold text-neutral-700 uppercase">
                                Card Number
                              </label>
                              <input
                                type="text"
                                maxLength={19}
                                value={cardNumber}
                                onChange={(e) => {
                                  const v = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                                  setCardNumber(v);
                                }}
                                placeholder="4532 •••• •••• 8892"
                                className="w-full text-xs font-mono font-bold p-2 border border-neutral-300 rounded-lg focus:border-amber-500 focus:outline-none bg-white"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-neutral-700 uppercase">
                                  Expiry Date
                                </label>
                                <input
                                  type="text"
                                  maxLength={5}
                                  value={cardExpiry}
                                  onChange={(e) => {
                                    let v = e.target.value.replace(/\D/g, '');
                                    if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2, 4)}`;
                                    setCardExpiry(v);
                                  }}
                                  placeholder="MM/YY"
                                  className="w-full text-xs font-mono font-bold p-2 border border-neutral-300 rounded-lg focus:border-amber-500 focus:outline-none bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-neutral-700 uppercase">
                                  CVV
                                </label>
                                <input
                                  type="password"
                                  maxLength={4}
                                  value={cardCvv}
                                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                                  placeholder="•••"
                                  className="w-full text-xs font-mono font-bold p-2 border border-neutral-300 rounded-lg focus:border-amber-500 focus:outline-none bg-white"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Option 3: UPI / QR Code */}
                  <div
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                      paymentMethod === 'upi'
                        ? 'bg-amber-50/80 border-amber-400 shadow-sm ring-1 ring-amber-400'
                        : 'bg-white border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                          paymentMethod === 'upi'
                            ? 'border-amber-500 bg-amber-500 text-white'
                            : 'border-neutral-400 bg-white'
                        }`}
                      >
                        {paymentMethod === 'upi' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-900 flex items-center space-x-1.5">
                            <Smartphone className="w-4 h-4 text-indigo-600" />
                            <span>UPI (GPay / PhonePe / Paytm)</span>
                          </span>
                          <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
                            Instant QR
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-1">
                          Scan and pay with any UPI app on your smartphone.
                        </p>

                        {paymentMethod === 'upi' && (
                          <div
                            className="mt-3 pt-3 border-t border-amber-200/70 space-y-2 animate-fade-in"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <label className="block text-[10px] font-bold text-neutral-700 uppercase">
                              Enter UPI ID / VPA
                            </label>
                            <input
                              type="text"
                              value={upiId}
                              onChange={(e) => setUpiId(e.target.value)}
                              placeholder="e.g. mobile@upi or username@oksbi"
                              className="w-full text-xs font-semibold p-2 border border-neutral-300 rounded-lg focus:border-amber-500 focus:outline-none bg-white"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Option 4: Net Banking */}
                  <div
                    onClick={() => setPaymentMethod('netbanking')}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                      paymentMethod === 'netbanking'
                        ? 'bg-amber-50/80 border-amber-400 shadow-sm ring-1 ring-amber-400'
                        : 'bg-white border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                          paymentMethod === 'netbanking'
                            ? 'border-amber-500 bg-amber-500 text-white'
                            : 'border-neutral-400 bg-white'
                        }`}
                      >
                        {paymentMethod === 'netbanking' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-900 flex items-center space-x-1.5">
                            <Building2 className="w-4 h-4 text-neutral-700" />
                            <span>Net Banking</span>
                          </span>
                          <span className="text-[10px] text-neutral-500 font-semibold">
                            All Indian Banks
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-1">
                          Direct bank transfer via secure internet banking.
                        </p>

                        {paymentMethod === 'netbanking' && (
                          <div
                            className="mt-3 pt-3 border-t border-amber-200/70 space-y-2 animate-fade-in"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <label className="block text-[10px] font-bold text-neutral-700 uppercase">
                              Select Your Bank
                            </label>
                            <select
                              value={selectedBank}
                              onChange={(e) => setSelectedBank(e.target.value)}
                              className="w-full text-xs font-semibold p-2 border border-neutral-300 rounded-lg focus:border-amber-500 focus:outline-none bg-white"
                            >
                              <option value="State Bank of India (SBI)">State Bank of India (SBI)</option>
                              <option value="HDFC Bank">HDFC Bank</option>
                              <option value="ICICI Bank">ICICI Bank</option>
                              <option value="Axis Bank">Axis Bank</option>
                              <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                              <option value="Punjab National Bank">Punjab National Bank</option>
                              <option value="Bank of Baroda">Bank of Baroda</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Error Alert */}
              {checkoutError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-xs text-rose-700 font-medium animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Order Failed</p>
                    <p className="text-[11px] text-rose-600 mt-0.5">{checkoutError}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ------------------------------------------------------------- */
            /* VIEW 1: CART ITEM LIST & PROMO                                */
            /* ------------------------------------------------------------- */
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-neutral-400 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-neutral-300" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-600">Your bag is empty</p>
                  <p className="text-xs text-neutral-400 max-w-xs">
                    Click any custom t-shirt in the store to instantly add it to your bag!
                  </p>
                  <div className="pt-2 flex flex-col space-y-2 w-full max-w-xs">
                    <button
                      onClick={onClose}
                      className="py-2.5 px-4 bg-neutral-900 hover:bg-black text-white font-semibold text-xs rounded-xl transition"
                    >
                      Explore T-Shirts
                    </button>
                  </div>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3.5 p-3 rounded-2xl border border-neutral-100 bg-neutral-50/60 hover:bg-neutral-50 transition"
                  >
                    {/* Shirt Color swatch */}
                    <div
                      className="w-16 h-16 rounded-xl border border-neutral-200 flex-shrink-0 flex items-center justify-center text-[9px] font-bold shadow-inner"
                      style={{ backgroundColor: item.shirtColor }}
                    >
                      <span
                        className={
                          item.shirtColor === '#FFFFFF' || item.shirtColor === '#F8F9FA'
                            ? 'text-neutral-800'
                            : 'text-white'
                        }
                      >
                        POD
                      </span>
                    </div>

                    {/* Item details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-neutral-900 truncate font-['Montserrat',sans-serif]">
                        {item.name}
                      </h4>
                      <div className="flex items-center space-x-2 text-[11px] text-neutral-500 mt-0.5">
                        <span>
                          Color: <strong className="text-neutral-700">{item.shirtColorName}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Size: <strong className="text-neutral-700">{item.size}</strong>
                        </span>
                      </div>
                      {item.customText && (
                        <p className="text-[10px] text-amber-600 italic truncate">
                          &quot;{item.customText}&quot;
                        </p>
                      )}
                      <p className="text-xs font-bold text-neutral-900 mt-1">
                        {settings.currencySymbol}
                        {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    {/* Quantity Controls & Delete */}
                    <div className="flex flex-col items-end space-y-2">
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-neutral-400 hover:text-rose-500 transition p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex items-center border border-neutral-300 bg-white rounded-lg overflow-hidden shadow-xs">
                        <button
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="px-2 py-0.5 text-xs text-neutral-600 hover:bg-neutral-100"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-bold text-neutral-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="px-2 py-0.5 text-xs text-neutral-600 hover:bg-neutral-100"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* FOOTER: BILLING CALCULATIONS & CALL-TO-ACTION                 */}
          {/* ------------------------------------------------------------- */}
          {!orderComplete && cartItems.length > 0 && (
            <div className="p-5 sm:p-6 border-t border-neutral-200 bg-white space-y-3.5 shadow-lg">
              {/* Promo code only shown in cart step */}
              {currentStep === 'cart' && (
                <>
                  <form onSubmit={handleApplyPromo} className="flex space-x-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Coupon (e.g. SUMMER15)"
                      className="flex-1 text-xs border border-neutral-300 rounded-xl px-3 py-2 uppercase tracking-wider focus:outline-none focus:border-neutral-900"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl uppercase tracking-wider transition"
                    >
                      APPLY
                    </button>
                  </form>
                  {promoApplied && (
                    <p className="text-[11px] text-emerald-600 font-semibold">
                      ✓ Coupon Applied: {discountPercent}% discount
                    </p>
                  )}
                  {promoError && (
                    <p className="text-[11px] text-rose-500 font-semibold">{promoError}</p>
                  )}
                </>
              )}

              {/* Price Calculations */}
              <div className="space-y-1.5 text-xs text-neutral-600 border-t border-neutral-100 pt-2.5">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-neutral-900">
                    {settings.currencySymbol}
                    {subtotal.toFixed(2)}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount ({discountPercent}%)</span>
                    <span>
                      -{settings.currencySymbol}
                      {discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span>
                    {isFreeDelivery ? (
                      <strong className="text-emerald-600">FREE</strong>
                    ) : (
                      `${settings.currencySymbol}${deliveryFee.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-neutral-900 pt-2 border-t border-neutral-100">
                  <span>Total Amount</span>
                  <span className="text-base text-amber-600 font-['Oswald']">
                    {settings.currencySymbol}
                    {total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {currentStep === 'cart' ? (
                <button
                  id="cart-proceed-checkout-btn"
                  onClick={handleProceedToPaymentPage}
                  className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-black font-['Oswald'] font-bold text-sm tracking-wider uppercase rounded-xl flex items-center justify-center space-x-2 transition shadow-md active:scale-95"
                >
                  <span>PROCEED TO CHECKOUT & PAYMENT</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  id="cart-place-order-btn"
                  onClick={handlePlaceFinalOrder}
                  disabled={isCheckingOut}
                  className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-black font-['Oswald'] font-bold text-sm tracking-wider uppercase rounded-xl flex items-center justify-center space-x-2 transition shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isCheckingOut ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>
                        PLACE ORDER ({settings.currencySymbol}
                        {total.toFixed(2)})
                      </span>
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}

              <div className="flex items-center justify-center space-x-1.5 text-[11px] text-neutral-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>256-Bit SSL Encrypted • 100% Genuine DTG Apparel</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
