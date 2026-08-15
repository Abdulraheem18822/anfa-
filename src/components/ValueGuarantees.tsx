import React from 'react';
import { StoreSettings } from '../types/store';

interface ValueGuaranteesProps {
  settings: StoreSettings;
}

export const ValueGuarantees: React.FC<ValueGuaranteesProps> = ({ settings }) => {
  return (
    <section id="guarantees-section" className="py-14 md:py-20 bg-white border-t border-neutral-200 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center">
          {/* 1. Free Delivery */}
          <div className="flex flex-col items-center px-4">
            {/* Delivery Truck Outline Vector Icon */}
            <div className="w-14 h-14 mb-4 flex items-center justify-center text-amber-500">
              <svg viewBox="0 0 64 64" className="w-12 h-12 stroke-current fill-none stroke-[1.8]">
                {/* Truck Cabin & Bed */}
                <rect x="6" y="20" width="34" height="24" rx="2" />
                <path d="M 40 28 L 52 28 L 58 36 L 58 44 L 40 44 Z" />
                {/* Wheels */}
                <circle cx="18" cy="46" r="5" fill="#FFF" strokeWidth="2" />
                <circle cx="18" cy="46" r="2" fill="currentColor" />
                <circle cx="48" cy="46" r="5" fill="#FFF" strokeWidth="2" />
                <circle cx="48" cy="46" r="2" fill="currentColor" />
                {/* Speed Lines */}
                <line x1="2" y1="26" x2="6" y2="26" />
                <line x1="1" y1="32" x2="5" y2="32" />
                <line x1="3" y1="38" x2="6" y2="38" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-['Montserrat',sans-serif] font-bold text-neutral-900 tracking-tight">
              Free Delivery On All Orders
            </h3>
            <p className="text-xs text-neutral-500 mt-2 leading-relaxed max-w-xs">
              Delivery will be 100% free across India with express door-to-door courier dispatch and real-time tracking.
            </p>
          </div>

          {/* 2. Money Back Guarantee */}
          <div className="flex flex-col items-center px-4">
            {/* Currency Shield Badge Vector Icon with INR Rupee Symbol */}
            <div className="w-14 h-14 mb-4 flex items-center justify-center text-amber-500">
              <svg viewBox="0 0 64 64" className="w-12 h-12 stroke-current fill-none stroke-[1.8]">
                {/* Shield */}
                <path d="M 32 6 L 52 14 L 52 32 C 52 46 32 58 32 58 C 32 58 12 46 12 32 L 12 14 Z" />
                <circle cx="32" cy="28" r="11" strokeDasharray="2 2" />
                <text
                  x="32"
                  y="34"
                  textAnchor="middle"
                  fill="currentColor"
                  fontSize="15"
                  fontWeight="700"
                  fontFamily="'Montserrat', sans-serif"
                  stroke="none"
                >
                  ₹
                </text>
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-['Montserrat',sans-serif] font-bold text-neutral-900 tracking-tight">
              100% Money Back Guarantee
            </h3>
            <p className="text-xs text-neutral-500 mt-2 leading-relaxed max-w-xs">
              30-day hassle-free returns or full refunds if your custom print does not match your exact expectations.
            </p>
          </div>

          {/* 3. Authenticity 100% Guaranteed */}
          <div className="flex flex-col items-center px-4">
            {/* Guarantee Seal Vector Icon */}
            <div className="w-14 h-14 mb-4 flex items-center justify-center text-amber-500">
              <svg viewBox="0 0 64 64" className="w-12 h-12 stroke-current fill-none stroke-[1.8]">
                <rect x="14" y="14" width="36" height="36" rx="6" />
                <path d="M 24 32 L 29 38 L 41 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-['Montserrat',sans-serif] font-bold text-neutral-900 tracking-tight">
              Handpicked Designer Quality
            </h3>
            <p className="text-xs text-neutral-500 mt-2 leading-relaxed max-w-xs">
              Crafted from 240 GSM organic ring-spun cotton and Japanese direct-to-garment wash-resistant pigments.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
