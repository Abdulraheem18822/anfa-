import React from 'react';
import {
  MapPin,
  Clock,
  Mail,
  Phone,
  ArrowUp,
  Facebook,
  Instagram,
  HelpCircle,
  FileText,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { StoreSettings } from '../types/store';
import { CustomerCareTab } from './CustomerCareModal';

interface FooterProps {
  settings: StoreSettings;
  onOpenCareTab?: (tab: CustomerCareTab) => void;
  onOpenPage?: (pageTitle: string) => void;
  onSelectCategory?: (category: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  onOpenCareTab,
  onOpenPage,
}) => {
  const handleCareClick = (tab: CustomerCareTab) => {
    if (onOpenCareTab) {
      onOpenCareTab(tab);
    } else if (onOpenPage) {
      onOpenPage(tab);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const instagramUrl = settings.instagramUrl || 'https://www.instagram.com/anfa_print_wear/';
  const facebookUrl = settings.facebookUrl || 'https://www.facebook.com/profile.php?id=61583160363825';

  return (
    <footer id="footer-section" className="bg-[#0c131a] text-neutral-300 pt-16 pb-8 border-t border-neutral-800 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main 3-Column Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14 mb-12">
          {/* Column 1: Brand & Craftsmanship */}
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="font-['Oswald'] font-black text-2xl sm:text-3xl tracking-widest text-white uppercase">
                {settings.storeName || 'ANFA PRINT WEAR'}
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ml-1.5 shadow-[0_0_8px_rgba(251,191,36,0.8)] inline-block"></span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-sm">
              {settings.tagline || 'Premium Print On Demand Apparel & Custom Streetwear'}. Handpicked from the best designers with heavyweight 240 GSM organic cotton and high-definition direct-to-garment pigment printing.
            </p>

            <div className="pt-2">
              <p className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase mb-2.5">
                Connect With Us On Social
              </p>
              <div className="flex items-center space-x-3 text-neutral-400">
                {/* Instagram Direct Link */}
                <a
                  id="footer-instagram-link"
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-neutral-900 hover:bg-gradient-to-tr hover:from-amber-500 hover:to-rose-500 hover:text-white flex items-center justify-center transition shadow-md group border border-neutral-800"
                  aria-label="Visit Anfa Print Wear on Instagram"
                >
                  <Instagram className="w-4 h-4 text-neutral-300 group-hover:text-white" />
                </a>

                {/* Facebook Direct Link */}
                <a
                  id="footer-facebook-link"
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-neutral-900 hover:bg-blue-600 hover:text-white flex items-center justify-center transition shadow-md group border border-neutral-800"
                  aria-label="Visit Anfa Print Wear on Facebook"
                >
                  <Facebook className="w-4 h-4 text-neutral-300 group-hover:text-white" />
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Customer Care Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-['Montserrat',sans-serif] font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <span>Customer Care</span>
            </h4>
            <ul className="space-y-3 text-xs text-neutral-400">
              <li>
                <button
                  id="footer-link-help"
                  onClick={() => handleCareClick('help')}
                  className="hover:text-amber-400 transition flex items-center space-x-2 text-left"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Help & Advice</span>
                </button>
              </li>
              <li>
                <button
                  id="footer-link-terms"
                  onClick={() => handleCareClick('terms')}
                  className="hover:text-amber-400 transition flex items-center space-x-2 text-left"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Terms & Conditions</span>
                </button>
              </li>
              <li>
                <button
                  id="footer-link-refund"
                  onClick={() => handleCareClick('refund')}
                  className="hover:text-amber-400 transition flex items-center space-x-2 text-left"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Refund Policy (Standard 30-Day Policy)</span>
                </button>
              </li>
              <li>
                <button
                  id="footer-link-faqs"
                  onClick={() => handleCareClick('faqs')}
                  className="hover:text-amber-400 transition flex items-center space-x-2 text-left"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>FAQs & E-Gift Care Guides</span>
                </button>
              </li>
              <li>
                <button
                  id="footer-link-contact"
                  onClick={() => handleCareClick('contact')}
                  className="hover:text-amber-400 transition flex items-center space-x-2 text-left"
                >
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>Contact Us (Customer Support)</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Info & Working Hours */}
          <div className="space-y-4">
            <h4 className="text-sm font-['Montserrat',sans-serif] font-bold text-white uppercase tracking-wider">
              Get In Touch
            </h4>
            <ul className="space-y-3.5 text-xs text-neutral-400">
              <li className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="leading-snug text-neutral-300">
                  {settings.address || 'Nilofar complex, main road, cloth market, Bhainsa, telangana, 504103'}
                </span>
              </li>
              <li className="flex items-start space-x-2.5">
                <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="leading-snug font-medium text-neutral-300">
                  {settings.workingHours || 'Monday - Saturday / 10:00 AM - 08:00 PM IST'}
                </span>
              </li>
              <li className="flex items-center space-x-2.5 pt-1">
                <Mail className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <a
                  href={`mailto:${settings.email || 'anfa.store01@gmail.com'}`}
                  className="hover:text-white transition font-medium text-neutral-200"
                >
                  {settings.email || 'anfa.store01@gmail.com'}
                </a>
              </li>
              <li className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <a
                  href={`tel:${(settings.phone || '960334954').replace(/[^0-9+]/g, '')}`}
                  className="hover:text-white transition font-mono font-medium text-neutral-200"
                >
                  {settings.phone || '960334954'}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright */}
        <div className="pt-8 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>
            Copyright © {settings.copyrightYear || 2026} {settings.storeName || 'Anfa Print Wear'}. All rights reserved.
          </p>

          <p className="text-[11px] text-neutral-400">
            Nilofar complex, main road, cloth market, Bhainsa, Telangana, 504103, India.
          </p>
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
