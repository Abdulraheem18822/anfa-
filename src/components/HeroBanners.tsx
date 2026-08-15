import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag, Eye, ArrowRight, Sparkles } from 'lucide-react';
import { TShirtMockup } from './TShirtMockup';
import { Product, StoreSettings } from '../types/store';

interface HeroBannersProps {
  settings?: StoreSettings;
  onQuickView?: (product: Product) => void;
  onAddToCart?: (product: Product, size?: string) => void;
  onExploreCategory?: (category: string) => void;
  onExploreCollection?: (category: string) => void;
  onLaunchPODStudio?: () => void;
}

export const HeroBanners: React.FC<HeroBannersProps> = ({
  settings,
  onQuickView,
  onAddToCart,
  onExploreCategory,
  onExploreCollection,
  onLaunchPODStudio,
}) => {
  const [leftSlideIndex, setLeftSlideIndex] = useState(0);
  const [rightSlideIndex, setRightSlideIndex] = useState(0);

  const handleExplore = (cat: string) => {
    if (onExploreCategory) onExploreCategory(cat);
    if (onExploreCollection) onExploreCollection(cat);
  };

  const womenTees: Product[] = [
    {
      id: 'hero-w-1',
      name: 'Summer Botanical Floral Garland Tee',
      price: 48.0,
      shirtColor: '#FFFFFF',
      shirtColorName: 'Pure White',
      category: 'featured',
      gender: 'women',
      graphicType: 'floral-wreath',
      sizes: ['S', 'M', 'L', 'XL'],
      rating: 5,
      reviewCount: 88,
      image: '',
      description: 'Delicate wildflower wreath graphic with pastel blossoms on ring-spun combed cotton.',
      availableColors: [
        { name: 'Pure White', hex: '#FFFFFF' },
        { name: 'Soft Cream', hex: '#FFFBEB' },
        { name: 'Blush Pink', hex: '#FCE7F3' },
      ],
    },
    {
      id: 'hero-w-2',
      name: 'Valkyrie Anime Chibi Knight Tee',
      price: 59.0,
      shirtColor: '#1E3A8A',
      shirtColorName: 'Deep Navy',
      category: 'new',
      gender: 'women',
      graphicType: 'anime-hero',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      rating: 5,
      reviewCount: 40,
      image: '',
      description: 'Anime fantasy artwork printed with high-resolution DTG pigments.',
      availableColors: [
        { name: 'Deep Navy', hex: '#1E3A8A' },
        { name: 'Pure White', hex: '#FFFFFF' },
      ],
    },
  ];

  const menTees: Product[] = [
    {
      id: 'hero-m-1',
      name: 'Texas Strong Heavyweight Heritage Tee',
      price: 20.0,
      originalPrice: 28.0,
      shirtColor: '#9CA3AF',
      shirtColorName: 'Heather Ash',
      category: 'bestseller',
      gender: 'men',
      graphicType: 'texas-strong',
      sizes: ['S', 'M', 'L', 'XL', '2XL'],
      rating: 5,
      reviewCount: 94,
      image: '',
      description: 'Iconic cursive Strong script with gold star emblem on athletic heather fabric.',
      availableColors: [
        { name: 'Heather Ash', hex: '#9CA3AF' },
        { name: 'Pure White', hex: '#FFFFFF' },
        { name: 'Pitch Black', hex: '#18181B' },
      ],
    },
    {
      id: 'hero-m-2',
      name: 'Be Great Motivational Heavy Tee',
      price: 66.0,
      shirtColor: '#18181B',
      shirtColorName: 'Onyx Black',
      category: 'featured',
      gender: 'men',
      graphicType: 'be-great',
      sizes: ['S', 'M', 'L', 'XL', '2XL'],
      rating: 5,
      reviewCount: 38,
      image: '',
      description: 'Bold boxed statement typography on 220 GSM heavyweight combed cotton.',
      availableColors: [
        { name: 'Onyx Black', hex: '#18181B' },
        { name: 'Vintage Red', hex: '#991B1B' },
      ],
    },
  ];

  const activeWomenTee = womenTees[leftSlideIndex];
  const activeMenTee = menTees[rightSlideIndex];

  return (
    <section id="hero-section" className="relative w-full overflow-hidden bg-neutral-900">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[480px] sm:min-h-[520px] md:min-h-[580px]">
        {/* ================= LEFT HERO: WOMEN (TURQUOISE / TEAL) ================= */}
        <div
          className="relative flex flex-col items-center justify-between p-6 sm:p-10 md:p-12 overflow-hidden transition-colors duration-500 group"
          style={{ backgroundColor: '#00A8B5' }}
        >
          {/* Subtle lighting / texture overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/15 via-transparent to-white/10 pointer-events-none" />

          {/* Big Stylish Watermark Behind T-Shirt: "WOMEN" */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
            aria-hidden="true"
          >
            <span
              className="text-[90px] sm:text-[140px] md:text-[170px] lg:text-[190px] font-['Playfair_Display',serif] font-black italic tracking-widest text-white/18 translate-y-12 transition-transform duration-700 group-hover:scale-105"
            >
              WOMEN
            </span>
          </div>

          {/* Left Arrow Navigation */}
          <button
            id="hero-left-arrow-btn"
            onClick={() => setLeftSlideIndex((prev) => (prev === 0 ? womenTees.length - 1 : prev - 1))}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm flex items-center justify-center transition active:scale-90 shadow-md"
            aria-label="Previous Women T-shirt"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Top category label */}
          <div className="w-full flex justify-between items-center z-10">
            <span className="text-[11px] font-bold tracking-[0.2em] text-white/80 uppercase">
              NEW SEASON DROP
            </span>
            <span className="text-xs font-bold text-amber-200 bg-black/20 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
              ${activeWomenTee.price.toFixed(2)}
            </span>
          </div>

          {/* Center Graphic T-Shirt Mockup */}
          <div className="relative z-10 w-full max-w-[280px] sm:max-w-[320px] my-4 sm:my-6 transition-transform duration-500 group-hover:-translate-y-1">
            <TShirtMockup
              shirtColor={activeWomenTee.shirtColor}
              graphicType={activeWomenTee.graphicType}
              className="w-full"
            />

            {/* Quick Action Overlay on Hover */}
            <div className="absolute inset-x-0 bottom-4 flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {onQuickView && (
                <button
                  id="hero-women-quickview-btn"
                  onClick={() => onQuickView(activeWomenTee)}
                  className="bg-white text-neutral-900 hover:bg-amber-400 hover:text-black font-semibold text-xs px-3.5 py-2 rounded-full shadow-lg flex items-center space-x-1 transition active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Quick View</span>
                </button>
              )}
              {onAddToCart && (
                <button
                  id="hero-women-addcart-btn"
                  onClick={() => onAddToCart(activeWomenTee)}
                  className="bg-neutral-900 text-white hover:bg-black font-semibold text-xs px-3.5 py-2 rounded-full shadow-lg flex items-center space-x-1 transition active:scale-95"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add to Cart</span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom Heading / Subtitle */}
          <div className="relative z-10 text-center flex flex-col items-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-['Playfair_Display',serif] font-bold text-white tracking-wide drop-shadow-sm">
              Summer Hotlist Collections
            </h2>
            <div className="flex items-center space-x-3 mt-2">
              <button
                id="hero-explore-women-btn"
                onClick={() => handleExplore('women')}
                className="text-xs font-bold tracking-widest text-white/90 hover:text-amber-200 uppercase flex items-center space-x-1 group/btn"
              >
                <span>EXPLORE WOMEN</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
              </button>
              {onLaunchPODStudio && (
                <button
                  onClick={onLaunchPODStudio}
                  className="text-xs font-bold tracking-widest text-amber-300 hover:text-amber-100 uppercase flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>CUSTOMIZE</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ================= RIGHT HERO: MEN (DEEP SKY BLUE / AZURE) ================= */}
        <div
          className="relative flex flex-col items-center justify-between p-6 sm:p-10 md:p-12 overflow-hidden transition-colors duration-500 group border-t lg:border-t-0 lg:border-l border-white/10"
          style={{ backgroundColor: '#0284C7' }}
        >
          {/* Subtle lighting / texture overlay */}
          <div className="absolute inset-0 bg-gradient-to-tl from-black/20 via-transparent to-white/10 pointer-events-none" />

          {/* Big Stylish Watermark Behind T-Shirt: "MEN STYLE" */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
            aria-hidden="true"
          >
            <span
              className="text-[80px] sm:text-[120px] md:text-[150px] lg:text-[170px] font-['Playfair_Display',serif] font-black italic tracking-widest text-white/18 translate-y-12 transition-transform duration-700 group-hover:scale-105"
            >
              MEN STYLE
            </span>
          </div>

          {/* Right Arrow Navigation */}
          <button
            id="hero-right-arrow-btn"
            onClick={() => setRightSlideIndex((prev) => (prev === 0 ? menTees.length - 1 : prev - 1))}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm flex items-center justify-center transition active:scale-90 shadow-md"
            aria-label="Next Men T-shirt"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Top category label */}
          <div className="w-full flex justify-between items-center z-10">
            <span className="text-[11px] font-bold tracking-[0.2em] text-white/80 uppercase">
              STREETWEAR FIT
            </span>
            <span className="text-xs font-bold text-amber-200 bg-black/20 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
              ${activeMenTee.price.toFixed(2)}
            </span>
          </div>

          {/* Center Graphic T-Shirt Mockup */}
          <div className="relative z-10 w-full max-w-[280px] sm:max-w-[320px] my-4 sm:my-6 transition-transform duration-500 group-hover:-translate-y-1">
            <TShirtMockup
              shirtColor={activeMenTee.shirtColor}
              graphicType={activeMenTee.graphicType}
              className="w-full"
            />

            {/* Quick Action Overlay on Hover */}
            <div className="absolute inset-x-0 bottom-4 flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {onQuickView && (
                <button
                  id="hero-men-quickview-btn"
                  onClick={() => onQuickView(activeMenTee)}
                  className="bg-white text-neutral-900 hover:bg-amber-400 hover:text-black font-semibold text-xs px-3.5 py-2 rounded-full shadow-lg flex items-center space-x-1 transition active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Quick View</span>
                </button>
              )}
              {onAddToCart && (
                <button
                  id="hero-men-addcart-btn"
                  onClick={() => onAddToCart(activeMenTee)}
                  className="bg-neutral-900 text-white hover:bg-black font-semibold text-xs px-3.5 py-2 rounded-full shadow-lg flex items-center space-x-1 transition active:scale-95"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add to Cart</span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom Heading / Subtitle */}
          <div className="relative z-10 text-center flex flex-col items-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-['Playfair_Display',serif] font-bold text-white tracking-wide drop-shadow-sm">
              Summer Hotlist Collections
            </h2>
            <div className="flex items-center space-x-3 mt-2">
              <button
                id="hero-explore-men-btn"
                onClick={() => handleExplore('men')}
                className="text-xs font-bold tracking-widest text-white/90 hover:text-amber-200 uppercase flex items-center space-x-1 group/btn"
              >
                <span>EXPLORE MEN</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
              </button>
              {onLaunchPODStudio && (
                <button
                  onClick={onLaunchPODStudio}
                  className="text-xs font-bold tracking-widest text-amber-300 hover:text-amber-100 uppercase flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>CUSTOMIZE</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
