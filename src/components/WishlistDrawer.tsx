import React from 'react';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Product, StoreSettings } from '../types/store';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistItems: Product[];
  settings: StoreSettings;
  onRemoveFromWishlist: (productId: string) => void;
  onMoveToCart: (product: Product) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  wishlistItems,
  settings,
  onRemoveFromWishlist,
  onMoveToCart,
}) => {
  if (!isOpen) return null;

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
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              <h2 className="font-['Oswald'] font-bold text-lg tracking-wider uppercase">
                SAVED ITEMS ({wishlistItems.length})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-neutral-400 hover:text-white transition"
              aria-label="Close wishlist"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {wishlistItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-neutral-400 space-y-3">
                <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-rose-300" />
                </div>
                <p className="text-sm font-semibold text-neutral-700">Your wishlist is empty</p>
                <p className="text-xs text-neutral-400 max-w-xs">
                  Tap the heart icon on any t-shirt design to save your favorites for later.
                </p>
                <button
                  onClick={onClose}
                  className="mt-3 py-2.5 px-6 bg-neutral-900 hover:bg-black text-white font-semibold text-xs rounded-xl transition"
                >
                  Start Exploring
                </button>
              </div>
            ) : (
              wishlistItems.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center space-x-3.5 p-3 rounded-xl border border-neutral-100 bg-neutral-50/50 hover:bg-neutral-50 transition"
                >
                  {/* Swatch preview */}
                  <div
                    className="w-16 h-16 rounded-lg border border-neutral-200 flex-shrink-0 flex items-center justify-center text-[10px] font-bold shadow-inner"
                    style={{ backgroundColor: product.availableColors[0]?.hex || '#FFFFFF' }}
                  >
                    <span className={product.availableColors[0]?.hex === '#FFFFFF' ? 'text-neutral-800' : 'text-white'}>
                      {product.badge || 'POD'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-neutral-900 truncate font-['Montserrat',sans-serif]">
                      {product.name}
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      Category: <span className="text-neutral-700 capitalize">{product.category}</span>
                    </p>
                    <p className="text-xs font-bold text-neutral-900 mt-1">
                      {settings.currencySymbol}
                      {product.price.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex flex-col space-y-2 items-end">
                    <button
                      onClick={() => onRemoveFromWishlist(product.id)}
                      className="text-neutral-400 hover:text-rose-500 transition p-1"
                      title="Remove from saved"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        onMoveToCart(product);
                      }}
                      className="px-3 py-1.5 bg-neutral-900 hover:bg-black text-white text-[11px] font-bold rounded-lg flex items-center space-x-1 transition"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {wishlistItems.length > 0 && (
            <div className="p-6 border-t border-neutral-200 bg-white">
              <button
                onClick={onClose}
                className="w-full py-3 bg-neutral-900 hover:bg-black text-white font-['Oswald'] font-bold text-xs tracking-wider uppercase rounded-xl transition"
              >
                RETURN TO STORE
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
