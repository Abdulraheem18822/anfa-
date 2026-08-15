import React, { useState } from 'react';
import { X, Store, Save, RotateCcw, Check, Sparkles } from 'lucide-react';
import { StoreSettings } from '../types/store';
import { DEFAULT_STORE_SETTINGS } from '../data/mockData';

interface StoreSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  onSaveSettings: (newSettings: StoreSettings) => void;
}

export const StoreSettingsModal: React.FC<StoreSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    setFormData({ ...DEFAULT_STORE_SETTINGS });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl relative my-8 border border-neutral-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-900 text-white">
          <div className="flex items-center space-x-2">
            <Store className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-['Oswald'] font-bold text-lg tracking-wider uppercase">
                Customize Store Details
              </h3>
              <p className="text-[11px] text-neutral-400">
                Update your business identity, contact information, and store policies.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Shop Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Shop / Brand Name:
            </label>
            <input
              type="text"
              required
              value={formData.storeName}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              placeholder="e.g. ORITINA, URBAN APPAREL"
              className="w-full text-xs sm:text-sm font-semibold border border-neutral-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          {/* Store Tagline */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Tagline:
            </label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              placeholder="e.g. Premium Print On Demand Apparel"
              className="w-full text-xs border border-neutral-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-neutral-900"
            />
          </div>

          {/* Announcement Bar Text */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Top Announcement Banner:
            </label>
            <input
              type="text"
              value={formData.announcementText}
              onChange={(e) => setFormData({ ...formData, announcementText: e.target.value })}
              placeholder="SUMMER HOTLIST IS LIVE — FREE WORLDWIDE SHIPPING..."
              className="w-full text-xs border border-neutral-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-neutral-900"
            />
          </div>

          {/* Currency & Free Delivery */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Currency Symbol:
              </label>
              <input
                type="text"
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                placeholder="$"
                className="w-full text-xs font-mono font-bold border border-neutral-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-neutral-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Free Delivery Over:
              </label>
              <input
                type="number"
                value={formData.freeDeliveryThreshold}
                onChange={(e) => setFormData({ ...formData, freeDeliveryThreshold: Number(e.target.value) })}
                placeholder="250"
                className="w-full text-xs font-bold border border-neutral-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-neutral-900"
              />
            </div>
          </div>

          {/* Contact Email & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Support Email:
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="support@myshop.com"
                className="w-full text-xs border border-neutral-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-neutral-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Contact Phone:
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 234 567 8900"
                className="w-full text-xs border border-neutral-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-neutral-900"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Store Address / Location:
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Fashion Ave, Suite 400, New York NY"
              className="w-full text-xs border border-neutral-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-neutral-900"
            />
          </div>

          {/* Working Hours */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Working Hours:
            </label>
            <input
              type="text"
              value={formData.workingHours}
              onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
              placeholder="Monday - Sunday / 08.00AM - 19.00"
              className="w-full text-xs border border-neutral-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-neutral-900"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-neutral-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center space-x-1 text-xs text-neutral-500 hover:text-neutral-800 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savedSuccess}
                className="px-6 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center space-x-1.5 transition active:scale-95 shadow-md"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
