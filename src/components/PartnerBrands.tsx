import React from 'react';
import { partnerBrands } from '../data/mockData';

export const PartnerBrands: React.FC = () => {
  // Vector icons for each brand badge
  const renderBrandIcon = (iconName: string) => {
    switch (iconName) {
      case 'maple':
        return (
          <svg viewBox="0 0 40 40" className="w-8 h-8 opacity-80 group-hover:opacity-100 transition">
            <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M 20 8 L 22 15 L 28 13 L 25 18 L 31 22 L 24 23 L 23 29 L 20 26 L 17 29 L 16 23 L 9 22 L 15 18 L 12 13 L 18 15 Z" fill="currentColor" />
            <line x1="20" y1="26" x2="20" y2="33" stroke="currentColor" strokeWidth="2" />
          </svg>
        );
      case 'plane':
        return (
          <svg viewBox="0 0 40 40" className="w-8 h-8 opacity-80 group-hover:opacity-100 transition">
            <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
            <path d="M 20 10 L 22 18 L 32 22 L 22 24 L 21 30 L 25 32 L 20 34 L 15 32 L 19 30 L 18 24 L 8 22 L 18 18 Z" fill="currentColor" />
          </svg>
        );
      case 'bike':
        return (
          <svg viewBox="0 0 40 40" className="w-8 h-8 opacity-80 group-hover:opacity-100 transition">
            <circle cx="12" cy="25" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="28" cy="25" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M 12 25 L 18 16 L 24 25 L 12 25 M 18 16 L 22 13 L 26 13 M 28 25 L 24 16 L 19 16" fill="none" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        );
      case 'mountain':
        return (
          <svg viewBox="0 0 40 40" className="w-8 h-8 opacity-80 group-hover:opacity-100 transition">
            <path d="M 6 30 L 18 12 L 26 24 L 34 30 Z" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M 14 18 L 18 12 L 22 18 L 19 20 L 17 19 Z" fill="currentColor" />
            <path d="M 22 24 L 26 18 L 30 24" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        );
      case 'badge':
        return (
          <svg viewBox="0 0 40 40" className="w-8 h-8 opacity-80 group-hover:opacity-100 transition">
            <rect x="6" y="12" width="28" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M 6 16 L 20 23 L 34 16" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <line x1="12" y1="20" x2="28" y2="20" stroke="currentColor" strokeWidth="1" strokeDasharray="1 1" />
          </svg>
        );
      case 'wheel':
        return (
          <svg viewBox="0 0 40 40" className="w-8 h-8 opacity-80 group-hover:opacity-100 transition">
            <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="20" cy="20" r="4" fill="currentColor" />
            <line x1="20" y1="4" x2="20" y2="36" stroke="currentColor" strokeWidth="1.5" />
            <line x1="4" y1="20" x2="36" y2="20" stroke="currentColor" strokeWidth="1.5" />
            <line x1="8.7" y1="8.7" x2="31.3" y2="31.3" stroke="currentColor" strokeWidth="1.5" />
            <line x1="8.7" y1="31.3" x2="31.3" y2="8.7" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        );
      case 'eagle':
        return (
          <svg viewBox="0 0 40 40" className="w-8 h-8 opacity-80 group-hover:opacity-100 transition">
            <path d="M 4 20 Q 14 10 20 18 Q 26 10 36 20 Q 28 26 20 22 Q 12 26 4 20 Z" fill="currentColor" />
            <circle cx="20" cy="16" r="3" fill="#FFF" />
          </svg>
        );
      case 'star':
        return (
          <svg viewBox="0 0 40 40" className="w-8 h-8 opacity-80 group-hover:opacity-100 transition">
            <polygon points="20,6 24,15 34,16 26,23 29,33 20,27 11,33 14,23 6,16 16,15" fill="none" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 40 40" className="w-8 h-8 opacity-80 group-hover:opacity-100 transition">
            <polygon points="20,6 34,20 20,34 6,20" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="20" cy="20" r="4" fill="currentColor" />
          </svg>
        );
    }
  };

  return (
    <section id="brands-section" className="py-7 border-b border-neutral-200 bg-white select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between overflow-x-auto no-scrollbar space-x-6 sm:space-x-8 md:space-x-12 py-2">
          {partnerBrands.map((brand) => (
            <div
              key={brand.id}
              className="flex-shrink-0 flex flex-col items-center justify-center text-neutral-800 hover:text-neutral-950 transition-colors group cursor-pointer"
            >
              <div className="text-neutral-700 group-hover:text-black transition">
                {renderBrandIcon(brand.iconName)}
              </div>
              <span className="font-['Oswald'] font-bold text-[11px] md:text-xs tracking-wider uppercase mt-1 text-neutral-700 group-hover:text-black">
                {brand.name}
              </span>
              {brand.subtext && (
                <span className="text-[8px] tracking-widest text-neutral-400 font-medium uppercase">
                  {brand.subtext}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
