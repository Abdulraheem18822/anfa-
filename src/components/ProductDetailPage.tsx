import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Heart,
  ShoppingBag,
  Zap,
  Check,
  Truck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Layers,
  Star,
  Share2,
  Maximize2,
  Info,
} from 'lucide-react';
import { Product, StoreSettings } from '../types/store';
import { TShirtMockup } from './TShirtMockup';

interface ProductDetailPageProps {
  product: Product;
  settings: StoreSettings;
  onBack: () => void;
  onAddToCart: (
    product: Product,
    selectedColorHex?: string,
    selectedColorName?: string,
    selectedSize?: string,
    quantity?: number
  ) => void;
  onBuyNow?: (
    product: Product,
    selectedColorHex?: string,
    selectedColorName?: string,
    selectedSize?: string,
    quantity?: number
  ) => void;
  onToggleWishlist: (productId: string) => void;
  isWishlisted: boolean;
  allProducts?: Product[];
  onSelectProduct?: (product: Product) => void;
  onOpenPODStudio?: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  settings,
  onBack,
  onAddToCart,
  onBuyNow,
  onToggleWishlist,
  isWishlisted,
  allProducts = [],
  onSelectProduct,
  onOpenPODStudio,
}) => {
  // Available color list from product or fallback defaults
  const availableColors =
    product.availableColors && product.availableColors.length > 0
      ? product.availableColors
      : [
          { name: 'Pitch Black', hex: '#1E1E24' },
          { name: 'Pure White', hex: '#FFFFFF' },
          { name: 'Navy Blue', hex: '#1A2A44' },
          { name: 'Crimson Red', hex: '#991B1B' },
          { name: 'Bottle Green', hex: '#064E3B' },
          { name: 'Heather Grey', hex: '#6B7280' },
        ];

  const availableSizes =
    product.sizes && product.sizes.length > 0
      ? product.sizes
      : ['S', 'M', 'L', 'XL', '2XL', '3XL'];

  // Active selections
  const [selectedColor, setSelectedColor] = useState(
    availableColors.find((c) => c.hex === product.shirtColor) || availableColors[0]
  );
  const [selectedSize, setSelectedSize] = useState(availableSizes[0] || 'M');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'fabric' | 'shipping' | 'care'>('specs');
  const [isCopied, setIsCopied] = useState(false);
  const [isAddedSuccess, setIsAddedSuccess] = useState(false);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);

  // Scroll to top on mount or when product changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedColor(
      availableColors.find((c) => c.hex === product.shirtColor) || availableColors[0]
    );
    setSelectedSize(availableSizes[0] || 'M');
    setQuantity(1);
  }, [product.id]);

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const handleAddToCartClick = () => {
    onAddToCart(product, selectedColor.hex, selectedColor.name, selectedSize, quantity);
    setIsAddedSuccess(true);
    setTimeout(() => setIsAddedSuccess(false), 2200);
  };

  const handleBuyNowClick = () => {
    if (onBuyNow) {
      onBuyNow(product, selectedColor.hex, selectedColor.name, selectedSize, quantity);
    } else {
      onAddToCart(product, selectedColor.hex, selectedColor.name, selectedSize, quantity);
      setIsAddedSuccess(true);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `${product.name} | ${settings.storeName}`,
          text: `Check out the ${product.name} on ${settings.storeName}`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Related products
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && (p.category === product.category || p.gender === product.gender))
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-neutral-50/60 text-neutral-900 flex flex-col">
      {/* Top Breadcrumb & Navigation Bar */}
      <div className="bg-white border-b border-neutral-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <button
            id="back-to-store-btn"
            onClick={onBack}
            className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-700 hover:text-black transition group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to All T-Shirts</span>
          </button>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={handleShare}
              className="p-2 rounded-lg text-neutral-600 hover:text-black hover:bg-neutral-100 transition text-xs font-semibold flex items-center space-x-1.5"
              title="Share product link"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isCopied ? 'Link Copied!' : 'Share'}</span>
            </button>

            <button
              id="detail-wishlist-btn"
              onClick={() => onToggleWishlist(product.id)}
              className={`p-2 rounded-lg transition text-xs font-semibold flex items-center space-x-1.5 ${
                isWishlisted
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'text-neutral-600 hover:text-rose-600 hover:bg-rose-50/50'
              }`}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600' : ''}`} />
              <span className="hidden sm:inline">{isWishlisted ? 'Saved' : 'Wishlist'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Product Container with Luxury Border Frame */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 flex-1 w-full">
        {/* Breadcrumb text */}
        <div className="text-xs text-neutral-400 font-medium mb-6 flex items-center space-x-2">
          <span className="hover:text-black cursor-pointer" onClick={onBack}>
            Home
          </span>
          <span>/</span>
          <span className="hover:text-black cursor-pointer uppercase" onClick={onBack}>
            {product.category || 'T-Shirts'}
          </span>
          <span>/</span>
          <span className="text-neutral-700 font-bold truncate max-w-[200px] sm:max-w-none">
            {product.name}
          </span>
        </div>

        {/* Structured 2-Column Product Studio Box with Full Border Frame */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-neutral-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* LEFT: Interactive High-Fidelity Garment Visualizer */}
          <div className="lg:col-span-6 p-6 sm:p-10 bg-neutral-100/60 border-b lg:border-b-0 lg:border-r border-neutral-200 flex flex-col items-center justify-between relative select-none">
            {/* Badges / Glow tag */}
            <div className="w-full flex items-center justify-between mb-4 z-10">
              <div className="flex items-center space-x-2">
                {product.badge && (
                  <span className="px-3 py-1 bg-neutral-900 text-amber-400 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-md shadow-sm">
                    {product.badge}
                  </span>
                )}
                {product.isGlowInDark && (
                  <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-md flex items-center space-x-1 shadow-sm">
                    <Sparkles className="w-3 h-3 animate-spin" />
                    <span>Glow in Dark</span>
                  </span>
                )}
              </div>
              <span className="text-[11px] font-mono text-neutral-400 font-bold uppercase tracking-wider">
                SKU: {product.sku || `ANFA-${product.id.slice(0, 6)}`}
              </span>
            </div>

            {/* High-Resolution Dynamic Garment Mockup Stage */}
            <div className="relative w-full max-w-[420px] aspect-square my-auto flex items-center justify-center p-4">
              <TShirtMockup
                shirtColor={selectedColor.hex}
                graphicType={product.graphicType}
                graphicUrl={product.graphicUrl}
                printDimension={product.printDimension}
                isGlowInDark={product.isGlowInDark}
                showShadow={true}
                className="w-full h-full drop-shadow-2xl transition-all duration-300"
              />
            </div>

            {/* Live Visualizer Color Info Footer */}
            <div className="w-full mt-6 bg-white/80 backdrop-blur-xs border border-neutral-200 rounded-xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span
                  className="w-4 h-4 rounded-full border border-neutral-300 shadow-xs"
                  style={{ backgroundColor: selectedColor.hex }}
                />
                <span className="font-semibold text-neutral-800">
                  Colorway: {selectedColor.name}
                </span>
              </div>
              <span className="text-[11px] text-neutral-500 font-medium">
                {product.printDimension === '8x11'
                  ? '8" × 11" Chest Print (300 DPI)'
                  : product.printDimension === '11x18'
                  ? '11" × 18" Full Front Print (300 DPI)'
                  : '11" × 16" Oversized Print (300 DPI)'}
              </span>
            </div>
          </div>

          {/* RIGHT: Product Information, Size/Color Selection & Order Actions */}
          <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between">
            <div>
              {/* Product Header */}
              <div className="border-b border-neutral-100 pb-6 mb-6">
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-600 mb-2">
                  <span>ANFA PRINT WEAR SIGNATURE</span>
                  <span>•</span>
                  <span>{product.gender || 'UNISEX'}</span>
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-['Oswald'] font-bold text-neutral-900 tracking-tight uppercase leading-tight mb-3">
                  {product.name}
                </h1>

                {/* Rating & Reviews */}
                <div className="flex items-center space-x-3 text-xs mb-4">
                  <div className="flex items-center space-x-1 text-amber-500 font-bold">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="ml-1 text-neutral-800">{product.rating || 5}.0</span>
                  </div>
                  <span className="text-neutral-300">|</span>
                  <span className="text-neutral-500 font-medium">
                    {product.reviewCount || 24} Verified Buyer Reviews
                  </span>
                </div>

                {/* Price Display */}
                <div className="flex items-baseline space-x-3">
                  <span className="text-3xl sm:text-4xl font-['Oswald'] font-bold text-neutral-900">
                    {settings.currencySymbol}
                    {product.price.toLocaleString('en-IN')}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-lg sm:text-xl font-['Oswald'] text-neutral-400 line-through">
                      {settings.currencySymbol}
                      {product.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                  {discountPercent && (
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-black uppercase rounded-full tracking-wider">
                      {discountPercent}% OFF
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400 mt-1 font-medium">
                  Inclusive of all taxes & GST • Free express delivery across India
                </p>
              </div>

              {/* Garment Color Selection */}
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2.5">
                  Select Garment Color:{' '}
                  <span className="text-neutral-900 font-black">{selectedColor.name}</span>
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {availableColors.map((color) => {
                    const isSelected = selectedColor.hex === color.hex;
                    return (
                      <button
                        key={color.hex}
                        onClick={() => setSelectedColor(color)}
                        className={`group relative flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-neutral-300 shrink-0"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span>{color.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Garment Size Selection */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                    Select Garment Size:{' '}
                    <span className="text-neutral-900 font-black">{selectedSize}</span>
                  </label>
                  <button
                    onClick={() => setIsSizeChartOpen(true)}
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700 underline uppercase"
                  >
                    Size Chart & Fit Guide
                  </button>
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {availableSizes.map((size) => {
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`h-11 rounded-xl text-xs font-['Oswald'] font-bold uppercase tracking-wider transition-all flex items-center justify-center ${
                          isSelected
                            ? 'bg-neutral-900 text-amber-400 shadow-md font-black ring-2 ring-neutral-900'
                            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity & CTA Buttons */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-3">
                  {/* Quantity selector */}
                  <div className="flex items-center border border-neutral-300 rounded-xl bg-neutral-50 overflow-hidden h-12 w-32">
                    <button
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      className="w-10 h-full flex items-center justify-center text-neutral-600 hover:text-black font-bold text-base hover:bg-neutral-200 transition"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-bold text-sm text-neutral-900 font-mono">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((prev) => prev + 1)}
                      className="w-10 h-full flex items-center justify-center text-neutral-600 hover:text-black font-bold text-base hover:bg-neutral-200 transition"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    id="detail-add-to-cart-btn"
                    onClick={handleAddToCartClick}
                    className={`flex-1 h-12 rounded-xl font-['Oswald'] font-bold text-sm uppercase tracking-wider flex items-center justify-center space-x-2 transition-all active:scale-[0.98] ${
                      isAddedSuccess
                        ? 'bg-emerald-600 text-white'
                        : 'bg-neutral-900 hover:bg-black text-amber-400 shadow-md'
                    }`}
                  >
                    {isAddedSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Added to Cart!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Direct Buy Now Button */}
                <button
                  id="detail-buy-now-btn"
                  onClick={handleBuyNowClick}
                  className="w-full h-12 bg-amber-400 hover:bg-amber-500 text-black font-['Oswald'] font-bold text-sm uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 shadow-sm transition active:scale-[0.98]"
                >
                  <Zap className="w-4 h-4 fill-black" />
                  <span>Buy Now • Express Checkout</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-neutral-100 text-center">
                <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100">
                  <Truck className="w-4 h-4 mx-auto text-amber-600 mb-1" />
                  <span className="block text-[10px] font-bold text-neutral-800 uppercase">
                    3-5 Days Delivery
                  </span>
                  <span className="block text-[9px] text-neutral-400">All India Shipping</span>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100">
                  <ShieldCheck className="w-4 h-4 mx-auto text-amber-600 mb-1" />
                  <span className="block text-[10px] font-bold text-neutral-800 uppercase">
                    100% Bio Cotton
                  </span>
                  <span className="block text-[9px] text-neutral-400">240 GSM Fabric</span>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100">
                  <RotateCcw className="w-4 h-4 mx-auto text-amber-600 mb-1" />
                  <span className="block text-[10px] font-bold text-neutral-800 uppercase">
                    7 Days Exchange
                  </span>
                  <span className="block text-[9px] text-neutral-400">Easy Size Swap</span>
                </div>
              </div>
            </div>

            {/* Interactive Tabbed Product Details / Specs */}
            <div className="mt-8 pt-6 border-t border-neutral-200">
              <div className="flex border-b border-neutral-200 gap-4 text-xs font-bold uppercase tracking-wider pb-2">
                <button
                  onClick={() => setActiveTab('specs')}
                  className={`pb-2 border-b-2 transition ${
                    activeTab === 'specs'
                      ? 'border-neutral-900 text-neutral-900'
                      : 'border-transparent text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  Specifications
                </button>
                <button
                  onClick={() => setActiveTab('fabric')}
                  className={`pb-2 border-b-2 transition ${
                    activeTab === 'fabric'
                      ? 'border-neutral-900 text-neutral-900'
                      : 'border-transparent text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  Fabric & Fit
                </button>
                <button
                  onClick={() => setActiveTab('shipping')}
                  className={`pb-2 border-b-2 transition ${
                    activeTab === 'shipping'
                      ? 'border-neutral-900 text-neutral-900'
                      : 'border-transparent text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  Shipping & COD
                </button>
                <button
                  onClick={() => setActiveTab('care')}
                  className={`pb-2 border-b-2 transition ${
                    activeTab === 'care'
                      ? 'border-neutral-900 text-neutral-900'
                      : 'border-transparent text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  Wash Care
                </button>
              </div>

              <div className="pt-3 text-xs text-neutral-600 leading-relaxed min-h-[90px]">
                {activeTab === 'specs' && (
                  <div className="space-y-1.5">
                    <p className="font-medium text-neutral-800">{product.description || 'Crafted with premium high-density DTG print technique on heavyweight bio-washed cotton.'}</p>
                    <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
                      <div>
                        <strong className="text-neutral-800">Print Method:</strong> 300 DPI Direct-to-Garment
                      </div>
                      <div>
                        <strong className="text-neutral-800">Ink Durability:</strong> 50+ Washes Non-Fade
                      </div>
                      <div>
                        <strong className="text-neutral-800">Origin:</strong> Kolkata, West Bengal (India)
                      </div>
                      <div>
                        <strong className="text-neutral-800">Style:</strong> Unisex Streetwear Cut
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'fabric' && (
                  <div className="space-y-1">
                    <p>• <strong>100% Super-Combed Cotton</strong> for extra softness and long-lasting breathability.</p>
                    <p>• <strong>240 GSM Bio-Washed French Terry / Single Jersey</strong> fabric structure.</p>
                    <p>• Pre-shrunk fabric to prevent post-wash shrinkage.</p>
                    <p>• Reinforced double-needle stitching on neckline, sleeves, and hemline.</p>
                  </div>
                )}

                {activeTab === 'shipping' && (
                  <div className="space-y-1">
                    <p>• Dispatched within 24 to 48 hours from our production unit.</p>
                    <p>• Estimated delivery: <strong>3 to 5 business days</strong> nationwide.</p>
                    <p>• <strong>Cash on Delivery (COD)</strong> and UPI payments available at checkout.</p>
                    <p>• Real-time courier SMS tracking with Delhivery / Blue Dart.</p>
                  </div>
                )}

                {activeTab === 'care' && (
                  <div className="space-y-1">
                    <p>• Machine wash cold, inside-out with like colors.</p>
                    <p>• Use mild detergent; do not use chlorine bleach.</p>
                    <p>• Tumble dry low or hang dry in shade for longest graphic lifespan.</p>
                    <p>• Do not iron directly on the printed graphic (iron inside-out).</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Custom Design Callout Banner on Product Page */}
        <div className="mt-12 bg-neutral-900 rounded-2xl p-6 sm:p-8 text-white border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Want Your Own Artwork on This T-Shirt?</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-['Oswald'] font-bold uppercase tracking-tight">
              Create a 1-of-1 Custom Printed Shirt in Our Studio
            </h3>
            <p className="text-xs sm:text-sm text-neutral-300 mt-1 max-w-xl">
              Upload your custom PNG graphic with transparent background, adjust placement, and have it printed on 240 GSM cotton.
            </p>
          </div>
          <button
            onClick={onOpenPODStudio}
            className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-black font-['Oswald'] font-bold text-xs uppercase tracking-wider rounded-xl shrink-0 transition"
          >
            Launch Customizer
          </button>
        </div>

        {/* Related Products Showcase */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl sm:text-2xl font-['Oswald'] font-bold uppercase tracking-wider text-neutral-900">
                You May Also Like
              </h3>
              <button
                onClick={onBack}
                className="text-xs font-bold uppercase text-amber-600 hover:text-amber-700 underline"
              >
                View All
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onSelectProduct && onSelectProduct(rel)}
                  className="group bg-white rounded-2xl p-3 sm:p-4 border border-neutral-200 hover:border-neutral-300 hover:shadow-md transition cursor-pointer flex flex-col items-center text-center"
                >
                  <div className="w-full aspect-square max-w-[200px] flex items-center justify-center p-2 mb-3 bg-neutral-50 rounded-xl">
                    <TShirtMockup
                      shirtColor={rel.shirtColor}
                      graphicType={rel.graphicType}
                      graphicUrl={rel.graphicUrl}
                      isGlowInDark={rel.isGlowInDark}
                      className="w-full h-full transition-transform group-hover:scale-105"
                    />
                  </div>
                  <h4 className="font-['Oswald'] text-sm font-bold text-neutral-900 uppercase truncate w-full">
                    {rel.name}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="font-bold text-sm text-neutral-900">
                      {settings.currencySymbol}
                      {rel.price}
                    </span>
                    {rel.originalPrice && (
                      <span className="text-xs text-neutral-400 line-through">
                        {settings.currencySymbol}
                        {rel.originalPrice}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Size Chart Modal */}
      {isSizeChartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <h4 className="font-['Oswald'] text-lg font-bold uppercase tracking-wider text-neutral-900">
                Garment Size Chart (Inches)
              </h4>
              <button
                onClick={() => setIsSizeChartOpen(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>
            <div className="py-4">
              <p className="text-xs text-neutral-500 mb-3">
                All measurements are in inches. Standard regular / streetwear fit. For an oversized look, choose one size larger.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border border-neutral-200 rounded-lg overflow-hidden">
                  <thead className="bg-neutral-100 font-bold uppercase text-neutral-800">
                    <tr>
                      <th className="p-2.5 border-b">Size</th>
                      <th className="p-2.5 border-b">Chest</th>
                      <th className="p-2.5 border-b">Length</th>
                      <th className="p-2.5 border-b">Shoulder</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-neutral-700">
                    <tr>
                      <td className="p-2.5 font-bold">S (Small)</td>
                      <td className="p-2.5">38"</td>
                      <td className="p-2.5">27"</td>
                      <td className="p-2.5">17.5"</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">M (Medium)</td>
                      <td className="p-2.5">40"</td>
                      <td className="p-2.5">28"</td>
                      <td className="p-2.5">18.5"</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">L (Large)</td>
                      <td className="p-2.5">42"</td>
                      <td className="p-2.5">29"</td>
                      <td className="p-2.5">19.5"</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">XL (X-Large)</td>
                      <td className="p-2.5">44"</td>
                      <td className="p-2.5">30"</td>
                      <td className="p-2.5">20.5"</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">2XL (XX-Large)</td>
                      <td className="p-2.5">46"</td>
                      <td className="p-2.5">31"</td>
                      <td className="p-2.5">21.5"</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">3XL (XXX-Large)</td>
                      <td className="p-2.5">48"</td>
                      <td className="p-2.5">32"</td>
                      <td className="p-2.5">22.5"</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <button
              onClick={() => setIsSizeChartOpen(false)}
              className="w-full py-2.5 bg-neutral-900 text-white rounded-xl font-['Oswald'] font-bold text-xs uppercase tracking-wider hover:bg-black transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
