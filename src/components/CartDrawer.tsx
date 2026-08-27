import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Truck, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem, StoreSettings, UserProfile, QikinkFulfillmentOrder } from '../types/store';
import { supabase, OrderService, CartService } from '../lib/supabase';

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

  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [orderComplete, setOrderComplete] = useState(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState('');

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
    if (promoCode.trim().toUpperCase() === 'SUMMER15' || promoCode.trim().toUpperCase() === 'ORITINA15') {
      setDiscountPercent(15);
      setPromoApplied(true);
    } else if (promoCode.trim().toUpperCase() === 'VIP20') {
      setDiscountPercent(20);
      setPromoApplied(true);
    } else {
      setPromoError('Invalid coupon. Try SUMMER15 or VIP20');
    }
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    setCheckoutError(null);

    const orderNum = `ANFA-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    setPlacedOrderNumber(orderNum);

    const customerPhone = currentUser?.phone || localStorage.getItem('ANFA_AUTH_PHONE') || '9603344954';
    const customerName = currentUser?.name || localStorage.getItem('ANFA_PROFILE_NAME') || `Customer ${customerPhone.slice(-4)}`;
    const customerEmail = currentUser?.email || 'anfa.store01@gmail.com';
    const user_id = currentUser?.id || `cust-${customerPhone}`;

    const shipping_address = {
      street: currentUser?.address || 'Nilofar complex, main road, cloth market',
      city: currentUser?.city || 'Bhainsa',
      state: 'Telangana',
      pincode: '504103',
      country: 'India',
    };

    // Format items array mapping custom_design_url from POD studio
    const items = cartItems.map((item) => ({
      productId: item.productId,
      name: item.name,
      size: item.size || 'L',
      color: item.shirtColorName || 'Pitch Black',
      quantity: item.quantity,
      price: item.price,
      custom_design_url: (item as any).custom_design_url || item.graphicUrl || item.customGraphicUrl || item.image || '',
      printFileUrl: (item as any).custom_design_url || item.graphicUrl || item.customGraphicUrl || item.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
      printPlacement: 'front' as const,
      customNotes: 'Direct DTG Pigment High Density Print',
    }));

    console.log('[Order Checkout Processor] Placing order with payload:', {
      user_id,
      items,
      total_amount: total,
      shipping_address,
      status: 'pending',
    });

    try {
      // -------------------------------------------------------------
      // Requirement 3: Insert order data into supabase.from('orders')
      // [{ user_id, items, total_amount, shipping_address, status: 'pending' }]
      // -------------------------------------------------------------
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
            shipping_address: typeof shipping_address === 'string' ? shipping_address : JSON.stringify(shipping_address),
            status: 'pending',
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (supabaseOrderError) {
        console.error('[Order Checkout Processor] Supabase order insertion error:', supabaseOrderError);
        // Fallback minimal insert if table has strict schema
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('orders')
          .insert([
            {
              user_id: user_id,
              items: items,
              total_amount: total,
              shipping_address: typeof shipping_address === 'string' ? shipping_address : JSON.stringify(shipping_address),
              status: 'pending',
            },
          ])
          .select();

        if (fallbackError) {
          console.error('[Order Checkout Processor] Fallback orders insert failed:', fallbackError);
          throw new Error(`Order database write failed: ${fallbackError.message}`);
        } else {
          console.log('[Order Checkout Processor] Fallback orders insert succeeded:', fallbackData);
        }
      } else {
        console.log('[Order Checkout Processor] Order inserted successfully into Supabase:', supabaseOrderData);
      }

      // Also submit to backend fulfillment cache & notify merchant
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
            items,
            totalAmount: total,
          }),
        }).catch(() => null);
      } catch (backendNotice) {
        console.warn('[Order Checkout Processor] Backend cache notice:', backendNotice);
      }

      // Clear cloud cart in Supabase
      if (user_id) {
        CartService.clearCart(user_id).catch(() => null);
      }

      setOrderComplete(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      console.error('[Order Checkout Processor] Error during checkout:', err);
      setCheckoutError(err?.message || 'Network request failed while creating order in Supabase. Please check connection and try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleFinishOrder = () => {
    setOrderComplete(false);
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

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between animate-slide-in">
          {/* Header */}
          <div className="px-6 py-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-900 text-white">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h2 className="font-['Oswald'] font-bold text-lg tracking-wider uppercase">
                YOUR SHOPPING BAG ({cartItems.reduce((sum, item) => sum + item.quantity, 0)})
              </h2>
            </div>
            <button
              id="cart-drawer-close-btn"
              onClick={onClose}
              className="p-1 rounded-lg text-neutral-400 hover:text-white transition"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-100">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-800 mb-1.5">
              <span className="flex items-center space-x-1">
                <Truck className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  {isFreeDelivery
                    ? '🎉 Free Worldwide Shipping Unlocked!'
                    : `Add ${settings.currencySymbol}${remainingForFreeShipping.toFixed(2)} more for FREE Delivery`}
                </span>
              </span>
              <span className="text-[11px] text-amber-700 font-bold">{Math.round(shippingProgress)}%</span>
            </div>
            <div className="w-full h-2 bg-amber-200/70 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 rounded-full"
                style={{ width: `${shippingProgress}%` }}
              />
            </div>
          </div>

          {/* Order Completed Screen */}
          {orderComplete ? (
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold font-['Montserrat',sans-serif] text-neutral-900">
                Order Received!
              </h3>
              <p className="text-xs text-neutral-500 mt-2 max-w-xs leading-relaxed">
                Thank you for supporting {settings.storeName}! Your custom print-on-demand t-shirts have entered the DTG print queue.
              </p>
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 my-6 w-full text-left text-xs space-y-1.5">
                <div className="flex justify-between text-neutral-600">
                  <span>Order Number:</span>
                  <span className="font-mono font-bold text-neutral-900">#{placedOrderNumber || 'ANFA-ORD-960334'}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Estimated Dispatch:</span>
                  <span className="font-semibold text-neutral-900">24-48 Hours (Qikink POD)</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Delivery Address:</span>
                  <span className="font-semibold text-neutral-900">{currentUser?.address || 'Nilofar complex, Bhainsa'}</span>
                </div>
              </div>
              <button
                id="cart-finish-order-btn"
                onClick={handleFinishOrder}
                className="w-full py-3 bg-neutral-900 hover:bg-black text-white font-['Oswald'] font-bold text-xs tracking-wider uppercase rounded-xl transition"
              >
                CONTINUE SHOPPING
              </button>
            </div>
          ) : (
            <>
              {/* Item List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-neutral-400 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-neutral-300" />
                    </div>
                    <p className="text-sm font-semibold text-neutral-600">Your bag is empty</p>
                    <p className="text-xs text-neutral-400 max-w-xs">
                      Explore our Summer Hotlist drops or design your custom POD t-shirt now!
                    </p>
                    <div className="pt-2 flex flex-col space-y-2 w-full max-w-xs">
                      <button
                        onClick={onClose}
                        className="py-2.5 px-4 bg-neutral-900 hover:bg-black text-white font-semibold text-xs rounded-xl transition"
                      >
                        Browse Collections
                      </button>
                    </div>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center space-x-3.5 p-3 rounded-xl border border-neutral-100 bg-neutral-50/50 hover:bg-neutral-50 transition"
                    >
                      {/* Shirt Color swatch representation */}
                      <div
                        className="w-16 h-16 rounded-lg border border-neutral-200 flex-shrink-0 flex items-center justify-center text-[9px] font-bold shadow-inner"
                        style={{ backgroundColor: item.shirtColor }}
                      >
                        <span className={item.shirtColor === '#FFFFFF' || item.shirtColor === '#F8F9FA' ? 'text-neutral-800' : 'text-white'}>
                          POD
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-neutral-900 truncate font-['Montserrat',sans-serif]">
                          {item.name}
                        </h4>
                        <div className="flex items-center space-x-2 text-[11px] text-neutral-500 mt-0.5">
                          <span>Color: <strong className="text-neutral-700">{item.shirtColorName}</strong></span>
                          <span>•</span>
                          <span>Size: <strong className="text-neutral-700">{item.size}</strong></span>
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
                        <div className="flex items-center border border-neutral-300 bg-white rounded-md overflow-hidden">
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

              {/* Footer Summary & Checkout */}
              {cartItems.length > 0 && (
                <div className="p-6 border-t border-neutral-200 bg-white space-y-4">
                  {/* Promo Code Input */}
                  <form onSubmit={handleApplyPromo} className="flex space-x-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Coupon (e.g. SUMMER15)"
                      className="flex-1 text-xs border border-neutral-300 rounded-lg px-3 py-2 uppercase tracking-wider focus:outline-none focus:border-neutral-900"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-lg uppercase tracking-wider transition"
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

                  {/* Calculations */}
                  <div className="space-y-1.5 text-xs text-neutral-600 border-t border-neutral-100 pt-3">
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
                        <span>-{settings.currencySymbol}{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>
                        {isFreeDelivery ? (
                          <strong className="text-emerald-600">FREE</strong>
                        ) : (
                          `${settings.currencySymbol}${deliveryFee.toFixed(2)}`
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-neutral-900 pt-2 border-t border-neutral-100">
                      <span>Total</span>
                      <span className="text-base text-amber-600 font-['Oswald']">
                        {settings.currencySymbol}
                        {total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Checkout Error Banner */}
                  {checkoutError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-xs text-rose-700 font-medium">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-bold">Order Submission Failed</p>
                        <p className="text-[11px] text-rose-600 mt-0.5">{checkoutError}</p>
                      </div>
                    </div>
                  )}

                  {/* Checkout Button */}
                  <button
                    id="cart-checkout-btn"
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-black font-['Oswald'] font-bold text-sm tracking-wider uppercase rounded-xl flex items-center justify-center space-x-2 transition shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {isCheckingOut ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>PROCEED TO CHECKOUT</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center space-x-1.5 text-[11px] text-neutral-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>256-Bit SSL Encrypted & Authenticity Guaranteed</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
