import React, { useState } from 'react';
import {
  Heart,
  ShoppingBag,
  Menu,
  X,
  Sparkles,
  User,
  LifeBuoy,
} from 'lucide-react';
import { StoreSettings, Product, UserProfile } from '../types/store';
import { CustomerCareTab } from './CustomerCareModal';

interface NavbarProps {
  settings: StoreSettings;
  wishlistCount: number;
  cartCount: number;
  currentUser?: UserProfile;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenCustomizer: () => void;
  onOpenProfile?: () => void;
  onOpenCareTab?: (tab: CustomerCareTab) => void;
  onSelectCategory: (cat: string) => void;
  onSearch?: (query: string) => void;
  products?: Product[];
  onSelectProduct?: (product: Product) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  wishlistCount,
  cartCount,
  currentUser,
  onOpenCart,
  onOpenWishlist,
  onOpenCustomizer,
  onOpenProfile,
  onOpenCareTab,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-black text-white shadow-md select-none transition-all">
      {/* Top Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Left: Brand Logo in a clean horizontal single line */}
          <div className="flex items-center">
            <a
              id="brand-logo-link"
              href="#top"
              className="flex items-center space-x-1.5 group select-none cursor-pointer"
            >
              <span className="font-['Oswald'] font-black text-2xl sm:text-3xl md:text-4xl tracking-widest text-white uppercase whitespace-nowrap group-hover:text-amber-400 transition">
                {settings.storeName || 'ANFA PRINT WEAR'}
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] inline-block flex-shrink-0"></span>
            </a>
          </div>

          {/* Right: Actions -> [CUSTOM POD STUDIO] -> [WISHLIST] -> [CART] -> [PROFILE ICON AFTER CART] */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Live Custom POD Studio Button */}
            <button
              id="header-customizer-btn"
              onClick={onOpenCustomizer}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-black font-bold text-xs tracking-wider uppercase transition shadow-sm hover:shadow-amber-400/20 active:scale-95"
              title="Launch Custom POD Studio"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>CUSTOM POD</span>
            </button>

            {/* Personal Wishlist */}
            <button
              id="header-wishlist-btn"
              onClick={onOpenWishlist}
              className="relative flex items-center space-x-1 text-xs font-semibold text-neutral-300 hover:text-amber-400 transition py-1 px-2 group"
              title="Personal Wishlist"
            >
              <Heart className="w-4 h-4 text-neutral-300 group-hover:text-rose-400" />
              <span className="hidden md:inline uppercase text-[11px] tracking-wider">WISHLIST</span>
              {wishlistCount > 0 && (
                <span className="flex items-center justify-center w-4 h-4 text-[9px] font-bold text-black bg-amber-400 rounded-full">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Personal Shopping Cart */}
            <button
              id="header-cart-btn"
              onClick={onOpenCart}
              className="relative flex items-center space-x-1.5 text-xs font-semibold text-neutral-300 hover:text-amber-400 transition py-1 px-2 group"
              title="Personal Cart"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-neutral-300 group-hover:text-amber-400" />
                <span className="absolute -top-1.5 -right-2 flex items-center justify-center w-4 h-4 text-[9px] font-black text-black bg-amber-400 rounded-full group-hover:scale-110 transition">
                  {cartCount}
                </span>
              </div>
              <span className="hidden md:inline uppercase text-[11px] tracking-wider">CART</span>
            </button>

            {/* Customer Profile Icon: Placed directly AFTER Cart in the top right corner */}
            {onOpenProfile && (
              <button
                id="header-profile-btn"
                onClick={onOpenProfile}
                className="flex items-center space-x-1.5 text-xs font-semibold text-neutral-300 hover:text-amber-400 transition py-1 px-2 rounded-lg hover:bg-neutral-900 border border-neutral-800 hover:border-amber-400/40"
                title="Customer Profile & Orders"
              >
                <div className="w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-[11px] shadow-sm">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                </div>
                <span className="hidden lg:inline uppercase text-[11px] tracking-wider font-bold">
                  {currentUser?.name ? currentUser.name.split(' ')[0] : 'PROFILE'}
                </span>
              </button>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 text-neutral-300 hover:text-white rounded-lg focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-neutral-950 border-t border-neutral-800 px-4 py-4 space-y-3">
          {/* Customer Profile in Mobile Drawer */}
          {onOpenProfile && (
            <button
              onClick={() => {
                onOpenProfile();
                setIsMobileMenuOpen(false);
              }}
              className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
                <div className="text-left">
                  <p className="font-bold text-white">{currentUser?.name || 'Customer Account'}</p>
                  <p className="text-[10px] text-neutral-400">{currentUser?.email || 'Login / Profile'}</p>
                </div>
              </div>
              <span className="text-[10px] text-amber-400 font-bold uppercase">PROFILE</span>
            </button>
          )}

          <div className="pt-2 space-y-2">
            <button
              onClick={() => {
                onOpenCustomizer();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-amber-400 text-black font-bold text-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>LAUNCH CUSTOM POD STUDIO</span>
            </button>

            {onOpenCareTab && (
              <button
                onClick={() => {
                  onOpenCareTab('contact');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs border border-neutral-800"
              >
                <LifeBuoy className="w-4 h-4 text-amber-400" />
                <span>HELP & CUSTOMER SUPPORT</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
