import React, { useState } from 'react';
import {
  MapPin,
  Clock,
  Mail,
  Phone,
  ArrowUp,
  Facebook,
  Twitter,
  Dribbble,
  Instagram,
  Youtube,
  CheckCircle2,
} from 'lucide-react';
import { StoreSettings } from '../types/store';

interface FooterProps {
  settings: StoreSettings;
  onOpenPage?: (pageTitle: string) => void;
  onSelectCategory?: (category: string) => void;
  onOpenCustomizer?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  onOpenPage,
  onSelectCategory,
  onOpenCustomizer,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setIsSubscribed(true);
      setTimeout(() => {
        setEmailInput('');
      }, 2500);
    }
  };

  const handleLinkClick = (pageTitle: string) => {
    if (onOpenPage) {
      onOpenPage(pageTitle);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="footer-section" className="bg-[#0c131a] text-neutral-300 pt-16 pb-8 border-t border-neutral-800 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main 4-Column Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-14">
          {/* Column 1: Brand & About Links */}
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="font-['Oswald'] font-black text-2xl sm:text-3xl tracking-widest text-white uppercase">
                {settings.storeName || 'ORITINA'}
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ml-1 shadow-[0_0_8px_rgba(251,191,36,0.8)] inline-block"></span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {settings.tagline || 'Premium Print On Demand Apparel & Custom Streetwear'}
            </p>

            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <button onClick={() => handleLinkClick('About us')} className="hover:text-white transition">
                  About us
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('Reasons to shop')} className="hover:text-white transition">
                  Reasons to shop
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('What our customers say')} className="hover:text-white transition">
                  What our customers say
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('Meet the team')} className="hover:text-white transition">
                  Meet the team
                </button>
              </li>
              {onOpenCustomizer && (
                <li>
                  <button onClick={onOpenCustomizer} className="text-amber-400 hover:text-amber-300 font-semibold transition">
                    ★ Launch POD Customizer Studio
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Column 2: Customer Care / Policy Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-['Montserrat',sans-serif] font-bold text-white uppercase tracking-wider">
              Customer Care
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <button onClick={() => handleLinkClick('Contact us')} className="hover:text-white transition">
                  Contact us
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('Help and advice')} className="hover:text-white transition">
                  Help and advice
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('Delivery')} className="hover:text-white transition">
                  Delivery (Free over {settings.currencySymbol}{settings.freeDeliveryThreshold})
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('Terms and conditions')} className="hover:text-white transition">
                  Terms and conditions
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('Refund Policy')} className="hover:text-white transition">
                  Refund Policy (30-Day Guarantee)
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('FAQs')} className="hover:text-white transition">
                  FAQs & DTG Care Guide
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Newsletter & Social */}
          <div className="space-y-4">
            <h4 className="text-sm font-['Montserrat',sans-serif] font-bold text-white uppercase tracking-wider">
              Newsletter
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Join up to get the latest on drops, summer sales, and private promo codes.
            </p>

            {/* Newsletter Input Form */}
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <input
                  id="newsletter-email-input"
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter Your Email"
                  className="flex-1 bg-white text-neutral-900 text-xs px-3.5 py-2.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  id="newsletter-subscribe-btn"
                  type="submit"
                  className="bg-[#E85A19] hover:bg-[#D94F0E] text-white font-['Oswald'] font-bold text-xs tracking-wider uppercase px-4 py-2.5 rounded-sm transition active:scale-95 whitespace-nowrap"
                >
                  SUBSCRIBE
                </button>
              </div>
              {isSubscribed && (
                <div className="flex items-center space-x-1 text-emerald-400 text-xs mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Thank you for subscribing! Check your inbox for 15% off.</span>
                </div>
              )}
            </form>

            {/* Social Icons */}
            <div className="flex items-center space-x-4 pt-2 text-neutral-400">
              <a href="#facebook" className="hover:text-white transition" aria-label="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#twitter" className="hover:text-white transition" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#dribbble" className="hover:text-white transition" aria-label="Dribbble">
                <Dribbble className="w-4 h-4" />
              </a>
              <a href="#instagram" className="hover:text-white transition" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#youtube" className="hover:text-white transition" aria-label="YouTube">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 4: Contact Us Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-['Montserrat',sans-serif] font-bold text-white uppercase tracking-wider">
              Contact Us
            </h4>
            <ul className="space-y-3 text-xs text-neutral-400">
              <li className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{settings.address}</span>
              </li>
              <li className="flex items-start space-x-2.5">
                <Clock className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{settings.workingHours}</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <a href={`mailto:${settings.email}`} className="hover:text-white transition">
                  {settings.email}
                </a>
              </li>
              <li className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <a href={`tel:${settings.phone.replace(/[^0-9+]/g, '')}`} className="hover:text-white transition font-mono">
                  {settings.phone}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Payment Gateways */}
        <div className="pt-8 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>
            Copyright © {settings.copyrightYear} design by {settings.storeName || 'Vinavathemes'}. All rights reserved.
          </p>

          {/* Payment Gateways Badges */}
          <div className="flex items-center space-x-2">
            <div className="h-6 px-2 bg-white rounded flex items-center justify-center space-x-[-4px]">
              <div className="w-3.5 h-3.5 rounded-full bg-red-600 opacity-90" />
              <div className="w-3.5 h-3.5 rounded-full bg-blue-600 opacity-90" />
            </div>
            <div className="h-6 px-2.5 bg-white rounded flex items-center justify-center">
              <span className="text-[10px] font-black italic tracking-tighter text-blue-900 font-sans">
                VISA
              </span>
            </div>
            <div className="h-6 px-2.5 bg-white rounded flex items-center justify-center">
              <span className="text-[10px] font-bold italic text-blue-600 font-sans">
                Pay<span className="text-sky-500">Pal</span>
              </span>
            </div>
            <div className="h-6 px-2 bg-white rounded flex items-center justify-center space-x-[-3px]">
              <div className="w-3 h-3 rounded-full bg-sky-500" />
              <div className="w-3 h-3 rounded-full bg-blue-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Scroll To Top Button */}
      <button
        id="scroll-to-top-btn"
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 z-30 w-10 h-10 rounded-full bg-neutral-900/90 hover:bg-black text-white border border-neutral-700 hover:border-amber-400 shadow-xl flex items-center justify-center transition active:scale-95"
        title="Scroll to top"
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-4 h-4 text-amber-400" />
      </button>
    </footer>
  );
};
