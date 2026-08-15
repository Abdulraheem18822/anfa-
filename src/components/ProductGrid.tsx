import React, { useState } from 'react';
import { Star, ShoppingBag, Eye, Heart, Sparkles, Check } from 'lucide-react';
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
  onOpenCustomizer?: () => void;
  onOpenCustomizerWithProduct?: (product: Product) => void;
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
  onOpenCustomizer,
  onOpenCustomizerWithProduct,
  searchQuery = '',
}) => {
  const [visibleCount, setVisibleCount] = useState(8);
  const [addedAnimationId, setAddedAnimationId] = useState<string | null>(null);

  const currentCategory = activeCategory || selectedCategory || 'all';

  // Filter products by category and search
  const filteredProducts = products.filter((item) => {
    const matchesCat =
      currentCategory === 'all' ||
      item.category === currentCategory ||
      (currentCategory === 'men' && (item.gender === 'men' || item.gender === 'unisex')) ||
      (currentCategory === 'women' && (item.gender === 'women' || item.gender === 'unisex'));

    const matchesSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.graphicType.toLowerCase().includes(searchQuery.toLowerCase());

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
    setVisibleCount((prev) => prev + 4);
  };

  return (
    <section id="products-section" className="py-16 md:py-24 bg-white select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-['Oswald'] font-bold text-neutral-900 tracking-wider uppercase">
            OUR PRODUCTS
          </h2>
          <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-neutral-400 uppercase mt-2">
            HAND-PICKED FROM THE BEST DESIGNERS & CUSTOM CREATORS
          </p>

          {/* Category Filter Tabs (New Arrivals | Best Seller | Featured | View All) */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-6 text-xs sm:text-sm font-bold uppercase tracking-wider">
            <button
              id="filter-tab-all"
              onClick={() => onSelectCategory('all')}
              className={`pb-1.5 transition-all relative ${
                currentCategory === 'all'
                  ? 'text-amber-500 border-b-2 border-amber-500'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              All T-Shirts
            </button>
            <span className="text-neutral-300 hidden sm:inline">|</span>
            <button
              id="filter-tab-new"
              onClick={() => onSelectCategory('new')}
              className={`pb-1.5 transition-all relative ${
                currentCategory === 'new'
                  ? 'text-amber-500 border-b-2 border-amber-500'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              New Arrivals
            </button>
            <span className="text-neutral-300 hidden sm:inline">|</span>
            <button
              id="filter-tab-bestseller"
              onClick={() => onSelectCategory('bestseller')}
              className={`pb-1.5 transition-all relative ${
                currentCategory === 'bestseller'
                  ? 'text-amber-500 border-b-2 border-amber-500'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Best Seller
            </button>
            <span className="text-neutral-300 hidden sm:inline">|</span>
            <button
              id="filter-tab-featured"
              onClick={() => onSelectCategory('featured')}
              className={`pb-1.5 transition-all relative ${
                currentCategory === 'featured'
                  ? 'text-amber-500 border-b-2 border-amber-500'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Featured
            </button>
            <span className="text-neutral-300 hidden sm:inline">|</span>
            <button
              id="filter-tab-men"
              onClick={() => onSelectCategory('men')}
              className={`pb-1.5 transition-all relative ${
                currentCategory === 'men'
                  ? 'text-amber-500 border-b-2 border-amber-500'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Men
            </button>
            <span className="text-neutral-300 hidden sm:inline">|</span>
            <button
              id="filter-tab-women"
              onClick={() => onSelectCategory('women')}
              className={`pb-1.5 transition-all relative ${
                currentCategory === 'women'
                  ? 'text-amber-500 border-b-2 border-amber-500'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Women
            </button>
          </div>
        </div>

        {/* 4-Column Product Grid */}
        {displayedProducts.length === 0 ? (
          <div className="text-center py-12 text-neutral-400">
            <p className="text-sm font-semibold">No t-shirts match your active filter.</p>
            <button
              onClick={() => onSelectCategory('all')}
              className="mt-3 px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider"
            >
              View All T-Shirts
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12 sm:gap-y-16">
            {displayedProducts.map((product) => {
              const isWish = checkWishlisted(product.id);
              const isJustAdded = addedAnimationId === product.id;

              return (
                <div
                  key={product.id}
                  id={`product-card-${product.id}`}
                  className="group flex flex-col items-center text-center select-none"
                >
                  {/* Product T-Shirt Image / Mockup Card with Hover Actions */}
                  <div className="relative w-full aspect-square max-w-[260px] flex items-center justify-center p-3 rounded-2xl bg-neutral-50/70 border border-neutral-100 group-hover:border-neutral-200 group-hover:shadow-lg transition-all duration-300">
                    {/* Badge */}
                    {product.badge && (
                      <span className="absolute top-3 left-3 z-20 text-[9px] font-black uppercase tracking-wider bg-neutral-900 text-white px-2 py-0.5 rounded shadow-sm">
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
                      className={`absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200 ${
                        isWish
                          ? 'bg-rose-50 text-rose-500 shadow-sm scale-110'
                          : 'bg-white/80 text-neutral-400 hover:text-rose-500 hover:bg-white shadow-sm opacity-80 group-hover:opacity-100'
                      }`}
                      title={isWish ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    >
                      <Heart className={`w-4 h-4 ${isWish ? 'fill-rose-500' : ''}`} />
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

                    {/* Hover Floating Action Bar */}
                    <div className="absolute inset-x-3 bottom-3 flex items-center justify-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-20">
                      <button
                        id={`product-quickview-btn-${product.id}`}
                        onClick={() => onQuickView(product)}
                        className="bg-white hover:bg-neutral-900 text-neutral-800 hover:text-white p-2 rounded-full shadow-md transition active:scale-95"
                        title="Quick View Sizing & Specs"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        id={`product-addcart-btn-${product.id}`}
                        onClick={() => handleAdd(product)}
                        className={`px-3 py-1.5 rounded-full font-semibold text-xs flex items-center space-x-1 shadow-md transition active:scale-95 ${
                          isJustAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-400 hover:bg-amber-500 text-black'
                        }`}
                        title="Add to Cart"
                      >
                        {isJustAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added!</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Add to Cart</span>
                          </>
                        )}
                      </button>

                      {(onOpenCustomizer || onOpenCustomizerWithProduct) && (
                        <button
                          id={`product-customize-btn-${product.id}`}
                          onClick={() => {
                            if (onOpenCustomizerWithProduct) onOpenCustomizerWithProduct(product);
                            else if (onOpenCustomizer) onOpenCustomizer();
                          }}
                          className="bg-neutral-900 hover:bg-black text-amber-400 p-2 rounded-full shadow-md transition active:scale-95"
                          title="Open in POD Customizer Studio"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Star Rating */}
                  <div className="flex items-center space-x-1 mt-4 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  {/* Product Title */}
                  <h3
                    onClick={() => onQuickView(product)}
                    className="text-xs sm:text-sm font-semibold text-neutral-800 hover:text-amber-600 transition cursor-pointer mt-1.5 line-clamp-1"
                  >
                    {product.name}
                  </h3>

                  {/* Price Display */}
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs sm:text-sm font-bold text-amber-600">
                      {settings.currencySymbol}
                      {product.price.toFixed(2)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-[11px] text-neutral-400 line-through">
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
              LOAD MORE PRODUCTS
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
