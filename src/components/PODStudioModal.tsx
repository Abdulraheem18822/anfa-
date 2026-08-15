import React, { useState } from 'react';
import { X, Sparkles, ShoppingBag, Type, Palette, Sliders, Check } from 'lucide-react';
import { TShirtMockup } from './TShirtMockup';
import { GraphicType, StoreSettings, CartItem } from '../types/store';

interface PODStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  onAddToCart: (item: Omit<CartItem, 'id'>) => void;
}

const AVAILABLE_COLORS = [
  { name: 'Pure White', hex: '#FFFFFF', isLight: true },
  { name: 'Pitch Black', hex: '#121212', isLight: false },
  { name: 'Midnight Navy', hex: '#0F1E36', isLight: false },
  { name: 'Crimson Red', hex: '#8B1E1E', isLight: false },
  { name: 'Forest Green', hex: '#1E3F20', isLight: false },
  { name: 'Pastel Sand', hex: '#E6D7C3', isLight: true },
  { name: 'Heather Grey', hex: '#717679', isLight: false },
  { name: 'Dusty Rose', hex: '#D8A48F', isLight: true },
  { name: 'Vintage Washed Charcoal', hex: '#2A2E33', isLight: false },
];

const GRAPHIC_OPTIONS: { id: GraphicType; label: string; tag: string }[] = [
  { id: 'graphic-tokyo', label: 'Neo Tokyo Cyberpunk', tag: 'Streetwear' },
  { id: 'graphic-sunset', label: '80s California Sunset', tag: 'Vintage' },
  { id: 'graphic-skull', label: 'Death & Roses Tattoo', tag: 'Rock' },
  { id: 'graphic-mountain', label: 'Alpine Expedition 1984', tag: 'Outdoor' },
  { id: 'graphic-geometric', label: 'Bauhaus Modernist Art', tag: 'Minimal' },
  { id: 'graphic-abstract', label: 'Ethereal Wave Gradient', tag: 'Artistic' },
  { id: 'graphic-vintage-skate', label: 'Venice Skate Riot', tag: 'Y2K Skate' },
  { id: 'graphic-cosmic', label: 'Cosmic Voyager Deep Space', tag: 'Sci-Fi' },
];

const FONT_OPTIONS = [
  { id: "'Oswald', sans-serif", label: 'Oswald Bold' },
  { id: "'Montserrat', sans-serif", label: 'Montserrat Clean' },
  { id: "'Playfair Display', serif", label: 'Playfair Luxury' },
  { id: "'Courier New', monospace", label: 'Typewriter Mono' },
];

