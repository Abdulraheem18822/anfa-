import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag, Eye, ArrowRight, Search } from 'lucide-react';
import { TShirtMockup } from './TShirtMockup';
import { Product, StoreSettings } from '../types/store';

interface HeroBannersProps {
  settings: StoreSettings;
  onQuickView?: (product: Product) => void;
  onAddToCart?: (product: Product, size?: string) => void;
  onExploreCategory?: (category: string) => void;
  onExploreCollection?: (category: string) => void;
  onSearchSubmit?: (query: string) => void;
}

export const HeroBanners: React.FC<HeroBannersProps> = ({
  settings,
  onQuickView,
  onAddToCart,
  onExploreCategory,
  onExploreCollection,
  onSearchSubmit,
}) => {
  const [leftSlideIndex, setLeftSlideIndex] = useState(0);
  const [rightSlideIndex, setRightSlideIndex] = useState(0);
  const [heroSearchInput, setHeroSearchInput] = useState('');

  const handleExplore = (cat: string) => {
    if (onExploreCategory) onExploreCategory(cat);
    if (onExploreCollection) onExploreCollection(cat);
  };

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearchInput.trim() && onSearchSubmit) {
      onSearchSubmit(heroSearchInput.trim());
      const gridEl = document.getElementById('products-section');
      if (gridEl) gridEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const womenTees: Product[] = [
    {
      id: 'hero-w-1',
      name: 'Summer Tropical Botanical Floral Garland T-Shirt',
      price: 999.0,
      shirtColor: '#FAFAFA',
      shirtColorName: 'Lily White',
      category: 'summer-special',
      gender: 'women',
      graphicType: 'floral-wreath',
      sizes: ['S', 'M', 'L', 'XL'],
      rating: 5,
      reviewCount: 78,
      image: '',
      description: 'Delicate wildflower wreath graphic with pastel blossoms on ring-spun combed organic cotton.',
      availableColors: [
        { name: 'Pure White', hex: '#FFFFFF' },
        { name: 'Soft Cream', hex: '#FFFBEB' },
        { name: 'Blush Pink', hex: '#FCE7F3' },
      ],
    },
    {
      id: 'hero-w-2',
      name: 'Valentine Glow Edition Skull Romance T-Shirt',
      price: 1599.0,
      shirtColor: '#FFFFFF',
      shirtColorName: 'Chalk White',
      category: 'valentines',
      gender: 'women',
      graphicType: 'peter-sagan-skull',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      rating: 5,
      reviewCount: 51,
      image: '',
      isGlowInDark: true,
      description: 'Limited Valentine Edition phosphorescent skull graphic with subtle heart motifs.',
      availableColors: [
        { name: 'Pure White', hex: '#FFFFFF' },
        { name: 'Pitch Black', hex: '#18181B' },
      ],
    },
  ];

  const menTees: Product[] = [
    {
      id: 'hero-m-1',
      name: 'Mountain Wanderer Traveling T-Shirt',
      price: 899.0,
      originalPrice: 1299.0,
      shirtColor: '#FF6600',
      shirtColorName: 'Sunset Orange',
      category: 'traveling',
      gender: 'men',
      graphicType: 'eat-my-dust',
      sizes: ['S', 'M', 'L', 'XL', '2XL'],
      rating: 5,
      reviewCount: 42,
      image: '',
      description: 'Engineered with 240 GSM breathable combed cotton and high-velocity DTG chest print.',
      availableColors: [
        { name: 'Sunset Orange', hex: '#FF6600' },
        { name: 'Pure White', hex: '#FFFFFF' },
        { name: 'Pitch Black', hex: '#18181B' },
      ],
    },
    {
      id: 'hero-m-2',
      name: 'Paws & Adventure Dog Lovers Heavyweight T-Shirt',
      price: 1199.0,
      shirtColor: '#F8F9FA',
      shirtColorName: 'Optic White',
      category: 'dog-lovers',
      gender: 'men',
      graphicType: 'portrait-che',
      sizes: ['S', 'M', 'L', 'XL', '2XL'],
      rating: 5,
      reviewCount: 39,
      image: '',
      description: 'Dedicated to dog enthusiasts and loyal fur-baby parents with breathable DTG ink.',
      availableColors: [
        { name: 'Optic White', hex: '#F8F9FA' },
        { name: 'Sand Khaki', hex: '#E2D9CC' },
      ],
    },
  ];

  const activeWomenTee = womenTees[leftSlideIndex];
  const activeMenTee = menTees[rightSlideIndex];

  return (
    <section id="hero-section" className="relative w-full overflow-hidden bg-neutral-900 select-none">
      {/* Top Banner: Wide Search Engine Bar without Unforgettable headline & without trending searches */}
      <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border-b border-neutral-800 py-4 px-4 sm:px-6 lg:px-8 text-center relative z-20">
        <div className="max-w-4xl mx-auto">
          {/* Wide Search Engine Spanning Nicely */}
          <form
            id="hero-search-engine-form"
            onSubmit={handleHeroSearch}
            className="w-full relative flex items-center shadow-2xl"
          >
            <div className="relative w-full flex items-center">
              <Search className="w-4 sm:w-5 h-4 sm:h-5 text-amber-400 absolute left-4 pointer-events-none" />
              <input
                id="hero-wide-search-input"
                type="text"
                value={heroSearchInput}
                onChange={(e) => {
                  setHeroSearchInput(e.target.value);
                  if (onSearchSubmit) onSearchSubmit(e.target.value);
                }}
                placeholder="Search Traveling, Dog Lovers, Summer Special, Winter Special, Valentine..."
                className="w-full pl-11 sm:pl-12 pr-28 sm:pr-36 py-3 sm:py-3.5 bg-neutral-800/95 hover:bg-neutral-800 focus:bg-neutral-950 text-white placeholder-neutral-400 text-xs sm:text-sm rounded-full border-2 border-neutral-700 focus:border-amber-400 focus:outline-none transition shadow-inner font-medium"
              />
              <button
                id="hero-wide-search-submit-btn"
                type="submit"
                className="absolute right-1.5 sm:right-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-amber-400 hover:bg-amber-500 text-black font-['Oswald'] font-bold text-xs sm:text-sm tracking-wider uppercase rounded-full transition shadow-md active:scale-95 flex items-center space-x-1.5"
              >
                <span>SEARCH</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Split Carousel Hero Display: Side by Side on all screen sizes */}
      <div className="grid grid-cols-2 min-h-[380px] sm:min-h-[460px] md:min-h-[500px]">
        {/* ================= LEFT HERO: WOMEN (TURQUOISE / TEAL) ================= */}
        <div
          className="relative flex flex-col items-center justify-between p-3 sm:p-6 md:p-10 lg:p-12 overflow-hidden transition-colors duration-500 group border-r border-white/10"
          style={{ backgroundColor: '#00A8B5' }}
        >
          {/* Subtle lighting / texture overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/15 via-transparent to-white/10 pointer-events-none" />

          {/* Left Arrow Navigation */}
          <button
            id="hero-left-arrow-btn"
            onClick={() => setLeftSlideIndex((prev) => (prev === 0 ? womenTees.length - 1 : prev - 1))}
            className="absolute left-1.5 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm flex items-center justify-center transition active:scale-90 shadow-md"
            aria-label="Previous T-shirt"
          >
            <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>

          {/* Top category label */}
          <div className="w-full flex justify-between items-center z-10">
            <span className="text-[9px] sm:text-[11px] font-bold tracking-wider sm:tracking-[0.2em] text-white/90 uppercase truncate max-w-[70%]">
              SUMMER & VALENTINE
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-amber-200 bg-black/30 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full backdrop-blur-sm">
              {settings.currencySymbol || '₹'}{activeWomenTee.price.toFixed(2)}
            </span>
          </div>

          {/* Center Graphic T-Shirt Mockup */}
          <div className="relative z-10 w-full max-w-[150px] sm:max-w-[220px] md:max-w-[280px] my-2 sm:my-4 md:my-6 transition-transform duration-500 group-hover:-translate-y-1">
            <TShirtMockup
              shirtColor={activeWomenTee.shirtColor}
              graphicType={activeWomenTee.graphicType}
              isGlowInDark={activeWomenTee.isGlowInDark}
              className="w-full"
            />

            {/* Quick Action Overlay on Hover / Touch */}
            <div className="absolute inset-x-0 bottom-2 flex justify-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {onQuickView && (
                <button
                  id="hero-women-quickview-btn"
                  onClick={() => onQuickView(activeWomenTee)}
                  className="bg-white text-neutral-900 hover:bg-amber-400 hover:text-black font-semibold text-[10px] sm:text-xs px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full shadow-lg flex items-center space-x-1 transition active:scale-95"
                >
                  <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">Quick View</span>
                </button>
              )}
              {onAddToCart && (
                <button
                  id="hero-women-addcart-btn"
                  onClick={() => onAddToCart(activeWomenTee)}
                  className="bg-neutral-900 text-white hover:bg-black font-semibold text-[10px] sm:text-xs px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full shadow-lg flex items-center space-x-1 transition active:scale-95"
                >
                  <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">Add to Cart</span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom Heading / Subtitle */}
          <div className="relative z-10 text-center flex flex-col items-center w-full">
            <h2 className="text-xs sm:text-lg md:text-2xl font-['Playfair_Display',serif] font-bold text-white tracking-wide drop-shadow-sm line-clamp-2">
              {activeWomenTee.name}
            </h2>
            <div className="flex items-center space-x-2 mt-1.5 sm:mt-2">
              <button
                id="hero-explore-women-btn"
                onClick={() => handleExplore('summer-special')}
                className="text-[10px] sm:text-xs font-bold tracking-wider sm:tracking-widest text-white/95 hover:text-amber-200 uppercase flex items-center space-x-1 group/btn"
              >
                <span>EXPLORE SUMMER</span>
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* ================= RIGHT HERO: MEN (DEEP SKY BLUE / AZURE) ================= */}
        <div
          className="relative flex flex-col items-center justify-between p-3 sm:p-6 md:p-10 lg:p-12 overflow-hidden transition-colors duration-500 group"
          style={{ backgroundColor: '#0284C7' }}
        >
          {/* Subtle lighting / texture overlay */}
          <div className="absolute inset-0 bg-gradient-to-tl from-black/20 via-transparent to-white/10 pointer-events-none" />

          {/* Right Arrow Navigation */}
          <button
            id="hero-right-arrow-btn"
            onClick={() => setRightSlideIndex((prev) => (prev === 0 ? menTees.length - 1 : prev - 1))}
            className="absolute right-1.5 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm flex items-center justify-center transition active:scale-90 shadow-md"
            aria-label="Next T-shirt"
          >
            <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>

          {/* Top category label */}
          <div className="w-full flex justify-between items-center z-10">
            <span className="text-[9px] sm:text-[11px] font-bold tracking-wider sm:tracking-[0.2em] text-white/90 uppercase truncate max-w-[70%]">
              TRAVEL & DOG LOVERS
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-amber-200 bg-black/30 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full backdrop-blur-sm">
              {settings.currencySymbol || '₹'}{activeMenTee.price.toFixed(2)}
            </span>
          </div>

          {/* Center Graphic T-Shirt Mockup */}
          <div className="relative z-10 w-full max-w-[150px] sm:max-w-[220px] md:max-w-[280px] my-2 sm:my-4 md:my-6 transition-transform duration-500 group-hover:-translate-y-1">
            <TShirtMockup
              shirtColor={activeMenTee.shirtColor}
              graphicType={activeMenTee.graphicType}
              className="w-full"
            />

            {/* Quick Action Overlay on Hover / Touch */}
            <div className="absolute inset-x-0 bottom-2 flex justify-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {onQuickView && (
                <button
                  id="hero-men-quickview-btn"
                  onClick={() => onQuickView(activeMenTee)}
                  className="bg-white text-neutral-900 hover:bg-amber-400 hover:text-black font-semibold text-[10px] sm:text-xs px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full shadow-lg flex items-center space-x-1 transition active:scale-95"
                >
                  <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">Quick View</span>
                </button>
              )}
              {onAddToCart && (
                <button
                  id="hero-men-addcart-btn"
                  onClick={() => onAddToCart(activeMenTee)}
                  className="bg-neutral-900 text-white hover:bg-black font-semibold text-[10px] sm:text-xs px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full shadow-lg flex items-center space-x-1 transition active:scale-95"
                >
                  <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">Add to Cart</span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom Heading / Subtitle */}
          <div className="relative z-10 text-center flex flex-col items-center w-full">
            <h2 className="text-xs sm:text-lg md:text-2xl font-['Playfair_Display',serif] font-bold text-white tracking-wide drop-shadow-sm line-clamp-2">
              {activeMenTee.name}
            </h2>
            <div className="flex items-center space-x-2 mt-1.5 sm:mt-2">
              <button
                id="hero-explore-men-btn"
                onClick={() => handleExplore('traveling')}
                className="text-[10px] sm:text-xs font-bold tracking-wider sm:tracking-widest text-white/95 hover:text-amber-200 uppercase flex items-center space-x-1 group/btn"
              >
                <span>EXPLORE TRAVEL</span>
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
