import React from 'react';

interface TShirtMockupProps {
  shirtColor?: string; // hex code
  graphicType?: string;
  graphicText?: string;
  graphicUrl?: string;
  badge?: string;
  isGlowInDark?: boolean;
  className?: string;
  showShadow?: boolean;
  scale?: number;
  glowActive?: boolean;
}

export const TShirtMockup: React.FC<TShirtMockupProps> = ({
  shirtColor = '#FFFFFF',
  graphicType = 'eat-my-dust',
  graphicText,
  graphicUrl,
  badge,
  isGlowInDark = false,
  className = 'w-full h-full',
  showShadow = true,
}) => {
  // SVG Graphic Renderer based on graphicType
  const renderGraphicContent = () => {
    if (graphicUrl) {
      return (
        <div className="flex items-center justify-center w-28 h-28 md:w-36 md:h-36 overflow-hidden">
          <img src={graphicUrl} alt="Custom Graphic" className="max-w-full max-h-full object-contain filter drop-shadow" />
        </div>
      );
    }

    switch (graphicType) {
      case 'floral-wreath':
        return (
          <div className="flex flex-col items-center justify-center p-2 text-center select-none">
            <svg viewBox="0 0 140 140" className="w-28 h-28 md:w-36 md:h-36">
              {/* Botanical Wreath Outline in Texas/Organic shape */}
              <circle cx="70" cy="70" r="54" fill="none" stroke="#2D3748" strokeWidth="2.5" strokeDasharray="3 4" opacity="0.4" />
              {/* Flowers and leaves */}
              <g stroke="#222" strokeWidth="2" fill="none">
                <path d="M 45 40 Q 60 25 80 35 Q 105 30 115 55 Q 125 80 110 100 Q 85 115 65 110 Q 35 105 35 75 Z" stroke="#334155" strokeWidth="2.5" strokeLinejoin="round" fill="rgba(240, 249, 255, 0.2)" />
                {/* Flower 1 */}
                <circle cx="42" cy="48" r="7" fill="#F472B6" stroke="#9D174D" strokeWidth="1.5" />
                <circle cx="42" cy="48" r="2.5" fill="#FEF08A" />
                {/* Flower 2 */}
                <circle cx="85" cy="32" r="8" fill="#FDE047" stroke="#CA8A04" strokeWidth="1.5" />
                <circle cx="85" cy="32" r="3" fill="#FB923C" />
                {/* Flower 3 */}
                <circle cx="112" cy="70" r="7.5" fill="#60A5FA" stroke="#1E40AF" strokeWidth="1.5" />
                <circle cx="112" cy="70" r="2.5" fill="#FEF08A" />
                {/* Flower 4 */}
                <circle cx="95" cy="108" r="8" fill="#FB7185" stroke="#9F1239" strokeWidth="1.5" />
                <circle cx="95" cy="108" r="3" fill="#FEF08A" />
                {/* Leaves */}
                <path d="M 55 35 C 55 25, 68 28, 68 35 C 68 42, 55 40, 55 35" fill="#4ADE80" stroke="#166534" strokeWidth="1" />
                <path d="M 100 48 C 108 40, 115 48, 108 55 C 102 55, 100 48, 100 48" fill="#86EFAC" stroke="#166534" strokeWidth="1" />
                <path d="M 115 88 C 122 85, 125 95, 118 98 C 112 95, 115 88, 115 88" fill="#4ADE80" stroke="#166534" strokeWidth="1" />
                <path d="M 50 95 C 40 98, 42 108, 52 105 C 55 98, 50 95, 50 95" fill="#86EFAC" stroke="#166534" strokeWidth="1" />
              </g>
              <text x="70" y="74" textAnchor="middle" fill="#334155" fontSize="9" fontWeight="700" letterSpacing="0.1em" fontFamily="'Montserrat', sans-serif">SUMMER</text>
              <text x="70" y="85" textAnchor="middle" fill="#64748B" fontSize="7" fontWeight="500" letterSpacing="0.15em" fontFamily="'Montserrat', sans-serif">FLORAL</text>
            </svg>
          </div>
        );

      case 'texas-strong':
        return (
          <div className="flex flex-col items-center justify-center p-2 text-center select-none">
            <svg viewBox="0 0 150 120" className="w-32 h-28 md:w-40 md:h-32">
              {/* Star */}
              <polygon points="120,40 123,48 132,48 125,53 128,62 120,56 112,62 115,53 108,48 117,48" fill="#FACC15" stroke="#CA8A04" strokeWidth="1" />
              {/* Cursive Strong */}
              <text
                x="72"
                y="65"
                textAnchor="middle"
                fill="#3B82F6"
                fontSize="42"
                fontWeight="800"
                fontFamily="'Playfair Display', cursive, serif"
                fontStyle="italic"
                stroke="#1E3A8A"
                strokeWidth="1.5"
                className="drop-shadow-sm"
              >
                Strong
              </text>
              <text
                x="75"
                y="86"
                textAnchor="middle"
                fill="#94A3B8"
                fontSize="9"
                fontWeight="700"
                letterSpacing="0.15em"
                fontFamily="'Montserrat', sans-serif"
              >
                #TEXASSTRONG
              </text>
            </svg>
          </div>
        );

      case 'anime-hero':
        return (
          <div className="flex flex-col items-center justify-center p-2 text-center select-none">
            <div className="relative w-28 h-28 md:w-36 md:h-36 flex items-center justify-center">
              {/* Chibi Valkyrie Graphic */}
              <svg viewBox="0 0 120 120" className="w-full h-full filter drop-shadow-md">
                <defs>
                  <radialGradient id="aura" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx="60" cy="60" r="48" fill="url(#aura)" />
                {/* Wings / Feathers */}
                <path d="M 25 50 C 15 35, 30 20, 50 35 C 35 45, 25 50, 25 50 Z" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" />
                <path d="M 95 50 C 105 35, 90 20, 70 35 C 85 45, 95 50, 95 50 Z" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" />
                {/* Cape */}
                <path d="M 40 55 Q 30 95 45 105 Q 60 100 75 105 Q 90 95 80 55 Z" fill="#0369A1" stroke="#0C4A6E" strokeWidth="1.5" />
                {/* Head / Hood */}
                <ellipse cx="60" cy="52" rx="22" ry="24" fill="#0284C7" stroke="#0369A1" strokeWidth="2" />
                {/* Face */}
                <ellipse cx="60" cy="56" rx="16" ry="15" fill="#FFE4E6" />
                {/* Anime Eyes */}
                <ellipse cx="53" cy="55" rx="3.5" ry="5.5" fill="#0369A1" />
                <circle cx="54" cy="53" r="1.5" fill="#FFFFFF" />
                <ellipse cx="67" cy="55" rx="3.5" ry="5.5" fill="#0369A1" />
                <circle cx="68" cy="53" r="1.5" fill="#FFFFFF" />
                <path d="M 58 64 Q 60 66 62 64" stroke="#BE123C" strokeWidth="1" fill="none" />
                {/* Blonde/Gold Bangs */}
                <path d="M 46 45 Q 52 52 56 46 Q 62 53 66 46 Q 72 52 74 45" fill="#FCD34D" stroke="#B45309" strokeWidth="1" />
                {/* Sword */}
                <line x1="78" y1="40" x2="90" y2="85" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
                <circle cx="78" cy="40" r="4" fill="#F59E0B" />
                <line x1="72" y1="46" x2="84" y2="44" stroke="#F59E0B" strokeWidth="2.5" />
              </svg>
            </div>
          </div>
        );

      case 'peter-sagan-skull':
        return (
          <div className="flex flex-col items-center justify-center p-1 text-center select-none">
            <span className="font-['Oswald'] font-bold text-xs tracking-widest text-emerald-950 uppercase mb-0.5">
              PETER SAGAN
            </span>
            <svg viewBox="0 0 100 100" className={`w-24 h-24 md:w-28 md:h-28 ${isGlowInDark ? 'filter drop-shadow-[0_0_12px_rgba(74,222,128,0.85)]' : ''}`}>
              {/* Skull Base */}
              <path
                d="M 22 45 C 22 20, 78 20, 78 45 C 78 58, 70 65, 68 75 C 66 84, 34 84, 32 75 C 30 65, 22 58, 22 45 Z"
                fill={isGlowInDark ? '#4ADE80' : '#86EFAC'}
                stroke="#064E3B"
                strokeWidth="2.5"
              />
              {/* Sunglasses */}
              <path d="M 20 40 Q 50 43 80 40 L 78 52 Q 50 56 22 52 Z" fill="#0F172A" stroke="#022C22" strokeWidth="1.5" />
              <circle cx="36" cy="46" r="9" fill="#022C22" />
              <circle cx="64" cy="46" r="9" fill="#022C22" />
              <line x1="45" y1="46" x2="55" y2="46" stroke="#0F172A" strokeWidth="3" />
              {/* Nose */}
              <polygon points="50,58 46,65 54,65" fill="#064E3B" />
              {/* Teeth */}
              <g stroke="#064E3B" strokeWidth="2">
                <line x1="38" y1="72" x2="38" y2="80" />
                <line x1="44" y1="72" x2="44" y2="82" />
                <line x1="50" y1="72" x2="50" y2="82" />
                <line x1="56" y1="72" x2="56" y2="82" />
                <line x1="62" y1="72" x2="62" y2="80" />
                <line x1="36" y1="76" x2="64" y2="76" strokeWidth="1.5" />
              </g>
            </svg>
          </div>
        );

      case 'be-great':
        return (
          <div className="flex flex-col items-center justify-center p-2 text-center select-none">
            <div className="border-4 border-white px-4 py-3 tracking-tighter flex flex-col items-center justify-center bg-transparent">
              <span className="font-['Oswald'] font-black text-3xl md:text-4xl text-white leading-none tracking-tight">
                BE
              </span>
              <span className="font-['Oswald'] font-black text-2xl md:text-3xl text-white leading-none tracking-wide mt-1">
                GREAT
              </span>
            </div>
          </div>
        );

      case 'eat-my-dust':
        return (
          <div className="flex flex-col items-center justify-center p-2 text-center select-none">
            <span className="font-['Oswald'] font-black text-2xl md:text-3xl tracking-tight text-neutral-900 leading-tight">
              EAT MY
            </span>
            <span className="font-['Oswald'] font-black text-3xl md:text-4xl tracking-tighter text-neutral-900 leading-none">
              DUST
            </span>
          </div>
        );

      case 'portrait-che':
        return (
          <div className="flex flex-col items-center justify-center p-2 text-center select-none">
            <svg viewBox="0 0 100 100" className="w-24 h-24 md:w-28 md:h-28">
              {/* Beret & Star */}
              <ellipse cx="50" cy="30" rx="32" ry="12" fill="#18181B" />
              <polygon points="50,22 52,27 57,27 53,30 55,35 50,32 45,35 47,30 43,27 48,27" fill="#E4E4E7" />
              {/* Beard / Silhouette */}
              <path d="M 30 38 Q 25 65 35 85 Q 50 95 65 85 Q 75 65 70 38 Z" fill="#18181B" />
              {/* Face negative space */}
              <path d="M 36 40 Q 50 38 64 40 Q 64 62 50 68 Q 36 62 36 40 Z" fill="#FAFAFA" />
              {/* Eyes & Mustache */}
              <ellipse cx="43" cy="48" rx="3" ry="2" fill="#18181B" />
              <ellipse cx="57" cy="48" rx="3" ry="2" fill="#18181B" />
              <path d="M 38 58 Q 50 54 62 58 Q 50 66 38 58 Z" fill="#18181B" />
            </svg>
          </div>
        );

      case 'cute-headphones':
        return (
          <div className="flex flex-col items-center justify-center p-2 text-center select-none">
            <svg viewBox="0 0 100 100" className="w-24 h-24 md:w-28 md:h-28">
              {/* Red Headphones Arch */}
              <path d="M 22 50 A 28 28 0 0 1 78 50" fill="none" stroke="#DC2626" strokeWidth="5" strokeLinecap="round" />
              {/* Ear cushions */}
              <rect x="16" y="44" width="9" height="18" rx="4" fill="#B91C1C" />
              <rect x="75" y="44" width="9" height="18" rx="4" fill="#B91C1C" />
              {/* Cute Creature Face */}
              <circle cx="50" cy="55" r="22" fill="#38BDF8" />
              <circle cx="43" cy="53" r="3.5" fill="#0F172A" />
              <circle cx="57" cy="53" r="3.5" fill="#0F172A" />
              <circle cx="44" cy="51" r="1.2" fill="#FFFFFF" />
              <circle cx="58" cy="51" r="1.2" fill="#FFFFFF" />
              {/* Smile & Blush */}
              <circle cx="36" cy="58" r="3" fill="#F472B6" opacity="0.7" />
              <circle cx="64" cy="58" r="3" fill="#F472B6" opacity="0.7" />
              <path d="M 46 60 Q 50 64 54 60" stroke="#0F172A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
          </div>
        );

      case 'vintage-book':
        return (
          <div className="flex flex-col items-center justify-center p-2 text-center select-none">
            <div className="border border-emerald-400 bg-emerald-900 text-emerald-100 p-2.5 rounded-sm shadow-sm flex flex-col items-center w-20 md:w-24">
              <span className="text-[7px] tracking-widest uppercase font-semibold text-emerald-300">HARVEST</span>
              <div className="w-8 h-8 my-1 rounded-full border border-emerald-400/40 flex items-center justify-center">
                <span className="text-emerald-300 text-xs">✦</span>
              </div>
              <span className="text-[6px] tracking-wider uppercase font-medium text-emerald-200">FORECAST</span>
            </div>
          </div>
        );

      case 'streetwear-comic':
        return (
          <div className="flex flex-col items-center justify-center p-1 text-center select-none">
            <svg viewBox="0 0 100 100" className="w-24 h-24 md:w-28 md:h-28">
              {/* Yellow halftone backdrop */}
              <rect x="20" y="15" width="60" height="70" rx="3" fill="#FDE047" stroke="#000" strokeWidth="2" />
              {/* Comic characters */}
              <path d="M 28 35 Q 38 20 48 35 L 45 75 L 30 75 Z" fill="#000" />
              <path d="M 52 40 Q 62 25 72 40 L 70 75 L 55 75 Z" fill="#DC2626" stroke="#000" strokeWidth="1.5" />
              <circle cx="38" cy="30" r="7" fill="#FBBF24" stroke="#000" strokeWidth="1.5" />
              <circle cx="62" cy="34" r="6" fill="#FBBF24" stroke="#000" strokeWidth="1.5" />
              <text x="50" y="80" textAnchor="middle" fontSize="7" fontWeight="900" fontFamily="'Oswald', sans-serif">DEVIL SKATE</text>
            </svg>
          </div>
        );

      case 'vintage-camera':
        return (
          <div className="flex flex-col items-center justify-center p-2 text-center select-none">
            <svg viewBox="0 0 100 80" className="w-24 h-20 md:w-30 md:h-24">
              {/* Camera Body */}
              <rect x="15" y="25" width="70" height="46" rx="6" fill="#78350F" stroke="#451A03" strokeWidth="2" />
              {/* Top plate */}
              <rect x="15" y="20" width="70" height="9" rx="2" fill="#D1D5DB" stroke="#4B5563" strokeWidth="1.5" />
              {/* Shutter button & viewfinder */}
              <rect x="25" y="15" width="10" height="6" fill="#9CA3AF" />
              <rect x="62" y="16" width="12" height="5" fill="#4B5563" rx="1" />
              {/* Lens */}
              <circle cx="50" cy="48" r="18" fill="#1F2937" stroke="#9CA3AF" strokeWidth="3" />
              <circle cx="50" cy="48" r="12" fill="#0B132B" stroke="#60A5FA" strokeWidth="1.5" />
              <circle cx="46" cy="44" r="3" fill="#FFFFFF" opacity="0.7" />
              {/* Flash window */}
              <rect x="68" y="30" width="10" height="6" fill="#FDE047" stroke="#B45309" strokeWidth="1" />
            </svg>
          </div>
        );

      case 'tokyo-retro':
        return (
          <div className="flex flex-col items-center justify-center p-2 text-center select-none">
            <span className="font-['Oswald'] font-black text-xl text-rose-500 tracking-widest">東京</span>
            <span className="font-['Oswald'] font-bold text-xs tracking-wider text-slate-800">TOKYO RETRO 1984</span>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center p-2 text-center select-none">
            <span className="font-['Oswald'] font-black text-xl md:text-2xl text-neutral-800 uppercase tracking-wider">
              {graphicText || 'ORITINA'}
            </span>
            <span className="text-[9px] font-semibold text-neutral-500 tracking-widest uppercase mt-0.5">
              ORIGINAL POD
            </span>
          </div>
        );
    }
  };

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* T-Shirt Canvas Mockup Base */}
      <div className="relative w-full aspect-[4/4.4] max-w-[340px] flex items-center justify-center">
        {/* Drop Shadow */}
        {showShadow && (
          <div className="absolute inset-x-8 bottom-2 h-6 bg-black/15 blur-lg rounded-full pointer-events-none" />
        )}

        {/* Realistic SVG T-Shirt Shape */}
        <svg
          viewBox="0 0 360 400"
          className="w-full h-full filter drop-shadow-md transition-all duration-300"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Fabric subtle texture gradient */}
            <linearGradient id={`fabric-shade-${shirtColor.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
              <stop offset="50%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.14" />
            </linearGradient>

            <linearGradient id={`sleeve-l-${shirtColor.replace('#', '')}`} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
            </linearGradient>

            <linearGradient id={`sleeve-r-${shirtColor.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
            </linearGradient>

            <filter id="soft-wrinkles" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
              <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.04 0" />
              <feBlend in="SourceGraphic" mode="multiply" />
            </filter>
          </defs>

          {/* Main T-Shirt Body & Sleeves Silhouette Path */}
          <g>
            {/* Base color shape */}
            <path
              d="M 125 42 
                 C 145 58, 215 58, 235 42 
                 C 255 45, 305 60, 342 98 
                 C 348 104, 348 114, 338 126 
                 L 295 170 
                 C 290 176, 282 176, 275 168 
                 L 262 150 
                 C 264 210, 268 280, 270 365 
                 C 270 372, 264 378, 256 378 
                 L 104 378 
                 C 96 378, 90 372, 90 365 
                 C 92 280, 96 210, 98 150 
                 L 85 168 
                 C 78 176, 70 176, 65 170 
                 L 22 126 
                 C 12 114, 12 104, 18 98 
                 C 55 60, 105 45, 125 42 Z"
              fill={shirtColor}
              stroke="rgba(0, 0, 0, 0.12)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />

            {/* Fabric Shading & Wrinkle Highlights Overlay */}
            <path
              d="M 125 42 
                 C 145 58, 215 58, 235 42 
                 C 255 45, 305 60, 342 98 
                 C 348 104, 348 114, 338 126 
                 L 295 170 
                 C 290 176, 282 176, 275 168 
                 L 262 150 
                 C 264 210, 268 280, 270 365 
                 C 270 372, 264 378, 256 378 
                 L 104 378 
                 C 96 378, 90 372, 90 365 
                 C 92 280, 96 210, 98 150 
                 L 85 168 
                 C 78 176, 70 176, 65 170 
                 L 22 126 
                 C 12 114, 12 104, 18 98 
                 C 55 60, 105 45, 125 42 Z"
              fill={`url(#fabric-shade-${shirtColor.replace('#', '')})`}
            />

            {/* Left Armpit Seam & Fold */}
            <path
              d="M 98 150 C 95 125, 125 42, 125 42"
              stroke="rgba(0,0,0,0.12)"
              strokeWidth="1.2"
              fill="none"
            />
            {/* Right Armpit Seam & Fold */}
            <path
              d="M 262 150 C 265 125, 235 42, 235 42"
              stroke="rgba(0,0,0,0.12)"
              strokeWidth="1.2"
              fill="none"
            />

            {/* Subtle natural fabric creases on torso */}
            <path
              d="M 104 165 C 130 185, 140 190, 175 180"
              stroke="rgba(0,0,0,0.06)"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 255 175 C 230 192, 215 194, 185 185"
              stroke="rgba(0,0,0,0.06)"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 110 270 C 135 285, 150 280, 190 275"
              stroke="rgba(0,0,0,0.05)"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 250 285 C 225 295, 205 290, 170 280"
              stroke="rgba(0,0,0,0.05)"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />

            {/* Bottom Hem Stitching */}
            <line x1="102" y1="368" x2="258" y2="368" stroke="rgba(0,0,0,0.1)" strokeWidth="1" strokeDasharray="3 2" />

            {/* Left Sleeve Hem */}
            <path d="M 24 124 L 66 168" stroke="rgba(0,0,0,0.1)" strokeWidth="1" strokeDasharray="3 2" />
            {/* Right Sleeve Hem */}
            <path d="M 336 124 L 294 168" stroke="rgba(0,0,0,0.1)" strokeWidth="1" strokeDasharray="3 2" />

            {/* Collar Ribbing Ring (Front & Back Depth) */}
            {/* Inner Back Collar */}
            <path
              d="M 125 42 C 145 32, 215 32, 235 42 C 215 50, 145 50, 125 42 Z"
              fill="rgba(0,0,0,0.14)"
            />
            {/* Front Collar Band */}
            <path
              d="M 125 42 C 145 58, 215 58, 235 42 C 218 68, 142 68, 125 42 Z"
              fill={shirtColor}
              stroke="rgba(0,0,0,0.18)"
              strokeWidth="1.5"
            />
            {/* Inside Label Tab */}
            <rect x="172" y="34" width="16" height="10" rx="1" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.5" />
            <line x1="174" y1="38" x2="186" y2="38" stroke="#94A3B8" strokeWidth="0.8" />
          </g>
        </svg>

        {/* DTG Printed Graphic Overlay Area (Centered on Chest) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none pt-4">
          <div className="w-[52%] max-h-[58%] flex items-center justify-center overflow-hidden">
            {renderGraphicContent()}
          </div>
        </div>

        {/* Special Glow In Dark Badge Overlay (as seen on Peter Sagan card) */}
        {isGlowInDark && (
          <div className="absolute right-4 bottom-8 md:right-6 md:bottom-10 bg-black text-white px-2 py-1.5 border border-white/40 shadow-lg text-center flex flex-col items-center justify-center animate-pulse">
            <span className="text-[9px] font-black tracking-wider uppercase leading-tight font-['Oswald']">
              GLOW IN
            </span>
            <span className="text-[9px] font-black tracking-wider uppercase leading-tight text-emerald-400 font-['Oswald']">
              THE DARK
            </span>
          </div>
        )}

        {/* Badge in corner if provided */}
        {badge && (
          <div className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
            {badge}
          </div>
        )}
      </div>
    </div>
  );
};
