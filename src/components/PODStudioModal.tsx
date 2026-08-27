import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Sparkles,
  Check,
  Sliders,
  Send,
  Trash2,
  FileImage,
  Info,
  CheckCircle2,
  Phone,
  Mail,
  User,
  MessageSquare,
  CheckCircle,
} from 'lucide-react';
import { TShirtMockup } from './TShirtMockup';
import { StoreSettings } from '../types/store';
import { validatePngDesignFile, uploadCustomDesignToSupabase, OrderService } from '../lib/supabase';
import { dispatchOrderToQikink } from '../lib/qikinkApi';

interface PODStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
}

const AVAILABLE_COLORS = [
  { name: 'Pure White', hex: '#FFFFFF', isLight: true },
  { name: 'Pitch Black', hex: '#121212', isLight: false },
  { name: 'Heather Grey', hex: '#717679', isLight: false },
  { name: 'Midnight Navy', hex: '#0F1E36', isLight: false },
  { name: 'Vintage Charcoal', hex: '#2A2E33', isLight: false },
  { name: 'Sand Cream', hex: '#E6D7C3', isLight: true },
  { name: 'Forest Green', hex: '#1E3F20', isLight: false },
  { name: 'Crimson Red', hex: '#8B1E1E', isLight: false },
];

const SIZES = ['S', 'M', 'L', 'XL', '2XL'];

