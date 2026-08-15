import React, { useState } from 'react';
import { Search, Heart, ShoppingBag, Menu, X, ChevronDown, Sparkles, SlidersHorizontal } from 'lucide-react';
import { StoreSettings, Product } from '../types/store';

interface NavbarProps {
  settings: StoreSettings;
  wishlistCount: number;
  cartCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenCustomizer: () => void;
  onOpenSettings?: () => void;
  onSelectCategory: (cat: string) => void;
  onSearch?: (query: string) => void;
  products?: Product[];
  onSelectProduct?: (product: Product) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  wishlistCount,
  cartCount,
  onOpenCart,
  onOpenWishlist,
  onOpenCustomizer,
  onOpenSettings,
  onSelectCategory,
  onSearch,
  products = [],
  onSelectProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('HOME');

  const filteredSearch = searchQuery.trim() && Array.isArray(products)
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.graphicType.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (onSearch) {
      onSearch(val);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-black text-white shadow-md transition-all">
      {/* Announcement bar at the top */}
      {settings.announcementText && (
        <div className="bg-amber-400 text-black text-[11px] font-bold text-center py-1.5 px-4 tracking-wider uppercase flex items-center justify-center space-x-2">
          <span>⚡ {settings.announcementText}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Left: Search Bar */}
          <div className="relative flex-1 max-w-xs sm:max-w-sm hidden md:block">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                id="search-input-desktop"
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Type here to search..."
                className="w-full bg-neutral-900/90 text-white placeholder-neutral-400 text-xs sm:text-sm pl-9 pr-8 py-2 rounded-full border border-neutral-800 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
              />
              {searchQuery && (
                <button
                  id="search-clear-btn"
                  onClick={() => {
                    setSearchQuery('');
                    if (onSearch) onSearch('');
                  }}
                  className="absolute right-3 text-neutral-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Instant Search Results Dropdown */}
            {isSearchOpen && searchQuery && (
              <div
                className="absolute left-0 right-0 mt-2 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-2 z-50 max-h-80 overflow-y-auto"
                onMouseLeave={() => setIsSearchOpen(false)}
              >
                {filteredSearch.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-neutral-400 px-3 py-1">
                      Found {filteredSearch.length} products
                    </p>
                    {filteredSearch.map((product) => (
                      <button
                        key={product.id}
                        id={`search-item-${product.id}`}
                        onClick={() => {
                          if (onSelectProduct) onSelectProduct(product);
                          setIsSearchOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-neutral-800 text-left transition"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-8 h-8 rounded border border-neutral-700 flex items-center justify-center text-[8px] font-bold"
                            style={{ backgroundColor: product.shirtColor }}
                          >
                            <span className={product.shirtColor === '#FFFFFF' || product.shirtColor === '#F8F9FA' ? 'text-black' : 'text-white'}>
                              TEE
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-white">{product.name}</p>
                            <p className="text-[10px] text-amber-400">
                              {settings.currencySymbol}
                              {product.price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] text-neutral-400 capitalize px-2 py-0.5 bg-neutral-800 rounded">
                          {product.category}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-neutral-400">
                    No t-shirts matching &quot;{searchQuery}&quot;
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Center: Brand Logo */}
          <div className="flex-1 flex justify-center items-center">
            <a
              id="brand-logo-link"
              href="#top"
              className="flex items-center space-x-1 group tracking-tight select-none cursor-pointer"
            >
              <div className="flex items-center">
                <span className="font-['Oswald'] font-black text-2xl sm:text-3xl md:text-4xl tracking-widest text-white uppercase group-hover:text-amber-400 transition">
                  {settings.storeName || 'ORITINA'}
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ml-1 shadow-[0_0_8px_rgba(251,191,36,0.8)] inline-block"></span>
              </div>
            </a>
          </div>

          {/* Right: Actions (Wishlist, Cart, Store Settings, Menu) */}
          <div className="flex-1 flex items-center justify-end space-x-3 sm:space-x-4">
            {/* Live POD Customizer Button */}
            <button
              id="header-customizer-btn"
              onClick={onOpenCustomizer}
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold text-xs transition shadow-md hover:shadow-amber-500/20 active:scale-95"
              title="Design Your Custom T-Shirt"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>POD STUDIO</span>
            </button>

            {/* Live Store Settings Modal Trigger for Shop Owner */}
            {onOpenSettings && (
              <button
                id="header-edit-store-btn"
                onClick={onOpenSettings}
                className="hidden sm:flex items-center space-x-1 text-neutral-400 hover:text-amber-400 text-xs px-2.5 py-1.5 rounded-full border border-neutral-800 hover:border-amber-400/50 transition"
                title="Edit Shop Details (Name, Phone, Address, Currency)"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Edit Shop Info</span>
              </button>
            )}

            {/* Wishlist */}
            <button
              id="header-wishlist-btn"
              onClick={onOpenWishlist}
              className="relative flex items-center space-x-1.5 text-xs font-semibold text-neutral-300 hover:text-amber-400 transition py-1 px-2"
              title="View Wishlist"
            >
              <Heart className="w-4 h-4 text-neutral-300 group-hover:text-amber-400" />
              <span className="hidden sm:inline uppercase text-[11px] tracking-wider">WISHLIST</span>
              {wishlistCount > 0 && (
                <span className="flex items-center justify-center w-4 h-4 text-[9px] font-bold text-black bg-amber-400 rounded-full">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Shopping Cart */}
            <button
              id="header-cart-btn"
              onClick={onOpenCart}
              className="relative flex items-center space-x-1.5 text-xs font-semibold text-neutral-300 hover:text-amber-400 transition py-1 px-2 group"
              title="View Cart"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-neutral-300 group-hover:text-amber-400" />
                <span className="absolute -top-1.5 -right-2 flex items-center justify-center w-4 h-4 text-[9px] font-black text-black bg-amber-400 rounded-full group-hover:scale-110 transition">
                  {cartCount}
                </span>
              </div>
              <span className="hidden sm:inline uppercase text-[11px] tracking-wider">CART</span>
            </button>

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

      {/* Secondary Navigation Row (as shown in image with active yellow indicators) */}
      <div className="border-t border-neutral-800/80 bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="hidden md:flex items-center justify-center space-x-10 h-11 text-xs font-bold uppercase tracking-widest">
            {/* HOME */}
            <div className="relative group">
              <a
                id="nav-link-home"
                href="#top"
                onClick={() => setActiveMenu('HOME')}
                className={`flex items-center space-x-1 py-3 transition ${
                  activeMenu === 'HOME' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-neutral-300 hover:text-amber-400'
                }`}
              >
                <span>HOME</span>
                <ChevronDown className="w-3 h-3 opacity-60 group-hover:rotate-180 transition-transform" />
              </a>
              <div className="absolute top-full left-0 hidden group-hover:block w-48 bg-neutral-900 border border-neutral-800 shadow-xl py-2 rounded-b-md">
                <a href="#hero-section" className="block px-4 py-2 text-neutral-300 hover:bg-neutral-800 hover:text-amber-400 text-xs normal-case">
                  Summer Hotlist 2026
                </a>
                <a href="#promo-section" className="block px-4 py-2 text-neutral-300 hover:bg-neutral-800 hover:text-amber-400 text-xs normal-case">
                  Featured Promo Drops
                </a>
                <a href="#products-section" className="block px-4 py-2 text-neutral-300 hover:bg-neutral-800 hover:text-amber-400 text-xs normal-case">
                  Our Products Catalog
                </a>
              </div>
            </div>

            {/* PAGE */}
            <div className="relative group">
              <a
                id="nav-link-page"
                href="#products-section"
                onClick={() => setActiveMenu('PAGE')}
                className={`flex items-center space-x-1 py-3 transition ${
                  activeMenu === 'PAGE' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-neutral-300 hover:text-amber-400'
                }`}
              >
                <span>PAGE</span>
                <ChevronDown className="w-3 h-3 opacity-60 group-hover:rotate-180 transition-transform" />
              </a>
              <div className="absolute top-full left-0 hidden group-hover:block w-52 bg-neutral-900 border border-neutral-800 shadow-xl py-2 rounded-b-md">
                <button
                  onClick={() => {
                    onSelectCategory('all');
                    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full text-left block px-4 py-2 text-neutral-300 hover:bg-neutral-800 hover:text-amber-400 text-xs normal-case"
                >
                  All T-Shirt Designs
                </button>
                <button
                  onClick={() => {
                    onOpenCustomizer();
                  }}
                  className="w-full text-left block px-4 py-2 text-neutral-300 hover:bg-neutral-800 hover:text-amber-400 text-xs normal-case"
                >
                  POD Customizer Tool
                </button>
                <a href="#guarantees-section" className="block px-4 py-2 text-neutral-300 hover:bg-neutral-800 hover:text-amber-400 text-xs normal-case">
                  Our Quality Guarantee
                </a>
              </div>
            </div>

            {/* BLOG */}
            <div className="relative group">
              <a
                id="nav-link-blog"
                href="#instagram-section"
                onClick={() => setActiveMenu('BLOG')}
                className={`flex items-center space-x-1 py-3 transition ${
                  activeMenu === 'BLOG' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-neutral-300 hover:text-amber-400'
                }`}
              >
                <span>BLOG</span>
                <ChevronDown className="w-3 h-3 opacity-60 group-hover:rotate-180 transition-transform" />
              </a>
              <div className="absolute top-full left-0 hidden group-hover:block w-52 bg-neutral-900 border border-neutral-800 shadow-xl py-2 rounded-b-md">
                <a href="#instagram-section" className="block px-4 py-2 text-neutral-300 hover:bg-neutral-800 hover:text-amber-400 text-xs normal-case">
                  Community Showcase
                </a>
                <a href="#brands-section" className="block px-4 py-2 text-neutral-300 hover:bg-neutral-800 hover:text-amber-400 text-xs normal-case">
                  Brand Collaborations
                </a>
              </div>
            </div>

            {/* CONTACT US */}
            <div>
              <a
                id="nav-link-contact"
                href="#footer-section"
                onClick={() => setActiveMenu('CONTACT US')}
                className={`flex items-center space-x-1 py-3 transition ${
                  activeMenu === 'CONTACT US' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-neutral-300 hover:text-amber-400'
                }`}
              >
                <span>CONTACT US</span>
              </a>
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-neutral-950 border-t border-neutral-800 px-4 py-4 space-y-3">
          {/* Mobile Search */}
          <div className="relative flex items-center mb-3">
            <Search className="absolute left-3 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search shirts..."
              className="w-full bg-neutral-900 text-white placeholder-neutral-400 text-xs pl-9 pr-4 py-2 rounded-full border border-neutral-800 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex flex-col space-y-2 text-sm font-semibold uppercase tracking-wider">
            <a
              href="#hero-section"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded hover:bg-neutral-900 text-amber-400"
            >
              HOME
            </a>
            <a
              href="#products-section"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded hover:bg-neutral-900 text-neutral-300"
            >
              SHOP PRODUCTS
            </a>
            <a
              href="#instagram-section"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded hover:bg-neutral-900 text-neutral-300"
            >
              INSTAGRAM FANS
            </a>
            <a
              href="#footer-section"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded hover:bg-neutral-900 text-neutral-300"
            >
              CONTACT US
            </a>
          </div>

          <div className="pt-3 border-t border-neutral-800 flex flex-col space-y-2">
            <button
              onClick={() => {
                onOpenCustomizer();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-amber-400 text-black font-bold text-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>CUSTOM POD STUDIO</span>
            </button>
            {onOpenSettings && (
              <button
                onClick={() => {
                  onOpenSettings();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center space-x-2 py-2 rounded-lg border border-neutral-700 text-neutral-300 text-xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Edit Shop Info</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
