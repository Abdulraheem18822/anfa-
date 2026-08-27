import { useState, useMemo, useEffect } from 'react';
import { Sparkles, ArrowRight, Check } from 'lucide-react';
import {
  MOCK_PRODUCTS,
  MOCK_PROMOS,
  MOCK_INSTAGRAM_POSTS,
  DEFAULT_STORE_SETTINGS,
  DEFAULT_USERS,
  INITIAL_USER_CARTS,
  INITIAL_USER_WISHLISTS,
} from './data/mockData';
import { Product, CartItem, StoreSettings, UserProfile } from './types/store';
import { setupSupabaseAuthListener } from './lib/authSupabase';
import { supabase } from './lib/supabase';

// Components
import { Navbar } from './components/Navbar';
import { HeroBanners } from './components/HeroBanners';
import { PartnerBrands } from './components/PartnerBrands';
import { PromoCards } from './components/PromoCards';
import { ProductGrid } from './components/ProductGrid';
import { InstagramGallery } from './components/InstagramGallery';
import { ValueGuarantees } from './components/ValueGuarantees';
import { Footer } from './components/Footer';
import { ProductDetailPage } from './components/ProductDetailPage';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { PODStudioModal } from './components/PODStudioModal';
import { CustomerCareModal, CustomerCareTab } from './components/CustomerCareModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AdminPortalModal } from './components/AdminPortalModal';
import { TShirtMockup } from './components/TShirtMockup';