export const PODStudioModal: React.FC<PODStudioModalProps> = ({
  isOpen,
  onClose,
  settings,
  onAddToCart,
}) => {
  if (!isOpen) return null;

  const [selectedColor, setSelectedColor] = useState(AVAILABLE_COLORS[0]);
  const [selectedGraphic, setSelectedGraphic] = useState<GraphicType>('graphic-tokyo');
  const [customText, setCustomText] = useState('CUSTOM APPAREL');
  const [customFont, setCustomFont] = useState(FONT_OPTIONS[0].id);
  const [selectedSize, setSelectedSize] = useState('L');
  const [fitStyle, setFitStyle] = useState<'Standard' | 'Oversized Boxy' | 'Heavyweight 240GSM'>('Oversized Boxy');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'design' | 'text' | 'apparel'>('design');

  const basePrice = 34.99;
  const fitPriceAddon = fitStyle === 'Heavyweight 240GSM' ? 5.0 : fitStyle === 'Oversized Boxy' ? 3.0 : 0;
  const totalPrice = (basePrice + fitPriceAddon) * quantity;

  const handleSaveToBag = () => {
    const graphicMeta = GRAPHIC_OPTIONS.find((g) => g.id === selectedGraphic);
    onAddToCart({
      productId: `custom-${Date.now()}`,
      name: `Custom POD ${graphicMeta?.label || 'T-Shirt'} (${fitStyle})`,
      price: basePrice + fitPriceAddon,
      size: selectedSize,
      shirtColor: selectedColor.hex,
      shirtColorName: selectedColor.name,
      graphicType: selectedGraphic,
      customText: customText.trim() ? customText : undefined,
      quantity,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md flex items-center justify-center p-4 md:p-6 select-none animate-fade-in">
      <div className="bg-white rounded-2xl max-w-5xl w-full overflow-hidden shadow-2xl flex flex-col md:flex-row border border-neutral-200 max-h-[90vh]">
        {/* Left: Interactive Live Mockup Preview Canvas */}
        <div className="md:w-1/2 bg-gradient-to-br from-neutral-100 to-neutral-200 p-8 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Subtle studio grid background */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #737373 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Live Mockup Badge */}
          <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-neutral-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>LIVE 3D POD PREVIEW</span>
          </div>

          <div className="w-full max-w-sm aspect-square relative flex items-center justify-center py-4">
            <TShirtMockup
              shirtColor={selectedColor.hex}
              graphicType={selectedGraphic}
              customText={customText}
              customFont={customFont}
              showShadow={true}
              className="w-full h-full drop-shadow-2xl"
            />
          </div>

          {/* Color & Spec overview pill */}
          <div className="mt-2 bg-white/90 backdrop-blur-sm border border-neutral-300/80 rounded-xl px-4 py-2 flex items-center space-x-4 text-xs font-medium text-neutral-700 shadow-sm">
            <div className="flex items-center space-x-1.5">
              <span
                className="w-3 h-3 rounded-full border border-neutral-300 inline-block"
                style={{ backgroundColor: selectedColor.hex }}
              />
              <span>{selectedColor.name}</span>
            </div>
            <span className="text-neutral-300">|</span>
            <span>Fit: <strong>{fitStyle}</strong></span>
            <span className="text-neutral-300">|</span>
            <span>Size: <strong>{selectedSize}</strong></span>
          </div>
        </div>

        {/* Right: Customization Controls & Configuration Panel */}
        <div className="md:w-1/2 flex flex-col bg-white overflow-y-auto">
          {/* Top Bar */}
          <div className="p-6 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white z-10">
            <div>
              <div className="flex items-center space-x-2 text-amber-600 font-bold text-xs uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Interactive Studio</span>
              </div>
              <h2 className="font-['Oswald'] font-bold text-2xl tracking-wide uppercase text-neutral-900 mt-0.5">
                CUSTOM POD DESIGNER
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition"
              aria-label="Close studio"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-neutral-200 px-6 bg-neutral-50/70 text-xs font-bold uppercase tracking-wider">
            <button
              onClick={() => setActiveTab('design')}
              className={`py-3 mr-6 flex items-center space-x-1.5 border-b-2 transition ${
                activeTab === 'design'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>1. Graphic & Color</span>
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`py-3 mr-6 flex items-center space-x-1.5 border-b-2 transition ${
                activeTab === 'text'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>2. Custom Lettering</span>
            </button>
            <button
              onClick={() => setActiveTab('apparel')}
              className={`py-3 flex items-center space-x-1.5 border-b-2 transition ${
                activeTab === 'apparel'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>3. Fabric & Sizing</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6 flex-1 space-y-6 overflow-y-auto">
            {activeTab === 'design' && (
              <div className="space-y-6">
                {/* Garment Color Selection */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block mb-2.5">
                    Garment Base Tone: <span className="text-neutral-900 font-semibold">{selectedColor.name}</span>
                  </label>
                  <div className="grid grid-cols-5 gap-2.5">
                    {AVAILABLE_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => setSelectedColor(c)}
                        className={`group relative flex flex-col items-center p-2 rounded-xl border transition ${
                          selectedColor.hex === c.hex
                            ? 'border-neutral-900 bg-neutral-50 ring-2 ring-neutral-900/10'
                            : 'border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-full border border-neutral-300 shadow-inner flex items-center justify-center"
                          style={{ backgroundColor: c.hex }}
                        >
                          {selectedColor.hex === c.hex && (
                            <Check className={`w-4 h-4 ${c.isLight ? 'text-black' : 'text-white'}`} />
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-600 mt-1 font-medium truncate w-full text-center">
                          {c.name.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Print Graphic Choice */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block mb-2.5">
                    DTG Graphic Template:
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {GRAPHIC_OPTIONS.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setSelectedGraphic(g.id)}
                        className={`text-left p-3 rounded-xl border transition flex flex-col justify-between ${
                          selectedGraphic === g.id
                            ? 'border-neutral-900 bg-neutral-900 text-white'
                            : 'border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100 text-neutral-800'
                        }`}
                      >
                        <div>
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              selectedGraphic === g.id ? 'bg-amber-400 text-black' : 'bg-neutral-200 text-neutral-700'
                            }`}
                          >
                            {g.tag}
                          </span>
                          <h4 className="text-xs font-bold mt-1 font-['Montserrat',sans-serif]">
                            {g.label}
                          </h4>
                        </div>
                        <span className={`text-[10px] mt-2 ${selectedGraphic === g.id ? 'text-neutral-300' : 'text-neutral-400'}`}>
                          High-Res Vector Print
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'text' && (
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block mb-2">
                    Front Print Inscription / Custom Brand Text:
                  </label>
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value.toUpperCase())}
                    maxLength={28}
                    placeholder="ENTER SLOGAN OR BRAND NAME"
                    className="w-full text-sm font-bold uppercase tracking-wider border border-neutral-300 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-900"
                  />
                  <div className="flex justify-between text-[11px] text-neutral-400 mt-1">
                    <span>Rendered directly into print artwork</span>
                    <span>{customText.length}/28 characters</span>
                  </div>
                </div>

                {/* Font Typography Selector */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block mb-2.5">
                    Typography Typeface:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {FONT_OPTIONS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setCustomFont(f.id)}
                        className={`p-3 rounded-xl border text-left transition ${
                          customFont === f.id
                            ? 'border-neutral-900 bg-neutral-50 ring-2 ring-neutral-900/10'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <span className="text-xs block text-neutral-400 mb-1">{f.label}</span>
                        <span className="text-base font-bold text-neutral-900 truncate block" style={{ fontFamily: f.id }}>
                          ORITINA 1994
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'apparel' && (
              <div className="space-y-6">
                {/* Silhouette / Fit Type */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block mb-2.5">
                    Garment Silhouette & Fabric Weight:
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: 'Standard', desc: '100% Combed Ring-Spun Cotton 180GSM', addon: 'Standard Base' },
                      { id: 'Oversized Boxy', desc: 'Drop-shoulder street cut with thick collar (+ $3.00)', addon: 'Trending' },
                      { id: 'Heavyweight 240GSM', desc: 'Ultra-dense luxury French terry cotton (+ $5.00)', addon: 'Premium' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFitStyle(f.id as any)}
                        className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition ${
                          fitStyle === f.id
                            ? 'border-neutral-900 bg-neutral-50 ring-2 ring-neutral-900/10'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div>
                          <span className="text-xs font-bold text-neutral-900 block">{f.id}</span>
                          <span className="text-[11px] text-neutral-500">{f.desc}</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            fitStyle === f.id ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {f.addon}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sizing Grid */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block mb-2.5">
                    Select Size:
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {['XS', 'S', 'M', 'L', 'XL', '2XL'].map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setSelectedSize(sz)}
                        className={`py-3 text-xs font-bold rounded-xl border transition ${
                          selectedSize === sz
                            ? 'border-neutral-900 bg-neutral-900 text-white'
                            : 'border-neutral-200 hover:border-neutral-400 text-neutral-800'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar with Price & Add to Cart */}
          <div className="p-6 border-t border-neutral-200 bg-white sticky bottom-0 z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[11px] text-neutral-400 uppercase font-semibold">Ready to print</span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold font-['Oswald'] text-neutral-900">
                    {settings.currencySymbol}
                    {totalPrice.toFixed(2)}
                  </span>
                  {fitPriceAddon > 0 && (
                    <span className="text-xs text-amber-600 font-semibold">
                      (Includes +${fitPriceAddon.toFixed(2)} {fitStyle.split(' ')[0]} fit)
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity */}
              <div className="flex items-center border border-neutral-300 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-sm font-bold text-neutral-600 hover:bg-neutral-100"
                >
                  -
                </button>
                <span className="px-3 text-xs font-bold text-neutral-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1.5 text-sm font-bold text-neutral-600 hover:bg-neutral-100"
                >
                  +
                </button>
              </div>
            </div>

            <button
              id="pod-studio-add-to-cart"
              onClick={handleSaveToBag}
              className="w-full py-4 bg-amber-400 hover:bg-amber-500 text-black font-['Oswald'] font-bold text-sm tracking-wider uppercase rounded-xl flex items-center justify-center space-x-2 transition shadow-lg active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>ADD CUSTOM DESIGN TO BAG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