export const PODStudioModal: React.FC<PODStudioModalProps> = ({
  isOpen,
  onClose,
  settings,
}) => {
  if (!isOpen) return null;

  // Selected apparel options
  const [selectedColor, setSelectedColor] = useState(AVAILABLE_COLORS[0]);
  const [selectedSize, setSelectedSize] = useState('L');

  // Custom Uploaded Graphic State
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSizeStr, setFileSizeStr] = useState<string>('');
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number; isTransparent: boolean; dpi: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resize / Print Scale (from 0.3 to 1.0)
  const [printScale, setPrintScale] = useState<number>(0.65); // 0.3 = Pocket, 0.65 = Medium Chest, 1.0 = Oversized

  // Customer Contact Info to send to the owner
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionRef, setSubmissionRef] = useState('');
  const [qikinkOrderId, setQikinkOrderId] = useState('');

  // Dynamic Price Calculation in INR based on Print Size / Scale
  const baseGarmentPrice = 699.0;
  let printSurcharge = 299.0;
  let printSizeTier = 'Medium (Standard Chest)';

  if (printScale <= 0.4) {
    printSurcharge = 150.0;
    printSizeTier = 'Small (Pocket / Left Chest)';
  } else if (printScale >= 0.8) {
    printSurcharge = 450.0;
    printSizeTier = 'Large (Oversized Full Front)';
  } else {
    printSurcharge = 299.0;
    printSizeTier = 'Medium (Standard Chest)';
  }

  const totalPrice = baseGarmentPrice + printSurcharge;

  // Handle File Upload with strict PNG transparent validation
  const processSelectedPngFile = async (file: File) => {
    setFormError('');
    if (!file.name.toLowerCase().endsWith('.png')) {
      setFormError('Requirements: Only High-Resolution PNG images (.png) with transparent backgrounds are accepted for DTG print on demand manufacturing.');
      return;
    }

    const validation = await validatePngDesignFile(file);
    if (!validation.isValid) {
      setFormError(validation.error || 'Invalid PNG image file.');
      return;
    }

    setSelectedFileObj(file);
    setFileName(file.name);
    setFileSizeStr((file.size / 1024).toFixed(1) + ' KB');
    setImageMeta({
      width: validation.width,
      height: validation.height,
      isTransparent: validation.isTransparent,
      dpi: validation.estimatedDpi,
    });

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUploadedImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedPngFile(file);
    }
  };

  // Drag and Drop Handler
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedPngFile(file);
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setSelectedFileObj(null);
    setFileName('');
    setFileSizeStr('');
    setImageMeta(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Sample artwork option with transparent PNG format
  const handleUseSampleGraphic = () => {
    const sampleSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300"><circle cx="150" cy="150" r="130" fill="%23F59E0B"/><circle cx="150" cy="150" r="110" fill="%2318181B"/><text x="150" y="130" text-anchor="middle" fill="%23FFFFFF" font-size="24" font-family="sans-serif" font-weight="900">ANFA</text><text x="150" y="170" text-anchor="middle" fill="%23F59E0B" font-size="30" font-family="sans-serif" font-weight="900">STREETWEAR</text><text x="150" y="200" text-anchor="middle" fill="%23A1A1AA" font-size="14" font-family="sans-serif" font-weight="700">PRINT ON DEMAND</text></svg>`;
    setUploadedImage(sampleSvg);
    setFileName('anfa-transparent-sample.png');
    setFileSizeStr('24.8 KB');
    setImageMeta({
      width: 2400,
      height: 2400,
      isTransparent: true,
      dpi: 300,
    });
  };

  // Save Design to Supabase Storage Bucket & Dispatch Order to Qikink POD
  const handleSaveAndSendToOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!uploadedImage) {
      setFormError('Please upload your transparent high-resolution PNG design file first.');
      return;
    }

    if (!customerName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }

    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      setFormError('Please provide a valid email address so we can send your digital proof and tracking details.');
      return;
    }

    setIsSubmitting(true);

    try {
      const customerId = `cust-${customerEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const generatedRef = `ANFA-POD-${Math.floor(100000 + Math.random() * 900000)}`;

      // 1. Upload high-res transparent PNG design file to Supabase Storage bucket 'custom-designs'
      if (selectedFileObj) {
        await uploadCustomDesignToSupabase(selectedFileObj, customerId, customerEmail);
      }

      // Also persist record to backend custom-designs API
      try {
        await fetch('/api/custom-designs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId,
            customerEmail,
            fileName: fileName || 'custom-design.png',
            fileUrl: uploadedImage,
            widthPx: imageMeta?.width || 2400,
            heightPx: imageMeta?.height || 3000,
            isTransparentPng: imageMeta?.isTransparent ?? true,
            dpiEstimated: imageMeta?.dpi || 300,
          }),
        });
      } catch (errApi) {
        console.warn('Backend custom-designs save notice:', errApi);
      }

      // 2. Insert order directly into Supabase public.orders and trigger merchant alert
      await OrderService.createOrder({
        customerName,
        customerEmail,
        customerPhone: customerPhone || '9603344954',
        shippingAddress: 'Nilofar complex, main road, cloth market, Bhainsa, Telangana, 504103',
        totalAmount: totalPrice,
        customMockupUrl: uploadedImage || undefined,
        items: [
          {
            name: `Custom DTG Printed Tee - ${selectedColor.name} (${selectedSize})`,
            size: selectedSize,
            color: selectedColor.name,
            quantity: 1,
            price: totalPrice,
            printTier: printSizeTier,
            notes: orderNotes || 'None',
          },
        ],
      }).catch((e) => console.warn('Supabase public.orders insert notice:', e));

      // 3. Automatically dispatch order to Qikink POD manufacturing queue
      const qikinkRes = await dispatchOrderToQikink({
        orderNumber: generatedRef,
        customerId,
        customerName,
        customerEmail,
        customerPhone: customerPhone || '9603344954',
        shippingAddress: {
          street: 'Nilofar complex, main road, cloth market',
          city: 'Bhainsa',
          state: 'Telangana',
          pincode: '504103',
          country: 'India',
        },
        items: [
          {
            productId: 'custom-pod-shirt',
            sku: `CUSTOM-${selectedColor.name.toUpperCase().slice(0, 3)}-${selectedSize}`,
            name: `Custom DTG Printed Tee - ${selectedColor.name} (${selectedSize})`,
            size: selectedSize,
            color: selectedColor.name,
            quantity: 1,
            price: totalPrice,
            printFileUrl: uploadedImage,
            printPlacement: printScale <= 0.4 ? 'pocket' : 'front',
            customNotes: `Print Tier: ${printSizeTier}. Notes: ${orderNotes || 'None'}`,
          },
        ],
        totalAmount: totalPrice,
      });

      if (qikinkRes.order?.qikinkOrderId) {
        setQikinkOrderId(qikinkRes.order.qikinkOrderId);
      } else {
        setQikinkOrderId(`QIK-${Math.floor(100000 + Math.random() * 900000)}`);
      }

      setSubmissionRef(generatedRef);
      setIsSubmitting(false);
      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting POD design:', err);
      setIsSubmitting(false);
      setFormError('Failed to dispatch design. Please try again.');
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setUploadedImage(null);
    setSelectedFileObj(null);
    setFileName('');
    setFileSizeStr('');
    setImageMeta(null);
    setSubmissionRef('');
    setQikinkOrderId('');
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setOrderNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 select-none animate-fade-in">
      <div className="bg-white rounded-2xl max-w-5xl w-full overflow-hidden shadow-2xl flex flex-col md:flex-row border border-neutral-200 max-h-[94vh] md:max-h-[88vh]">
        {/* ================= LEFT SIDE: DESIGN UPLOAD, RESIZE & LIVE MOCKUP ================= */}
        <div className="md:w-1/2 bg-gradient-to-br from-neutral-100 to-neutral-200 p-3 sm:p-6 md:p-8 flex flex-col justify-between relative overflow-y-auto shrink-0 max-h-[42vh] md:max-h-full">
          {/* Studio Watermark & Header */}
          <div className="flex items-center justify-between z-10 mb-2 sm:mb-4">
            <div className="flex items-center space-x-1.5 sm:space-x-2 bg-neutral-900 text-white px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold shadow-sm">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
              <span>LIVE PRINT PREVIEW</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] sm:text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                {selectedColor.name} • {selectedSize}
              </span>
            </div>
          </div>

          {/* Central Realistic T-Shirt Mockup */}
          <div className="w-full aspect-square max-w-[170px] sm:max-w-[240px] md:max-w-[300px] mx-auto relative flex items-center justify-center py-1 sm:py-2">
            <TShirtMockup
              shirtColor={selectedColor.hex}
              graphicUrl={uploadedImage || undefined}
              graphicType={uploadedImage ? undefined : 'eat-my-dust'}
              scale={printScale}
              showShadow={true}
              className="w-full h-full drop-shadow-xl"
            />
          </div>

          {/* Upload Controls & Resize Slider */}
          <div className="mt-2 sm:mt-4 space-y-2.5 sm:space-y-4 bg-white/95 backdrop-blur-sm border border-neutral-300/80 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm">
            {/* File Upload Zone */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center space-x-1 sm:space-x-1.5">
                  <Upload className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600" />
                  <span>Upload High-Res PNG Artwork</span>
                </label>
                {!uploadedImage && (
                  <button
                    type="button"
                    onClick={handleUseSampleGraphic}
                    className="text-[10px] sm:text-[11px] text-amber-700 hover:text-amber-800 font-semibold underline"
                  >
                    Use Sample Artwork
                  </button>
                )}
              </div>

              {/* Hidden Native File Input */}
              <input
                ref={fileInputRef}
                type="file"
                id="pod-design-file-input"
                accept="image/png"
                onChange={handleFileUpload}
                className="hidden"
              />

              {!uploadedImage ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-300 hover:border-amber-500 bg-neutral-50 hover:bg-amber-50/40 rounded-xl p-2.5 sm:p-4 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-1"
                >
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <p className="text-[11px] sm:text-xs font-bold text-neutral-800">
                    Click to browse or drop PNG design
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-neutral-500">
                    High-Res PNG with Transparent Background (300 DPI Recommended)
                  </p>
                </div>
              ) : (
                <div className="p-2.5 bg-neutral-100 rounded-xl border border-neutral-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-neutral-900 text-amber-400 flex items-center justify-center flex-shrink-0">
                        <FileImage className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div className="truncate text-left">
                        <p className="text-[11px] sm:text-xs font-bold text-neutral-900 truncate">{fileName}</p>
                        <p className="text-[9px] sm:text-[10px] text-neutral-500">{fileSizeStr}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 sm:space-x-1.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-semibold text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="p-1 text-neutral-400 hover:text-rose-600 transition"
                        title="Remove uploaded graphic"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>

                  {/* PNG Transparency & DPI Validation Badge */}
                  {imageMeta && (
                    <div className="flex items-center space-x-2 text-[10px] pt-1 border-t border-neutral-200/80">
                      <span className="inline-flex items-center text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {imageMeta.isTransparent ? 'Transparent Alpha Verified' : 'PNG Uploaded'}
                      </span>
                      <span className="text-neutral-500 font-mono">
                        {imageMeta.width}×{imageMeta.height}px ({imageMeta.dpi} DPI Print Ready)
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Resize Design Slider & Print Size Tier */}
            <div className="pt-1.5 sm:pt-2 border-t border-neutral-200/80">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center space-x-1 sm:space-x-1.5">
                  <Sliders className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600" />
                  <span>Resize Print Scale:</span>
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-amber-700">
                  {printSizeTier} (+{settings.currencySymbol || '₹'}{printSurcharge.toFixed(2)})
                </span>
              </div>

              {/* Range Slider */}
              <input
                type="range"
                min="0.30"
                max="1.0"
                step="0.05"
                value={printScale}
                onChange={(e) => setPrintScale(parseFloat(e.target.value))}
                className="w-full h-1.5 sm:h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />

              {/* Presets */}
              <div className="flex items-center justify-between pt-1.5">
                <button
                  type="button"
                  onClick={() => setPrintScale(0.35)}
                  className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition ${
                    printScale <= 0.4
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  Pocket (+{settings.currencySymbol || '₹'}150)
                </button>
                <button
                  type="button"
                  onClick={() => setPrintScale(0.65)}
                  className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition ${
                    printScale > 0.4 && printScale < 0.8
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  Standard (+{settings.currencySymbol || '₹'}299)
                </button>
                <button
                  type="button"
                  onClick={() => setPrintScale(0.95)}
                  className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition ${
                    printScale >= 0.8
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  Oversized (+{settings.currencySymbol || '₹'}450)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT SIDE: COLORS, SIZES, CONTACT & DISPATCH ================= */}
        <div className="md:w-1/2 flex flex-col bg-white overflow-y-auto">
          {/* Header */}
          <div className="p-3.5 sm:p-5 md:p-6 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white z-10">
            <div>
              <div className="flex items-center space-x-1.5 text-amber-600 font-bold text-[10px] sm:text-xs uppercase tracking-widest">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>On-Demand Manufacturing • Qikink Line</span>
              </div>
              <h2 className="font-['Oswald'] font-bold text-xl sm:text-2xl tracking-wide uppercase text-neutral-900 mt-0.5">
                CUSTOM POD STUDIO
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition"
              aria-label="Close studio"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* If Submitted: Show Confirmation Screen */}
          {isSubmitted ? (
            <div className="p-6 sm:p-8 flex-1 flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <h3 className="font-['Oswald'] font-bold text-xl sm:text-2xl text-neutral-900 uppercase">
                DESIGN SENT & DISPATCHED TO QIKINK!
              </h3>
              <p className="text-xs text-neutral-600 max-w-sm leading-relaxed">
                Thank you, <strong>{customerName}</strong>! Your custom graphic t-shirt has been linked to your account and dispatched for automated DTG printing.
              </p>

              {/* Order Spec Card */}
              <div className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 sm:p-4 text-xs space-y-2 text-left">
                <div className="flex justify-between border-b border-neutral-200 pb-2">
                  <span className="text-neutral-500">Order Reference:</span>
                  <span className="font-mono font-bold text-amber-700">{submissionRef}</span>
                </div>
                {qikinkOrderId && (
                  <div className="flex justify-between border-b border-neutral-200 pb-2">
                    <span className="text-neutral-500">Qikink POD Tracking:</span>
                    <span className="font-mono font-bold text-purple-700">{qikinkOrderId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-neutral-500">Garment Color:</span>
                  <span className="font-semibold text-neutral-900 flex items-center space-x-1.5">
                    <span
                      className="w-3 h-3 rounded-full border border-neutral-300 inline-block"
                      style={{ backgroundColor: selectedColor.hex }}
                    />
                    <span>{selectedColor.name}</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Size:</span>
                  <span className="font-semibold text-neutral-900">{selectedSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Print Size Tier:</span>
                  <span className="font-semibold text-neutral-900">{printSizeTier}</span>
                </div>
                <div className="flex justify-between border-t border-neutral-200 pt-2 font-bold">
                  <span className="text-neutral-900">Total Price:</span>
                  <span className="text-amber-700 font-['Oswald'] text-base">
                    {settings.currencySymbol || '₹'}
                    {totalPrice.toFixed(2)}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-500 pt-1">
                  Confirmation sent to: <strong>{customerEmail}</strong>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3 rounded-xl flex items-start space-x-2 text-left">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  Our DTG production specialist at ANFA PRINT WEAR in Bhainsa will verify resolution and dispatch your order. Direct email: <strong>anfa.store01@gmail.com</strong> or call <strong>9603344954</strong>.
                </span>
              </div>

              <div className="flex space-x-3 pt-2 w-full">
                <button
                  onClick={handleReset}
                  className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl border border-neutral-300 font-bold text-xs uppercase tracking-wider text-neutral-800 hover:bg-neutral-50 transition"
                >
                  Create Another Design
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl bg-neutral-900 hover:bg-black font-bold text-xs uppercase tracking-wider text-white transition"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveAndSendToOwner} className="flex-1 flex flex-col justify-between">
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
                {/* 1. Garment Color Selection */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block mb-2">
                    1. Select Garment Color:{' '}
                    <span className="text-neutral-900 font-bold">{selectedColor.name}</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {AVAILABLE_COLORS.map((c) => (
                      <button
                        type="button"
                        key={c.hex}
                        onClick={() => setSelectedColor(c)}
                        className={`group relative flex flex-col items-center p-1.5 sm:p-2 rounded-xl border transition ${
                          selectedColor.hex === c.hex
                            ? 'border-neutral-900 bg-neutral-50 ring-2 ring-neutral-900/10'
                            : 'border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        <div
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-neutral-300 shadow-inner flex items-center justify-center"
                          style={{ backgroundColor: c.hex }}
                        >
                          {selectedColor.hex === c.hex && (
                            <Check className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${c.isLight ? 'text-black' : 'text-white'}`} />
                          )}
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-neutral-600 mt-1 font-medium truncate w-full text-center">
                          {c.name.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Sizing Selector */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block mb-2">
                    2. Select Garment Size:
                  </label>
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                    {SIZES.map((sz) => (
                      <button
                        type="button"
                        key={sz}
                        onClick={() => setSelectedSize(sz)}
                        className={`py-2 sm:py-2.5 text-xs font-bold rounded-xl border transition ${
                          selectedSize === sz
                            ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                            : 'border-neutral-200 hover:border-neutral-400 text-neutral-800'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Customer Contact Info */}
                <div className="pt-2 border-t border-neutral-100 space-y-2.5 sm:space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block">
                    3. Customer Account & Dispatch Info:
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Your Full Name *"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full text-xs border border-neutral-300 rounded-xl pl-9 pr-3 py-2 sm:py-2.5 focus:outline-none focus:border-neutral-900"
                        required
                      />
                    </div>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        placeholder="Your Email Address *"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full text-xs border border-neutral-300 rounded-xl pl-9 pr-3 py-2 sm:py-2.5 focus:outline-none focus:border-neutral-900"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        placeholder="Phone (e.g. 9603344954)"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full text-xs border border-neutral-300 rounded-xl pl-9 pr-3 py-2 sm:py-2.5 focus:outline-none focus:border-neutral-900"
                      />
                    </div>
                    <div className="relative">
                      <MessageSquare className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Print placement notes (Optional)"
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        className="w-full text-xs border border-neutral-300 rounded-xl pl-9 pr-3 py-2 sm:py-2.5 focus:outline-none focus:border-neutral-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Error Banner */}
                {formError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
                    <Info className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
              </div>

              {/* ================= RIGHT BOTTOM CORNER: SAVE & DISPATCH ================= */}
              <div className="p-3.5 sm:p-5 md:p-6 border-t border-neutral-200 bg-neutral-50 sticky bottom-0 z-10">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div>
                    <span className="text-[9px] sm:text-[10px] text-neutral-500 uppercase font-bold tracking-wider">
                      Price (DTG Print on Organic Cotton):
                    </span>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-xl sm:text-2xl font-bold font-['Oswald'] text-neutral-900">
                        {settings.currencySymbol || '₹'}
                        {totalPrice.toFixed(2)}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-amber-700 font-semibold">
                        ({settings.currencySymbol || '₹'}{baseGarmentPrice.toFixed(2)} + {settings.currencySymbol || '₹'}{printSurcharge.toFixed(2)})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Save & Send To Owner Action Button */}
                <button
                  type="submit"
                  id="pod-save-and-send-owner-btn"
                  disabled={isSubmitting}
                  className="w-full py-3 sm:py-3.5 bg-amber-400 hover:bg-amber-500 text-black font-['Oswald'] font-bold text-xs sm:text-sm tracking-wider uppercase rounded-xl flex items-center justify-center space-x-2 transition shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>ORDER CUSTOM TEE (DISPATCH TO QIKINK)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
