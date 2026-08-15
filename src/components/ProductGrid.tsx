import React, { useState } from 'react';
import { Star, ShoppingBag, Eye, Heart, Check, Plane, Dog, Sun, Snowflake, Briefcase } from 'lucide-react';
import { Product, StoreSettings } from '../types/store';
import { TShirtMockup } from './TShirtMockup';

interface ProductGridProps {
  products: Product[];
  settings: StoreSettings;
  activeCategory?: string;
  selectedCategory?: string;
  onSelectCategory: (category: string) => void;
  onQuickView: (product: Product) => void;
  onAddToCart?: (product: Product, size?: string) => void;
  onQuickAdd?: (product: Product) => void;
  onToggleWishlist: (productIdOrProduct: any) => void;
  wishlistProductIds?: string[];
  isWishlisted?: (productId: string) => boolean;
  searchQuery?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products = [],
  settings,
  activeCategory,
  selectedCategory,
  onSelectCategory,
  onQuickView,
  onAddToCart,
  onQuickAdd,
  onToggleWishlist,
  wishlistProductIds = [],
  isWishlisted,
  searchQuery = '',
}) => {
  const [visibleCount, setVisibleCount] = useState(16);
  const [addedAnimationId, setAddedAnimationId] = useState<string | null>(null);

  const currentCategory = activeCategory || selectedCategory || 'all';

  // Filter products by category/badge/gender and search query
  const filteredProducts = products.filter((item) => {
    let matchesCat = false;
    if (currentCategory === 'all') {
      matchesCat = true;
    } else if (currentCategory === 'new-arrival') {
      matchesCat = item.badge === 'NEW ARRIVAL' || item.category === 'new-arrival';
    } else if (currentCategory === 'best-seller') {
      matchesCat = item.badge === 'BEST SELLER' || item.category === 'best-seller';
    } else if (currentCategory === 'featured' || currentCategory === 'future') {
      matchesCat = item.badge === 'FEATURED' || item.category === 'featured';
    } else if (currentCategory === 'women') {
      matchesCat = item.gender === 'women';
    } else if (currentCategory === 'men') {
      matchesCat = item.gender === 'men';
    } else {
      // Fallback for direct banner / partner brand clicks (e.g. traveling, dog-lovers, summer-special, etc.)
      matchesCat = item.category.toLowerCase() === currentCategory.toLowerCase();
    }

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.category === 'dog-lovers' && (q.includes('dog') || q.includes('pet') || q.includes('paw'))) ||
      (item.category === 'traveling' && (q.includes('travel') || q.includes('wanderlust') || q.includes('trip'))) ||
      (item.category === 'summer-special' && (q.includes('summer') || q.includes('sun') || q.includes('floral'))) ||
      (item.category === 'winter-special' && (q.includes('winter') || q.includes('cold') || q.includes('snow'))) ||
      (item.category === 'valentines' && (q.includes('val') || q.includes('love') || q.includes('romance') || q.includes('glow'))) ||
      item.graphicType.toLowerCase().includes(q) ||
      (item.gender && item.gender.toLowerCase().includes(q)) ||
      (item.badge && item.badge.toLowerCase().includes(q));

    return matchesCat && matchesSearch;
  });

  const displayedProducts = filteredProducts.slice(0, visibleCount);

  const handleAdd = (product: Product) => {
    if (onQuickAdd) {
      onQuickAdd(product);
    } else if (onAddToCart) {
      onAddToCart(product);
    }
    setAddedAnimationId(product.id);
    setTimeout(() => {
      setAddedAnimationId(null);
    }, 1500);
  };

  const checkWishlisted = (productId: string) => {
    if (isWishlisted) return isWishlisted(productId);
    return wishlistProductIds.includes(productId);
  };

  const handleWishlistClick = (product: Product) => {
    onToggleWishlist(product.id);
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 8);
  };

  // Category menu requested by user:
  // "New Arrival, Best Seller, Featured (Future), Women's, Men's" (All T-Shirts as first tab)
  const categories = [
    { id: 'all', label: 'All T-Shirts' },
    { id: 'new-arrival', label: 'New Arrival' },
    { id: 'best-seller', label: 'Best Seller' },
    { id: 'featured', label: 'Featured' },
    { id: 'women', label: "Women's" },
    { id: 'men', label: "Men's" },
  ];

  return (
    <section id="products-section" className="py-12 md:py-20 bg-white select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-['Oswald'] font-bold text-neutral-900 tracking-wider uppercase">
            OUR PRODUCTS
          </h2>
          <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-neutral-400 uppercase mt-1.5">
            HANDPICKED CUSTOM GRAPHICS & DIRECT-TO-GARMENT PRINTS
          </p>

          {/* Clean Category Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-6 text-xs sm:text-sm font-bold uppercase tracking-wider">
            {categories.map((cat, idx) => {
              const isActive = currentCategory === cat.id;
              return (
                <React.Fragment key={cat.id}>
                  <button
                    id={`filter-tab-${cat.id}`}
                    onClick={() => onSelectCategory(cat.id)}
                    className={`inline-flex items-center px-4 py-2 rounded-full transition-all duration-200 ${
                      isActive
                        ? 'bg-neutral-900 text-amber-400 shadow-md font-black scale-105'
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                  {idx < categories.length - 1 && (
                    <span className="text-neutral-200 hidden md:inline">·</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Active Collection / Search Query Badge Filter Indicator */}
          {(currentCategory === 'winter-special' ||
            currentCategory === 'summer-special' ||
            currentCategory === 'traveling' ||
            currentCategory === 'dog-lovers' ||
            currentCategory === 'valentines' ||
            searchQuery.trim() !== '') && (
            <div className="mt-4 inline-flex items-center space-x-2 bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-1.5 rounded-full text-xs font-semibold animate-fade-in">
              <span>
                Filtered by:{' '}
                <strong className="uppercase">
                  {searchQuery.trim()
                    ? `Search "${searchQuery}"`
                    : currentCategory.replace('-', ' ')}
                </strong>{' '}
                ({filteredProducts.length} items found)
              </span>
              <button
                onClick={() => onSelectCategory('all')}
                className="ml-1 text-[11px] font-bold text-neutral-600 hover:text-black underline"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>

        {/* 2-Column Mobile / 4-Column Desktop Product Grid */}
        {displayedProducts.length === 0 ? (
          <div className="text-center py-12 text-neutral-400">
            <p className="text-xs sm:text-sm font-semibold">No custom t-shirts match your active search or filter.</p>
            <button
              onClick={() => onSelectCategory('all')}
              className="mt-3 px-4 sm:px-5 py-2 sm:py-2.5 bg-neutral-900 text-white rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider hover:bg-black transition"
            >
              View All T-Shirts
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 sm:gap-x-6 gap-y-6 sm:gap-y-12">
            {displayedProducts.map((product) => {
              const isWish = checkWishlisted(product.id);
              const isJustAdded = addedAnimationId === product.id;

              return (
                <div
                  key={product.id}
                  id={`product-card-${product.id}`}
                  className="group flex flex-col items-center text-center select-none"
                >
                  {/* Product T-Shirt Image / Mockup Card with Hover & Tap Actions */}
                  <div
                    onClick={() => onQuickView(product)}
                    className="relative w-full aspect-square max-w-[260px] flex items-center justify-center p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-neutral-50/70 border border-neutral-100 group-hover:border-neutral-200 group-hover:shadow-lg transition-all duration-300 cursor-pointer"
                  >
                    {/* Badge */}
                    {product.badge && (
                      <span className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20 text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-neutral-900 text-white px-1.5 sm:px-2 py-0.5 rounded shadow-sm">
                        {product.badge}
                      </span>
                    )}

                    {/* Wishlist Button (top right) */}
                    <button
                      id={`product-wishlist-btn-${product.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWishlistClick(product);
                      }}
                      className={`absolute top-2 right-2 sm:top-3 sm:right-3 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200 ${
                        isWish
                          ? 'bg-rose-50 text-rose-500 shadow-sm scale-110'
                          : 'bg-white/80 text-neutral-400 hover:text-rose-500 hover:bg-white shadow-sm opacity-90 group-hover:opacity-100'
                      }`}
                      title={isWish ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    >
                      <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWish ? 'fill-rose-500' : ''}`} />
                    </button>

                    {/* T-Shirt Mockup */}
                    <div className="w-full h-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                      <TShirtMockup
                        shirtColor={product.shirtColor}
                        graphicType={product.graphicType}
                        graphicUrl={product.graphicUrl}
                        isGlowInDark={product.isGlowInDark}
                        className="w-full"
                      />
                    </div>

                    {/* Hover & Tap Floating Action Bar */}
                    <div className="absolute inset-x-2 sm:inset-x-3 bottom-2 sm:bottom-3 flex items-center justify-center space-x-1 sm:space-x-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-20">
                      <button
                        id={`product-quickview-btn-${product.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickView(product);
                        }}
                        className="bg-white hover:bg-neutral-900 text-neutral-800 hover:text-white p-1.5 sm:p-2 rounded-full shadow-md transition active:scale-95"
                        title="Quick View Sizing & DTG Specs"
                      >
                        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>

                      <button
                        id={`product-addcart-btn-${product.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdd(product);
                        }}
                        className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full font-semibold text-[10px] sm:text-xs flex items-center space-x-1 shadow-md transition active:scale-95 ${
                          isJustAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-400 hover:bg-amber-500 text-black'
                        }`}
                        title="Add to Cart"
                      >
                        {isJustAdded ? (
                          <>
                            <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span>Added!</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span className="hidden sm:inline">Add to Cart</span>
                            <span className="sm:hidden">Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Star Rating */}
                  <div className="flex items-center space-x-0.5 sm:space-x-1 mt-2.5 sm:mt-4 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  {/* Product Title (Smaller on mobile) */}
                  <h3
                    onClick={() => onQuickView(product)}
                    className="text-[11px] sm:text-xs md:text-sm font-semibold text-neutral-800 hover:text-amber-600 transition cursor-pointer mt-1 sm:mt-1.5 line-clamp-1 max-w-[240px]"
                  >
                    {product.name}
                  </h3>

                  {/* Price Display in INR */}
                  <div className="flex items-center space-x-1.5 sm:space-x-2 mt-0.5 sm:mt-1">
                    <span className="text-[11px] sm:text-xs md:text-sm font-bold text-neutral-900">
                      {settings.currencySymbol}
                      {product.price.toFixed(2)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-[9px] sm:text-[11px] text-neutral-400 line-through">
                        {settings.currencySymbol}
                        {product.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* LOAD MORE PRODUCTS Button */}
        {visibleCount < filteredProducts.length && (
          <div className="flex justify-center mt-12 md:mt-16">
            <button
              id="load-more-products-btn"
              onClick={handleLoadMore}
              className="bg-neutral-950 hover:bg-neutral-800 text-white font-['Oswald'] font-bold text-xs tracking-widest px-8 py-3 rounded-full uppercase shadow-md hover:shadow-lg transition-all duration-300 active:scale-95"
            >
              LOAD MORE T-SHIRTS
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
