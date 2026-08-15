import { useState, useMemo, useEffect } from 'react';
import { Sparkles, ArrowRight, Check, SlidersHorizontal, ShoppingBag } from 'lucide-react';
import {
  MOCK_PRODUCTS,
  MOCK_PROMOS,
  MOCK_INSTAGRAM_POSTS,
  DEFAULT_STORE_SETTINGS,
} from './data/mockData';
import { Product, CartItem, StoreSettings } from './types/store';

// Components
import { Navbar } from './components/Navbar';
import { HeroBanners } from './components/HeroBanners';
import { PartnerBrands } from './components/PartnerBrands';
import { PromoCards } from './components/PromoCards';
import { ProductGrid } from './components/ProductGrid';
import { InstagramGallery } from './components/InstagramGallery';
import { ValueGuarantees } from './components/ValueGuarantees';
import { Footer } from './components/Footer';
import { QuickViewModal } from './components/QuickViewModal';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { PODStudioModal } from './components/PODStudioModal';
import { StoreSettingsModal } from './components/StoreSettingsModal';
import { TShirtMockup } from './components/TShirtMockup';

export default function App() {
  // Store settings state with localStorage persistence
  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('oritina_store_settings');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_STORE_SETTINGS;
  });

  // Cart & Wishlist state with localStorage persistence
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('oritina_cart_items');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: 'cart-init-1',
        productId: 'prod-1',
        name: 'Cyberpunk Neo Tokyo Graphic Tee',
        price: 38.0,
        size: 'L',
        shirtColor: '#121212',
        shirtColorName: 'Pitch Black',
        graphicType: 'graphic-tokyo',
        quantity: 1,
      },
    ];
  });

  const [wishlistProductIds, setWishlistProductIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('oritina_wishlist_ids');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return ['prod-2', 'prod-4'];
  });

  // Persist state changes
  useEffect(() => {
    try {
      localStorage.setItem('oritina_store_settings', JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('oritina_cart_items', JSON.stringify(cartItems));
    } catch {
      // ignore
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem('oritina_wishlist_ids', JSON.stringify(wishlistProductIds));
    } catch {
      // ignore
    }
  }, [wishlistProductIds]);

  // UI Navigation & Modals state
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState<boolean>(false);
  const [isPODStudioOpen, setIsPODStudioOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Generic Cart Add Function supporting both item object and individual product args
  const handleAddToCart = (
    itemOrProduct: Omit<CartItem, 'id'> | Product,
    selectedColorHex?: string,
    selectedColorName?: string,
    selectedSize?: string,
    quantity: number = 1
  ) => {
    let cartItemPayload: Omit<CartItem, 'id'>;

    if ('productId' in itemOrProduct) {
      cartItemPayload = itemOrProduct as Omit<CartItem, 'id'>;
    } else {
      const prod = itemOrProduct as Product;
      cartItemPayload = {
        productId: prod.id,
        name: prod.name,
        price: prod.price,
        size: selectedSize || (prod.sizes && prod.sizes[0]) || 'M',
        shirtColor: selectedColorHex || prod.shirtColor || '#FFFFFF',
        shirtColorName: selectedColorName || prod.shirtColorName || 'Standard White',
        graphicType: prod.graphicType,
        graphicUrl: prod.graphicUrl,
        isGlowInDark: prod.isGlowInDark,
        quantity: quantity || 1,
      };
    }

    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (ci) =>
          ci.productId === cartItemPayload.productId &&
          ci.size === cartItemPayload.size &&
          ci.shirtColor === cartItemPayload.shirtColor &&
          ci.customText === cartItemPayload.customText
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += cartItemPayload.quantity;
        return updated;
      } else {
        const newItem: CartItem = {
          ...cartItemPayload,
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        };
        return [...prev, newItem];
      }
    });

    showToast(`Added "${cartItemPayload.name}" to your cart`);
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const handleRemoveCartItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Wishlist Actions
  const handleToggleWishlist = (productIdOrProduct: string | Product) => {
    const id = typeof productIdOrProduct === 'string' ? productIdOrProduct : productIdOrProduct.id;
    setWishlistProductIds((prev) => {
      const exists = prev.includes(id);
      if (exists) {
        showToast('Removed item from your wishlist');
        return prev.filter((item) => item !== id);
      } else {
        showToast('Saved item to your wishlist ❤️');
        return [...prev, id];
      }
    });
  };

  const wishlistProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((p) => wishlistProductIds.includes(p.id));
  }, [wishlistProductIds]);

  const handleMoveWishlistToCart = (product: Product) => {
    handleAddToCart(product);
    setWishlistProductIds((prev) => prev.filter((id) => id !== product.id));
  };

  const handleOpenProductById = (productId: string) => {
    const found = MOCK_PRODUCTS.find((p) => p.id === productId);
    if (found) {
      setQuickViewProduct(found);
    }
  };

  const handleSelectCategoryAndScroll = (category: string) => {
    setActiveCategory(category);
    const gridEl = document.getElementById('products-section');
    if (gridEl) {
      gridEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-['Montserrat',sans-serif] flex flex-col selection:bg-amber-400 selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 text-xs font-semibold animate-fade-in border border-neutral-700">
          <div className="w-5 h-5 rounded-full bg-amber-400 text-black flex items-center justify-center">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Quick Customizer & Store Settings Bar for Shop Owner */}
      <div className="fixed bottom-6 left-6 z-30 flex items-center space-x-2">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="bg-neutral-900/90 hover:bg-black text-amber-400 border border-neutral-700/80 px-3.5 py-2.5 rounded-full shadow-2xl backdrop-blur-sm flex items-center space-x-2 text-xs font-bold transition active:scale-95 group"
          title="Edit shop name, phone, address, currency, policies"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
          <span className="hidden sm:inline">Store Settings</span>
        </button>

        <button
          onClick={() => setIsPODStudioOpen(true)}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black px-4 py-2.5 rounded-full shadow-2xl flex items-center space-x-2 text-xs font-bold transition active:scale-95"
          title="Create custom graphic t-shirt in POD Studio"
        >
          <Sparkles className="w-4 h-4" />
          <span>POD Studio</span>
        </button>
      </div>

      {/* Top Header & Sticky Navigation */}
      <Navbar
        settings={settings}
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        wishlistCount={wishlistProductIds.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenCustomizer={() => setIsPODStudioOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSelectCategory={handleSelectCategoryAndScroll}
        onSearch={(q) => setSearchQuery(q)}
        products={MOCK_PRODUCTS}
        onSelectProduct={(p) => setQuickViewProduct(p)}
      />

      {/* Main Landing Page Content */}
      <main className="flex-1">
        {/* Split Carousel Hero Banners (Left Women Turquoise / Right Men Azure) */}
        <HeroBanners
          settings={settings}
          onQuickView={(product) => setQuickViewProduct(product)}
          onAddToCart={(product, size) => handleAddToCart(product, undefined, undefined, size, 1)}
          onExploreCategory={handleSelectCategoryAndScroll}
          onExploreCollection={handleSelectCategoryAndScroll}
          onLaunchPODStudio={() => setIsPODStudioOpen(true)}
        />

        {/* Partner Brands Grid */}
        <PartnerBrands />

        {/* 3-Column Editorial Promo Banner Cards with Retro 'New' Starburst */}
        <PromoCards
          promos={MOCK_PROMOS}
          onShopCategory={handleSelectCategoryAndScroll}
          onSelectPromo={(graphicType, category) => {
            handleSelectCategoryAndScroll(category);
          }}
          onQuickView={(p) => setQuickViewProduct(p)}
        />

        {/* Our Products Grid with Category Tabs, Swatches, and Hover Actions */}
        <div id="products-section">
          <ProductGrid
            products={MOCK_PRODUCTS}
            settings={settings}
            activeCategory={activeCategory}
            selectedCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            searchQuery={searchQuery}
            onQuickView={(product) => setQuickViewProduct(product)}
            onAddToCart={(product, size) => handleAddToCart(product, undefined, undefined, size, 1)}
            onQuickAdd={(product) => handleAddToCart(product)}
            onToggleWishlist={handleToggleWishlist}
            wishlistProductIds={wishlistProductIds}
            isWishlisted={(id) => wishlistProductIds.includes(id)}
            onOpenCustomizer={() => setIsPODStudioOpen(true)}
            onOpenCustomizerWithProduct={(prod) => {
              setQuickViewProduct(null);
              setIsPODStudioOpen(true);
            }}
          />
        </div>

        {/* Interactive Custom POD Studio Callout Banner */}
        <section className="bg-neutral-900 text-white py-16 px-4 md:px-8 relative overflow-hidden my-8 select-none">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #f59e0b 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
            {/* Left Info */}
            <div className="max-w-xl text-center lg:text-left space-y-4">
              <div className="inline-flex items-center space-x-2 bg-amber-400/10 border border-amber-400/30 text-amber-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>On-Demand Manufacturing</span>
              </div>
              <h2 className="font-['Oswald'] text-3xl md:text-5xl font-bold uppercase tracking-tight leading-tight">
                CREATE YOUR OWN <span className="text-amber-400">SIGNATURE</span> T-SHIRT
              </h2>
              <p className="text-neutral-300 text-sm md:text-base leading-relaxed">
                Choose from heavyweight 240GSM cotton, select premium vintage washes, pick exclusive artwork templates, or inject your own custom brand typography. Printed using eco-certified Japanese DTG technology.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  id="pod-customizer-banner-btn"
                  onClick={() => setIsPODStudioOpen(true)}
                  className="w-full sm:w-auto px-8 py-4 bg-amber-400 hover:bg-amber-500 text-black font-['Oswald'] font-bold text-sm tracking-wider uppercase rounded-xl flex items-center justify-center space-x-2 transition shadow-xl active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>START CUSTOMIZING NOW</span>
                </button>
                <div className="text-xs text-neutral-400 flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>No minimum order quantity required</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Mockup Visual */}
            <div className="w-full max-w-md bg-neutral-800/80 border border-neutral-700/80 rounded-2xl p-6 shadow-2xl flex flex-col items-center">
              <div className="w-64 h-64 relative flex items-center justify-center">
                <TShirtMockup
                  shirtColor="#121212"
                  graphicType="graphic-tokyo"
                  customText="LIMITED POD DROP"
                  customFont="'Oswald', sans-serif"
                  showShadow={true}
                  className="w-full h-full"
                />
              </div>
              <div className="mt-4 w-full bg-neutral-900 rounded-xl p-3 flex items-center justify-between text-xs text-neutral-300 border border-neutral-700">
                <span className="font-semibold text-white">Live DTG Print Preview Engine</span>
                <button
                  onClick={() => setIsPODStudioOpen(true)}
                  className="text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1"
                >
                  <span>Launch Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Instagram Lookbook Community Showcase */}
        <InstagramGallery
          posts={MOCK_INSTAGRAM_POSTS}
          storeHandle={settings.socialHandle}
          products={MOCK_PRODUCTS}
          onSelectProductById={handleOpenProductById}
        />

        {/* Trust Badges & Guarantee */}
        <ValueGuarantees settings={settings} />
      </main>

      {/* Global E-commerce Footer */}
      <Footer
        settings={settings}
        onSelectCategory={handleSelectCategoryAndScroll}
        onOpenPage={(title) => {
          showToast(`Opening ${title}`);
        }}
        onOpenCustomizer={() => setIsPODStudioOpen(true)}
      />

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        settings={settings}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
        isWishlisted={quickViewProduct ? wishlistProductIds.includes(quickViewProduct.id) : false}
        onOpenCustomizer={(prod) => {
          setQuickViewProduct(null);
          setIsPODStudioOpen(true);
        }}
        isOpen={!!quickViewProduct}
      />

      {/* Cart Slide-out Drawer with Checkout Flow */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        settings={settings}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onOpenCustomizer={() => {
          setIsCartOpen(false);
          setIsPODStudioOpen(true);
        }}
      />

      {/* Wishlist Drawer */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistItems={wishlistProducts}
        settings={settings}
        onRemoveFromWishlist={handleToggleWishlist}
        onMoveToCart={handleMoveWishlistToCart}
      />

      {/* Full POD Studio Modal */}
      <PODStudioModal
        isOpen={isPODStudioOpen}
        onClose={() => setIsPODStudioOpen(false)}
        settings={settings}
        onAddToCart={handleAddToCart}
      />

      {/* Shop Owner Settings Modal to update shop name, contact, currency & policies */}
      <StoreSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          showToast('Store settings updated successfully!');
        }}
      />
    </div>
  );
}
