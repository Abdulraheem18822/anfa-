import React from 'react';
import { promoBanners } from '../data/mockData';
import { TShirtMockup } from './TShirtMockup';
import { Product, PromoBanner } from '../types/store';

interface PromoCardsProps {
  promos?: PromoBanner[];
  onShopCategory?: (category: string) => void;
  onSelectPromo?: (graphicType: string, category: string) => void;
  onQuickView?: (product: Product) => void;
}

export const PromoCards: React.FC<PromoCardsProps> = ({
  promos = promoBanners,
  onShopCategory,
  onSelectPromo,
}) => {
  const handlePromoClick = (promo: PromoBanner) => {
    if (onShopCategory) {
      onShopCategory(promo.linkCategory);
    }
    if (onSelectPromo) {
      onSelectPromo(promo.graphicType, promo.linkCategory);
    }
  };

  // Retro starburst "New" badge SVG
  const renderNewBadge = () => (
    <div className="absolute top-4 left-4 z-20 flex items-center justify-center select-none">
      <svg viewBox="0 0 60 60" className="w-11 h-11 drop-shadow-sm">
        {/* Starburst rays */}
        <g fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.85">
          <circle cx="30" cy="30" r="24" strokeDasharray="3 2" />
          <path d="M 30 2 L 30 8 M 30 52 L 30 58 M 2 30 L 8 30 M 52 30 L 58 30 M 10 10 L 14 14 M 46 46 L 50 50 M 10 50 L 14 46 M 46 14 L 50 10" />
        </g>
        <text
          x="30"
          y="35"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="14"
          fontFamily="'Playfair Display', cursive, serif"
          fontStyle="italic"
          fontWeight="700"
        >
          New
        </text>
      </svg>
    </div>
  );

  return (
    <section id="promo-section" className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3">
        {promos.map((promo) => (
          <div
            key={promo.id}
            className="relative flex flex-col items-center justify-between p-6 sm:p-8 lg:p-10 transition-all duration-300 group overflow-hidden"
            style={{ backgroundColor: promo.bgColor }}
          >
            {/* Ambient lighting highlight */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/10 pointer-events-none" />

            {/* Retro "New" Starburst Badge */}
            {renderNewBadge()}

            {/* Main T-Shirt Mockup */}
            <div className="relative z-10 w-full max-w-[240px] sm:max-w-[270px] my-6 transition-transform duration-500 group-hover:scale-105">
              <TShirtMockup
                shirtColor={promo.tshirtColor}
                graphicType={promo.graphicType}
                isGlowInDark={promo.isGlowInDark}
                className="w-full"
              />
            </div>

            {/* Bottom "SHOP NOW" White Pill Button */}
            <div className="relative z-10 w-full flex justify-center mt-2">
              <button
                id={`promo-shop-btn-${promo.id}`}
                onClick={() => handlePromoClick(promo)}
                className="bg-white hover:bg-neutral-950 text-neutral-900 hover:text-white font-['Oswald'] font-bold text-xs tracking-widest px-8 py-2.5 rounded-full uppercase shadow-md transition-all duration-300 hover:shadow-xl active:scale-95"
              >
                {promo.btnText}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
