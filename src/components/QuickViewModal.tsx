import React, { useState } from 'react';
import { X, Star, ShoppingBag, Heart, Check, Sparkles } from 'lucide-react';
import { Product, StoreSettings } from '../types/store';
import { TShirtMockup } from './TShirtMockup';

interface QuickViewModalProps {
  product: Product | null;
  settings: StoreSettings;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, selectedColorHex: string, selectedColorName: string, selectedSize: string, quantity: number) => void;
  onToggleWishlist: (product: Product) => void;
  isWishlisted: boolean;
  onOpenCustomizer?: (product: Product) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  settings,
  isOpen,
  onClose,
  onAddToCart,
  onToggleWishlist,
  isWishlisted,
  onOpenCustomizer,
}) => {
  if (!isOpen || !product) return null;

  const [selectedColor, setSelectedColor] = useState(
    product.availableColors[0] || { name: product.shirtColorName, hex: product.shirtColor }
  );
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[1] || product.sizes[0] || 'M');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'shipping'>('details');
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = () => {
    onAddToCart(product, selectedColor.hex, selectedColor.name, selectedSize, quantity);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      onClose();
    }, 900);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl relative grid grid-cols-1 md:grid-cols-2 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="quickview-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left: Product Mockup View with Selected Color */}
        <div className="bg-neutral-50/80 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-neutral-100 relative">
          <div className="w-full max-w-[260px] aspect-square flex items-center justify-center">
            <TShirtMockup
              shirtColor={selectedColor.hex}
              graphicType={product.graphicType}
              graphicUrl={product.graphicUrl}
              isGlowInDark={product.isGlowInDark}
              className="w-full"
            />
          </div>

          {/* Quick POD Customizer Trigger */}
          {onOpenCustomizer && (
            <button
              onClick={() => {
                onClose();
                onOpenCustomizer(product);
              }}
              className="mt-3 flex items-center space-x-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-full border border-amber-200/60 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Customize in POD Studio</span>
            </button>
          )}
        </div>

        {/* Right: Product Details & Purchase Form */}
        <div className="p-6 md:p-8 flex flex-col justify-between max-h-[85vh] overflow-y-auto">
          <div>
            {/* Category & Rating */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                {product.category} collection
              </span>
              <div className="flex items-center space-x-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
                <span className="text-[11px] font-medium text-neutral-500 ml-1">
                  ({product.reviewCount})
                </span>
              </div>
            </div>

            {/* Product Title */}
            <h2 className="text-lg md:text-xl font-bold text-neutral-900 font-['Montserrat',sans-serif]">
              {product.name}
            </h2>

            {/* Price */}
            <div className="flex items-center space-x-3 mt-2">
              <span className="text-xl font-black text-amber-600 font-['Oswald']">
                {settings.currencySymbol}
                {product.price.toFixed(2)}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-neutral-400 line-through">
                  {settings.currencySymbol}
                  {product.originalPrice.toFixed(2)}
                </span>
              )}
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                In Stock (Ready to Print)
              </span>
            </div>

            {/* Color Swatch Selector */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-neutral-700">
                  Color: <span className="font-bold text-neutral-900">{selectedColor.name}</span>
                </span>
              </div>
              <div className="flex items-center space-x-2.5">
                {product.availableColors.map((col) => (
                  <button
                    key={col.hex}
                    id={`color-swatch-${col.hex.replace('#', '')}`}
                    onClick={() => setSelectedColor(col)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      selectedColor.hex === col.hex
                        ? 'border-amber-500 scale-110 shadow-md ring-2 ring-amber-300/50'
                        : 'border-neutral-300 hover:border-neutral-400'
                    }`}
                    style={{ backgroundColor: col.hex }}
                    title={col.name}
                  />
                ))}
              </div>
            </div>

            {/* Size Selector */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-neutral-700">
                  Size: <span className="font-bold text-neutral-900">{selectedSize}</span>
                </span>
                <span className="text-[11px] text-neutral-400 hover:text-neutral-600 cursor-pointer underline">
                  Size Guide
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((sz) => (
                  <button
                    key={sz}
                    id={`size-btn-${sz}`}
                    onClick={() => setSelectedSize(sz)}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition ${
                      selectedSize === sz
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mt-5 flex items-center space-x-4">
              <span className="text-xs font-semibold text-neutral-700">Quantity:</span>
              <div className="flex items-center border border-neutral-300 rounded-lg overflow-hidden">
                <button
                  id="qty-minus-btn"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-bold transition"
                >
                  -
                </button>
                <span className="px-4 py-1 text-xs font-bold text-neutral-900 min-w-[2rem] text-center">
                  {quantity}
                </span>
                <button
                  id="qty-plus-btn"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-bold transition"
                >
                  +
                </button>
              </div>
            </div>

            {/* Tabs: Description / Specs */}
            <div className="mt-5 border-t border-neutral-100 pt-3">
              <div className="flex space-x-4 text-xs font-semibold text-neutral-400 border-b border-neutral-100 pb-1">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`pb-1 ${activeTab === 'details' ? 'text-amber-600 border-b-2 border-amber-600' : 'hover:text-neutral-700'}`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab('specs')}
                  className={`pb-1 ${activeTab === 'specs' ? 'text-amber-600 border-b-2 border-amber-600' : 'hover:text-neutral-700'}`}
                >
                  Material & Fit
                </button>
                <button
                  onClick={() => setActiveTab('shipping')}
                  className={`pb-1 ${activeTab === 'shipping' ? 'text-amber-600 border-b-2 border-amber-600' : 'hover:text-neutral-700'}`}
                >
                  Shipping
                </button>
              </div>
              <div className="py-2 text-xs text-neutral-600 leading-relaxed">
                {activeTab === 'details' && <p>{product.description}</p>}
                {activeTab === 'specs' && (
                  <ul className="list-disc list-inside space-y-1 text-neutral-600">
                    <li>100% Ring-Spun Combed Organic Cotton (220 GSM)</li>
                    <li>Double needle stitched neckline and sleeves</li>
                    <li>Eco-friendly DTG water-based Japanese pigment ink</li>
                    <li>Pre-shrunk fabric to prevent shrinking after wash</li>
                  </ul>
                )}
                {activeTab === 'shipping' && (
                  <p>
                    Printed on demand within 24-48 hours. Standard delivery 3-5 business days. Free shipping on orders over {settings.currencySymbol}{settings.freeDeliveryThreshold}.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons: Add To Cart & Wishlist */}
          <div className="pt-4 border-t border-neutral-100 flex items-center space-x-3">
            <button
              id="quickview-add-to-cart-btn"
              onClick={handleAdd}
              disabled={justAdded}
              className={`flex-1 py-3 px-4 rounded-xl font-['Oswald'] font-bold text-xs tracking-wider uppercase flex items-center justify-center space-x-2 transition-all shadow-md active:scale-95 ${
                justAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-400 hover:bg-amber-500 text-black'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>ADDED TO CART!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>ADD TO CART ({settings.currencySymbol}{(product.price * quantity).toFixed(2)})</span>
                </>
              )}
            </button>

            <button
              id="quickview-wishlist-toggle-btn"
              onClick={() => onToggleWishlist(product)}
              className={`p-3 rounded-xl border transition ${
                isWishlisted
                  ? 'bg-rose-50 border-rose-200 text-rose-500'
                  : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
              }`}
              title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