export default function App() {
  // Store settings state for Anfa Print Wear (INR currency)
  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('anfa_store_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.storeName && parsed.storeName !== 'ORITINA') {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_STORE_SETTINGS;
  });

  // User Accounts & Authentication / Profile state
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('anfa_all_users');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('anfa_current_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  // User-isolated Carts map { [userId: string]: CartItem[] }
  const [userCarts, setUserCarts] = useState<Record<string, CartItem[]>>(() => {
    try {
      const saved = localStorage.getItem('anfa_user_carts');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_USER_CARTS;
  });

  // User-isolated Wishlists map { [userId: string]: string[] }
  const [userWishlists, setUserWishlists] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('anfa_user_wishlists');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_USER_WISHLISTS;
  });

  const activeUserKey = currentUser?.id || 'guest_session';

  // Derive active user's cart and wishlist
  const currentCartItems = useMemo(() => {
    return userCarts[activeUserKey] || [];
  }, [userCarts, activeUserKey]);

  const currentWishlistIds = useMemo(() => {
    return userWishlists[activeUserKey] || [];
  }, [userWishlists, activeUserKey]);

  // Persist state changes
  useEffect(() => {
    try {
      localStorage.setItem('anfa_store_settings', JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('anfa_all_users', JSON.stringify(allUsers));
    } catch {
      // ignore
    }
  }, [allUsers]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('anfa_current_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('anfa_current_user');
      }
    } catch {
      // ignore
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('anfa_user_carts', JSON.stringify(userCarts));
    } catch {
      // ignore
    }
  }, [userCarts]);

  useEffect(() => {
    try {
      localStorage.setItem('anfa_user_wishlists', JSON.stringify(userWishlists));
    } catch {
      // ignore
    }
  }, [userWishlists]);

  // UI Navigation & Modals state
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState<boolean>(false);
  const [isPODStudioOpen, setIsPODStudioOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isStoreAdminOpen, setIsStoreAdminOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Dynamic Catalog State (Synced with Backend / Admin edits)
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(MOCK_PRODUCTS);

  const refreshCatalog = async (directProducts?: Product[]) => {
    if (directProducts && directProducts.length > 0) {
      setCatalogProducts(directProducts.filter((p) => p.isLive !== false));
    }
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim()) {
          const json = JSON.parse(text);
          if (json.success && Array.isArray(json.products) && json.products.length > 0) {
            setCatalogProducts(json.products);
          }
        }
      }
    } catch {
      // Keep MOCK_PRODUCTS fallback
    }
  };

  useEffect(() => {
    refreshCatalog();
  }, []);

  // Supabase Global Auth State Listener (Phone / Email OTP)
  useEffect(() => {
    const unsubscribe = setupSupabaseAuthListener((profile) => {
      if (profile) {
        console.log('[App] Global Supabase Auth detected active user:', profile);
        setCurrentUser(profile);
        setAllUsers((prev) => {
          const exists = prev.find((u) => u.id === profile.id || (u.phone && profile.phone && u.phone === profile.phone));
          if (!exists) {
            return [...prev, profile];
          }
          return prev.map((u) => (u.id === profile.id ? { ...u, ...profile } : u));
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Customer Care & Contact Modal State
  const [isCareModalOpen, setIsCareModalOpen] = useState<boolean>(false);
  const [careModalTab, setCareModalTab] = useState<CustomerCareTab>('help');

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleOpenCareTab = (tab: CustomerCareTab) => {
    setCareModalTab(tab);
    setIsCareModalOpen(true);
  };

  // Switch User Profile
  const handleSwitchUser = (user: UserProfile) => {
    setCurrentUser(user);
    showToast(`Switched account to ${user.name}`);
  };

  // Logout User Profile
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('anfa_current_user');
    showToast('Logged out successfully');
  };

  // Update Existing Profile
  const handleUpdateProfile = (updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
    setAllUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
    showToast('Customer profile updated successfully');
  };

  // Add New User Profile / Login
  const handleAddNewUser = (newUser: UserProfile) => {
    setAllUsers((prev) => {
      const exists = prev.some((u) => u.id === newUser.id || u.email === newUser.email);
      if (exists) {
        return prev.map((u) => (u.id === newUser.id || u.email === newUser.email ? newUser : u));
      }
      return [...prev, newUser];
    });
    setCurrentUser(newUser);
    if (!userCarts[newUser.id]) {
      setUserCarts((prev) => ({ ...prev, [newUser.id]: [] }));
    }
    if (!userWishlists[newUser.id]) {
      setUserWishlists((prev) => ({ ...prev, [newUser.id]: [] }));
    }
    showToast(`Logged in as ${newUser.name}`);
  };

  // Generic Cart Add Function (Isolated per current user)
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

    setUserCarts((prev) => {
      const userCart = prev[activeUserKey] || [];
      const existingIndex = userCart.findIndex(
        (ci) =>
          ci.productId === cartItemPayload.productId &&
          ci.size === cartItemPayload.size &&
          ci.shirtColor === cartItemPayload.shirtColor &&
          ci.customText === cartItemPayload.customText
      );

      let updatedCart: CartItem[];
      if (existingIndex > -1) {
        updatedCart = [...userCart];
        updatedCart[existingIndex].quantity += cartItemPayload.quantity;
      } else {
        const newItem: CartItem = {
          ...cartItemPayload,
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        };
        updatedCart = [...userCart, newItem];
      }

      return {
        ...prev,
        [activeUserKey]: updatedCart,
      };
    });

    showToast(`Added "${cartItemPayload.name}" to cart`);
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setUserCarts((prev) => {
      const userCart = prev[activeUserKey] || [];
      const updated = userCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);

      return {
        ...prev,
        [activeUserKey]: updated,
      };
    });
  };

  const handleRemoveCartItem = (id: string) => {
    setUserCarts((prev) => ({
      ...prev,
      [activeUserKey]: (prev[activeUserKey] || []).filter((item) => item.id !== id),
    }));
  };

  const handleClearCart = () => {
    setUserCarts((prev) => ({
      ...prev,
      [activeUserKey]: [],
    }));
  };

  // Wishlist Actions (Isolated per current user)
  const handleToggleWishlist = (productIdOrProduct: string | Product) => {
    const id = typeof productIdOrProduct === 'string' ? productIdOrProduct : productIdOrProduct.id;
    setUserWishlists((prev) => {
      const userWishlist = prev[activeUserKey] || [];
      const exists = userWishlist.includes(id);
      let updated: string[];

      if (exists) {
        showToast('Removed item from saved wishlist');
        updated = userWishlist.filter((item) => item !== id);
      } else {
        showToast('Saved item to wishlist ❤️');
        updated = [...userWishlist, id];
      }

      return {
        ...prev,
        [activeUserKey]: updated,
      };
    });
  };

  const wishlistProducts = useMemo(() => {
    return catalogProducts.filter((p) => currentWishlistIds.includes(p.id));
  }, [catalogProducts, currentWishlistIds]);

  const handleMoveWishlistToCart = (product: Product) => {
    handleAddToCart(product);
    setUserWishlists((prev) => ({
      ...prev,
      [activeUserKey]: (prev[activeUserKey] || []).filter((id) => id !== product.id),
    }));
  };

  const handleOpenProductById = (productId: string) => {
    const found = catalogProducts.find((p) => p.id === productId) || MOCK_PRODUCTS.find((p) => p.id === productId);
    if (found) {
      setSelectedProduct(found);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectCategoryAndScroll = (category: string) => {
    setSelectedProduct(null);
    setSearchQuery('');
    setActiveCategory(category);
    const gridEl = document.getElementById('products-section');
    if (gridEl) {
      gridEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSearch = (query: string) => {
    setSelectedProduct(null);
    const q = query.toLowerCase().trim();
    setSearchQuery(q);

    // Map search terms to specific categories if matching
    if (q.includes('winter') || q.includes('snow') || q.includes('frost')) {
      setActiveCategory('winter-special');
    } else if (q.includes('summer') || q.includes('sun') || q.includes('tropical')) {
      setActiveCategory('summer-special');
    } else if (q.includes('travel') || q.includes('trip') || q.includes('wander') || q.includes('nomad')) {
      setActiveCategory('traveling');
    } else if (q.includes('dog') || q.includes('pet') || q.includes('puppy') || q.includes('paw')) {
      setActiveCategory('dog-lovers');
    } else if (q.includes('val') || q.includes('love') || q.includes('heart') || q.includes('romance') || q.includes('glow')) {
      setActiveCategory('valentines');
    } else if (q.includes('women') || q.includes('girl') || q.includes('female')) {
      setActiveCategory('women');
    } else if (q.includes('men') || q.includes('boy') || q.includes('male')) {
      setActiveCategory('men');
    } else if (q.includes('new') || q.includes('arrival')) {
      setActiveCategory('new-arrival');
    } else if (q.includes('best') || q.includes('seller') || q.includes('top')) {
      setActiveCategory('best-seller');
    } else if (q.includes('feat') || q.includes('future')) {
      setActiveCategory('featured');
    } else {
      setActiveCategory('all');
    }

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

      {/* Top Header & Sticky Navigation (Keeps POD Studio in Header & User Profile button) */}
      <Navbar
        settings={settings}
        currentUser={currentUser}
        cartCount={currentCartItems.reduce((acc, i) => acc + i.quantity, 0)}
        wishlistCount={currentWishlistIds.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenCustomizer={() => setIsPODStudioOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenCareTab={handleOpenCareTab}
        onSelectCategory={handleSelectCategoryAndScroll}
        onSearch={handleSearch}
        products={catalogProducts}
        onSelectProduct={(p) => {
          setSelectedProduct(p);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {selectedProduct ? (
          /* Full Page Product Detail View with Border and Specifications */
          <ProductDetailPage
            product={selectedProduct}
            settings={settings}
            onBack={() => {
              setSelectedProduct(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            isWishlisted={currentWishlistIds.includes(selectedProduct.id)}
            allProducts={catalogProducts}
            onSelectProduct={(p) => {
              setSelectedProduct(p);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenPODStudio={() => setIsPODStudioOpen(true)}
          />
        ) : (
          /* Main Landing Page Content */
          <>
            {/* Split Carousel Hero Banners (Unforgettable single line & wide search) */}
            <HeroBanners
              settings={settings}
              onQuickView={(product) => {
                setSelectedProduct(product);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onAddToCart={(product, size) => handleAddToCart(product, undefined, undefined, size, 1)}
              onExploreCategory={handleSelectCategoryAndScroll}
              onExploreCollection={handleSelectCategoryAndScroll}
              onSearchSubmit={handleSearch}
            />

            {/* Partner Brands Grid / Below-Banner Clickable Category Menu */}
            <PartnerBrands
              activeCategory={activeCategory}
              onSelectCategory={handleSelectCategoryAndScroll}
            />

            {/* 3-Column Editorial Promo Banner Cards */}
            <PromoCards
              promos={MOCK_PROMOS}
              onShopCategory={handleSelectCategoryAndScroll}
              onSelectPromo={(_graphicType, category) => {
                handleSelectCategoryAndScroll(category);
              }}
              onQuickView={(p) => {
                setSelectedProduct(p);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Our Products Grid with Category Tabs, Swatches, and Hover Actions */}
            <div id="products-section">
              <ProductGrid
                products={catalogProducts}
                settings={settings}
                activeCategory={activeCategory}
                selectedCategory={activeCategory}
                onSelectCategory={setActiveCategory}
                searchQuery={searchQuery}
                onQuickView={(product) => {
                  setSelectedProduct(product);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onAddToCart={(product, size) => handleAddToCart(product, undefined, undefined, size, 1)}
                onQuickAdd={(product) => handleAddToCart(product)}
                onToggleWishlist={handleToggleWishlist}
                wishlistProductIds={currentWishlistIds}
                isWishlisted={(id) => currentWishlistIds.includes(id)}
              />
            </div>

            {/* Interactive Custom POD Studio Callout Banner */}
            <section className="bg-neutral-900 text-white py-12 sm:py-16 px-3.5 sm:px-6 md:px-8 relative overflow-hidden my-8 select-none">
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle, #f59e0b 1px, transparent 1px)',
                  backgroundSize: '32px 32px',
                }}
              />

              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 items-center justify-between gap-8 lg:gap-12 relative z-10">
                {/* Left Info */}
                <div className="lg:col-span-7 max-w-xl text-center lg:text-left space-y-4 mx-auto lg:mx-0">
                  <div className="inline-flex items-center space-x-2 bg-amber-400/10 border border-amber-400/30 text-amber-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>On-Demand Manufacturing</span>
                  </div>
                  <h2 className="font-['Oswald'] text-2xl sm:text-3xl md:text-5xl font-bold uppercase tracking-tight leading-tight">
                    CREATE YOUR OWN <span className="text-amber-400">SIGNATURE</span> T-SHIRT
                  </h2>
                  <p className="text-neutral-300 text-xs sm:text-sm md:text-base leading-relaxed">
                    Upload your custom artwork directly from your device or drive, select your favorite garment color and size, customize your print dimensions, and send your design straight to our DTG production team in Kolkata.
                  </p>
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                    <button
                      id="pod-customizer-banner-btn"
                      onClick={() => setIsPODStudioOpen(true)}
                      className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-amber-400 hover:bg-amber-500 text-black font-['Oswald'] font-bold text-xs sm:text-sm tracking-wider uppercase rounded-xl flex items-center justify-center space-x-2 transition shadow-xl active:scale-95 cursor-pointer"
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
                <div className="lg:col-span-5 w-full max-w-xs sm:max-w-md mx-auto bg-neutral-800/80 border border-neutral-700/80 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col items-center">
                  <div className="w-48 h-48 xs:w-56 xs:h-56 sm:w-64 sm:h-64 relative flex items-center justify-center mx-auto overflow-hidden">
                    <TShirtMockup
                      shirtColor="#121212"
                      graphicType="graphic-tokyo"
                      customText="ANFA APPAREL"
                      customFont="'Oswald', sans-serif"
                      showShadow={true}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="mt-4 w-full bg-neutral-900 rounded-xl p-3 flex items-center justify-between text-xs text-neutral-300 border border-neutral-700">
                    <span className="font-semibold text-white truncate mr-2">Live DTG Print Engine</span>
                    <button
                      onClick={() => setIsPODStudioOpen(true)}
                      className="text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1 whitespace-nowrap"
                    >
                      <span>Open Studio</span>
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
              products={catalogProducts}
              onSelectProductById={handleOpenProductById}
            />

            {/* Trust Badges & Guarantee */}
            <ValueGuarantees settings={settings} />
          </>
        )}
      </main>

      {/* Global E-commerce Footer (without newsletter, with Kolkata address & customer care) */}
      <Footer
        settings={settings}
        onSelectCategory={handleSelectCategoryAndScroll}
        onOpenCareTab={handleOpenCareTab}
        onOpenAdminPortal={() => setIsStoreAdminOpen(true)}
      />

      {/* Secure Admin Command Center Modal */}
      <AdminPortalModal
        isOpen={isStoreAdminOpen}
        onClose={() => setIsStoreAdminOpen(false)}
        settings={settings}
        onRefreshStorefrontCatalog={refreshCatalog}
      />

      {/* Customer Profile & User Switcher Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        allUsers={allUsers}
        onSwitchUser={handleSwitchUser}
        onUpdateProfile={handleUpdateProfile}
        onAddNewUser={handleAddNewUser}
        onLogout={handleLogout}
        cartCount={currentCartItems.reduce((acc, i) => acc + i.quantity, 0)}
        wishlistCount={currentWishlistIds.length}
        settings={settings}
      />

      {/* Cart Slide-out Drawer with Checkout Flow */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={currentCartItems}
        settings={settings}
        currentUser={currentUser}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
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
      />

      {/* Dedicated Customer Care, Policies & Contact Form Modal */}
      <CustomerCareModal
        isOpen={isCareModalOpen}
        onClose={() => setIsCareModalOpen(false)}
        initialTab={careModalTab}
        settings={settings}
      />
    </div>
  );
}
