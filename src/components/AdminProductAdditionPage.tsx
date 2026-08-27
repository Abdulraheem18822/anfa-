import React, { useState, useRef } from 'react';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  PackagePlus,
  Loader2,
  DollarSign,
  Layers,
  FileText,
  Image as ImageIcon,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { supabase, PRODUCT_IMAGES_BUCKET } from '../lib/supabase';
import { Product } from '../types/store';

interface AdminProductAdditionPageProps {
  onProductCreated?: (product: Product) => void;
  onCancel?: () => void;
}

export const AdminProductAdditionPage: React.FC<AdminProductAdditionPageProps> = ({
  onProductCreated,
  onCancel,
}) => {
  // Form Fields as requested
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState<number | string>('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState<number | string>(50);
  const [category, setCategory] = useState('new-arrival');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Status & Alerts
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setStatusMessage(null);
    }
  };

  const handleResetForm = () => {
    setTitle('');
    setPrice('');
    setDescription('');
    setStock(50);
    setImageFile(null);
    setImagePreview(null);
    setUploadedUrl(null);
    setStatusMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setUploadedUrl(null);

    // Validation
    if (!title.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a product title.' });
      return;
    }
    if (!price || Number(price) <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid price in ₹ (INR).' });
      return;
    }
    if (!imageFile) {
      setStatusMessage({ type: 'error', text: 'Please choose an image file for the product.' });
      return;
    }

    setIsLoading(true);
    console.log('[Admin Product Upload] Starting product submission process...');
    console.log('[Admin Product Upload] Form details:', { title, price, description, stock, fileName: imageFile.name });

    try {
      // -------------------------------------------------------------
      // Step 1: Upload the image file to Supabase Storage bucket 'product-images'
      // -------------------------------------------------------------
      const timestamp = Date.now();
      const sanitizedFileName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storageFilePath = `products/${timestamp}_${sanitizedFileName}`;

      console.log(`[Admin Product Upload] Step 1: Uploading file to bucket '${PRODUCT_IMAGES_BUCKET}' at '${storageFilePath}'...`);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .upload(storageFilePath, imageFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: imageFile.type || 'image/png',
        });

      if (uploadError) {
        console.error('[Admin Product Upload] Supabase Storage upload error:', uploadError);
        throw new Error(`Supabase Storage upload failed: ${uploadError.message}`);
      }

      console.log('[Admin Product Upload] Supabase Storage upload successful:', uploadData);

      // -------------------------------------------------------------
      // Step 2: Take the public image URL
      // -------------------------------------------------------------
      const { data: publicUrlData } = supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .getPublicUrl(storageFilePath);

      const image_url = publicUrlData.publicUrl;
      console.log('[Admin Product Upload] Step 2: Generated Public Image URL:', image_url);
      setUploadedUrl(image_url);

      // -------------------------------------------------------------
      // Step 3: Insert row into Supabase 'products' table
      // supabase.from('products').insert([{ title, price, description, stock, image_url }])
      // -------------------------------------------------------------
      const numPrice = Number(price);
      const numStock = Number(stock) || 0;
      const newProductId = `prod-${timestamp}`;

      const insertPayload = {
        id: newProductId,
        title: title.trim(),
        price: numPrice,
        description: description.trim(),
        stock: numStock,
        image_url: image_url,
        // Compatibility attributes with storefront catalog
        name: title.trim(),
        image: image_url,
        sku: `ANFA-${timestamp.toString().slice(-6)}`,
        category: category,
        gender: 'unisex',
        is_live: true,
        sizes: ['S', 'M', 'L', 'XL', '2XL'],
        created_at: new Date().toISOString(),
      };

      console.log('[Admin Product Upload] Step 3: Inserting row into supabase.from("products"):', insertPayload);

      const { data: insertedData, error: insertError } = await supabase
        .from('products')
        .insert([insertPayload])
        .select();

      if (insertError) {
        console.warn('[Admin Product Upload] Primary insert error, retrying minimal fields:', insertError);
        // Fallback to exact 5 fields if schema only has strict 5 columns
        const minimalInsert = {
          title: title.trim(),
          price: numPrice,
          description: description.trim(),
          stock: numStock,
          image_url: image_url,
        };

        const { data: retryData, error: retryError } = await supabase
          .from('products')
          .insert([minimalInsert])
          .select();

        if (retryError) {
          console.error('[Admin Product Upload] Database insert failed:', retryError);
          throw new Error(`Database record insertion failed: ${retryError.message}`);
        }

        console.log('[Admin Product Upload] Successfully inserted into products table (minimal schema):', retryData);
      } else {
        console.log('[Admin Product Upload] Successfully inserted into products table:', insertedData);
      }

      // Also persist to backend API cache so storefront updates immediately
      try {
        await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(insertPayload),
        });
      } catch (backendErr) {
        console.warn('[Admin Product Upload] Backend cache notice:', backendErr);
      }

      // Create product model for UI callbacks
      const createdProd: Product = {
        id: newProductId,
        sku: insertPayload.sku,
        name: title.trim(),
        price: numPrice,
        originalPrice: Math.round(numPrice * 1.5),
        rating: 5,
        reviewCount: 0,
        image: image_url,
        shirtColor: '#1E1E24',
        shirtColorName: 'Pitch Black',
        category: category,
        gender: 'unisex',
        badge: 'NEW ARRIVAL',
        description: description.trim(),
        sizes: ['S', 'M', 'L', 'XL', '2XL'],
        availableColors: [
          { name: 'Pitch Black', hex: '#1E1E24' },
          { name: 'Pure White', hex: '#FFFFFF' },
        ],
        graphicType: 'custom',
        graphicUrl: image_url,
        isLive: true,
        createdAt: new Date().toISOString(),
      };

      // -------------------------------------------------------------
      // Step 4: UI Success Toast Alert & Feedback
      // -------------------------------------------------------------
      setStatusMessage({
        type: 'success',
        text: `✓ Product "${title}" successfully uploaded to Supabase Storage & inserted into 'products' table!`,
      });

      if (onProductCreated) {
        onProductCreated(createdProd);
      }

      // Keep success visible, reset form fields
      setTitle('');
      setPrice('');
      setDescription('');
      setStock(50);
      setImageFile(null);
      setImagePreview(null);
    } catch (err: any) {
      console.error('[Admin Product Upload] Error during product addition:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'An unexpected error occurred while saving the product to Supabase.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-neutral-900 text-white rounded-3xl border border-neutral-800 p-6 md:p-8 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-neutral-800 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
            <PackagePlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-['Oswald'] font-bold uppercase tracking-wider text-white">
              Add New Product (Supabase Direct)
            </h2>
            <p className="text-xs text-neutral-400">
              Uploads image to bucket <code className="text-amber-400 font-mono">product-images</code> and inserts record into <code className="text-amber-400 font-mono">products</code> table.
            </p>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Status Alerts */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl mb-6 flex items-start space-x-3 text-sm font-medium ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p>{statusMessage.text}</p>
            {uploadedUrl && (
              <a
                href={uploadedUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-xs text-amber-400 hover:underline mt-2"
              >
                <span>View Uploaded Public Storage URL</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Image Upload & Preview */}
          <div className="lg:col-span-5 space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400">
              Product Image File *
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[220px] ${
                imagePreview
                  ? 'border-amber-400 bg-amber-400/5'
                  : 'border-neutral-700 hover:border-amber-400 bg-neutral-950'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {imagePreview ? (
                <div className="space-y-3 flex flex-col items-center">
                  <div className="w-36 h-36 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-700 relative flex items-center justify-center p-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <p className="text-xs text-amber-400 font-medium truncate max-w-[200px]">
                    {imageFile?.name}
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    Click to choose a different image
                  </p>
                </div>
              ) : (
                <div className="space-y-2 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-amber-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-white">Click to Select Image</p>
                  <p className="text-xs text-neutral-500">Supports PNG, JPG, WEBP (transparent PNG recommended)</p>
                </div>
              )}
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Target Collection Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white focus:outline-hidden focus:border-amber-400"
              >
                <option value="new-arrival">New Arrival</option>
                <option value="best-seller">Best Seller</option>
                <option value="featured">Featured Collection</option>
                <option value="dog-lovers">Dog Lovers</option>
                <option value="traveling">Traveling & Adventure</option>
                <option value="summer-special">Summer Streetwear</option>
                <option value="winter-special">Winter Streetwear</option>
              </select>
            </div>
          </div>

          {/* Right Column: Title, Price, Description, Stock */}
          <div className="lg:col-span-7 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Product Title *</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. 240 GSM Oversized Streetwear Graphic Tee"
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white focus:outline-hidden focus:border-amber-400"
              />
            </div>

            {/* Price & Stock in Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center space-x-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  <span>Price (₹ INR) *</span>
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  min="1"
                  placeholder="799"
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl text-sm font-bold text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Stock Quantity *</span>
                </label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                  min="0"
                  placeholder="50"
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl text-sm font-bold text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Product Description</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="100% Super-Combed Bio-Washed Organic Cotton, 240 GSM Heavyweight Streetwear Tee with 300 DPI high-density print."
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white focus:outline-hidden focus:border-amber-400 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-neutral-800">
          <button
            type="button"
            onClick={handleResetForm}
            disabled={isLoading}
            className="px-5 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold uppercase tracking-wider transition"
          >
            Clear
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3 bg-amber-400 hover:bg-amber-500 disabled:bg-neutral-700 text-black font-['Oswald'] font-bold text-sm uppercase tracking-wider rounded-xl shadow-lg transition flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading & Inserting to Supabase...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Save to Supabase 'products' Table</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
