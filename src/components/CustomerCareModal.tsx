import React, { useState } from 'react';
import {
  X,
  HelpCircle,
  FileText,
  RotateCcw,
  BookOpen,
  Mail,
  Send,
  CheckCircle2,
  Phone,
  MapPin,
  Clock,
  Shirt,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Truck,
  AlertCircle
} from 'lucide-react';
import { StoreSettings } from '../types/store';

export type CustomerCareTab = 'help' | 'terms' | 'refund' | 'faqs' | 'contact';

interface CustomerCareModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: CustomerCareTab;
  settings: StoreSettings;
}

export const CustomerCareModal: React.FC<CustomerCareModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'help',
  settings,
}) => {
  const [activeTab, setActiveTab] = useState<CustomerCareTab>(initialTab);
  
  // Update activeTab when initialTab changes on open
  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    orderId: '',
    inquiryType: 'Order Status & Tracking',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{ id: string; email: string } | null>(null);

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  if (!isOpen) return null;

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedTicket({
        id: `ANFA-${Math.floor(100000 + Math.random() * 900000)}`,
        email: contactForm.email,
      });
      setContactForm({
        fullName: '',
        email: '',
        phone: '',
        orderId: '',
        inquiryType: 'Order Status & Tracking',
        subject: '',
        message: '',
      });
    }, 1000);
  };

  const faqs = [
    {
      q: 'How does print-on-demand fulfillment work at Anfa Print Wear?',
      a: 'Every item is individually printed to order using our state-of-the-art Japanese DTG (Direct-to-Garment) pigment printers. Once you place an order, our production facility prints, cures, quality-inspects, and packages your t-shirt within 24 to 48 hours before handing it off for express dispatch.',
    },
    {
      q: 'What are the exact washing and care instructions for DTG graphic tees?',
      a: 'To maintain vibrant graphic colors and prevent fabric shrinkage: Machine wash cold (30°C / 85°F) inside out with similar colors. Use gentle eco-friendly detergents. Do not use bleach or fabric softeners. Tumble dry on low heat or line dry in the shade. Never iron directly over printed graphics—iron inside-out on low heat.',
    },
    {
      q: 'How long does standard delivery take, and is shipping free?',
      a: `Standard domestic delivery typically arrives within 3–5 business days after production. International shipping takes 6–10 business days. We offer Free Worldwide Delivery on all qualifying orders over ${settings.currencySymbol}${settings.freeDeliveryThreshold}.`,
    },
    {
      q: 'Can I upload custom graphics or logos for bulk team orders?',
      a: 'Yes! You can use our interactive POD Studio to design single shirts, or contact our wholesale specialist team via the Contact Us form for bulk orders with tiered volume discounts.',
    },
    {
      q: 'What should I do if my t-shirt arrived damaged or with a printing defect?',
      a: 'We offer a 100% Authenticity and Satisfaction Guarantee. If your order arrives with any manufacturing or printing defect, simply send us a photo through our Contact Us form, and we will immediately issue a free replacement reprint or a full 100% refund without requiring you to ship the defective item back.',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl relative my-auto border border-neutral-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-neutral-950 text-white flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-black flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-['Oswald'] font-bold text-lg sm:text-xl tracking-wider uppercase text-white">
                ANFA PRINT WEAR <span className="text-amber-400">CUSTOMER CARE</span>
              </h2>
              <p className="text-[11px] text-neutral-400 font-sans">
                Help, policies, print care guides, and direct support.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition active:scale-95"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="bg-neutral-100/80 border-b border-neutral-200 px-4 sm:px-6 flex items-center space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar">
          <button
            id="care-tab-help"
            onClick={() => {
              setActiveTab('help');
              setSubmittedTicket(null);
            }}
            className={`flex items-center space-x-1.5 py-3 px-3 sm:px-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition ${
              activeTab === 'help'
                ? 'border-amber-500 text-neutral-900 bg-white shadow-sm rounded-t-lg'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Help & Advice</span>
          </button>

          <button
            id="care-tab-terms"
            onClick={() => {
              setActiveTab('terms');
              setSubmittedTicket(null);
            }}
            className={`flex items-center space-x-1.5 py-3 px-3 sm:px-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition ${
              activeTab === 'terms'
                ? 'border-amber-500 text-neutral-900 bg-white shadow-sm rounded-t-lg'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms & Conditions</span>
          </button>

          <button
            id="care-tab-refund"
            onClick={() => {
              setActiveTab('refund');
              setSubmittedTicket(null);
            }}
            className={`flex items-center space-x-1.5 py-3 px-3 sm:px-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition ${
              activeTab === 'refund'
                ? 'border-amber-500 text-neutral-900 bg-white shadow-sm rounded-t-lg'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refund Policy</span>
          </button>

          <button
            id="care-tab-faqs"
            onClick={() => {
              setActiveTab('faqs');
              setSubmittedTicket(null);
            }}
            className={`flex items-center space-x-1.5 py-3 px-3 sm:px-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition ${
              activeTab === 'faqs'
                ? 'border-amber-500 text-neutral-900 bg-white shadow-sm rounded-t-lg'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>FAQs & Care Guide</span>
          </button>

          <button
            id="care-tab-contact"
            onClick={() => {
              setActiveTab('contact');
              setSubmittedTicket(null);
            }}
            className={`flex items-center space-x-1.5 py-3 px-3 sm:px-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition ${
              activeTab === 'contact'
                ? 'border-amber-500 text-neutral-900 bg-white shadow-sm rounded-t-lg text-amber-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Contact Us</span>
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 text-neutral-800 text-xs sm:text-sm leading-relaxed space-y-6">
          {/* ================= 1. HELP & ADVICE ================= */}
          {activeTab === 'help' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-neutral-200 pb-4">
                <h3 className="text-lg sm:text-xl font-bold font-['Oswald'] uppercase tracking-wider text-neutral-900">
                  Help & Sizing Advice Guide
                </h3>
                <p className="text-neutral-500 text-xs mt-1">
                  Everything you need to select the perfect garment size, understand our print methods, and track orders.
                </p>
              </div>

              {/* Sizing Chart Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-neutral-900 flex items-center space-x-2">
                    <Shirt className="w-4 h-4 text-amber-500" />
                    <span>Unisex Standard Fit Measurements</span>
                  </h4>
                  <span className="text-[11px] text-neutral-400">All measurements in Inches (Chest × Length)</span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-neutral-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-neutral-100 text-neutral-700 font-bold uppercase text-[10px] tracking-wider border-b border-neutral-200">
                        <th className="p-3">Size</th>
                        <th className="p-3">Chest Width (in)</th>
                        <th className="p-3">Body Length (in)</th>
                        <th className="p-3">Sleeve Length (in)</th>
                        <th className="p-3">Recommended Fit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 text-neutral-600">
                      <tr>
                        <td className="p-3 font-bold text-neutral-900">S (Small)</td>
                        <td className="p-3">36&quot; – 38&quot;</td>
                        <td className="p-3">28.0&quot;</td>
                        <td className="p-3">8.2&quot;</td>
                        <td className="p-3">Fitted / Slim</td>
                      </tr>
                      <tr className="bg-neutral-50/50">
                        <td className="p-3 font-bold text-neutral-900">M (Medium)</td>
                        <td className="p-3">40&quot; – 42&quot;</td>
                        <td className="p-3">29.0&quot;</td>
                        <td className="p-3">8.5&quot;</td>
                        <td className="p-3">Regular True to Size</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-neutral-900">L (Large)</td>
                        <td className="p-3">44&quot; – 46&quot;</td>
                        <td className="p-3">30.0&quot;</td>
                        <td className="p-3">9.0&quot;</td>
                        <td className="p-3">Relaxed Streetwear</td>
                      </tr>
                      <tr className="bg-neutral-50/50">
                        <td className="p-3 font-bold text-neutral-900">XL (X-Large)</td>
                        <td className="p-3">48&quot; – 50&quot;</td>
                        <td className="p-3">31.0&quot;</td>
                        <td className="p-3">9.5&quot;</td>
                        <td className="p-3">Oversized Silhouette</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-neutral-900">2XL (2X-Large)</td>
                        <td className="p-3">52&quot; – 54&quot;</td>
                        <td className="p-3">32.0&quot;</td>
                        <td className="p-3">10.0&quot;</td>
                        <td className="p-3">Heavy Boxy Fit</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3 Pillars of Quality */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold mb-2">
                    1
                  </div>
                  <h5 className="font-bold text-neutral-900 text-xs uppercase tracking-wider">Premium 240 GSM Fabric</h5>
                  <p className="text-xs text-neutral-500 mt-1">
                    Combed ring-spun organic cotton tailored with tight knits for smooth digital ink reception and no pilling.
                  </p>
                </div>

                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold mb-2">
                    2
                  </div>
                  <h5 className="font-bold text-neutral-900 text-xs uppercase tracking-wider">Water-Based Pigment Inks</h5>
                  <p className="text-xs text-neutral-500 mt-1">
                    OEKO-TEX® certified Japanese DTG pigments that bind directly with the cotton fibers rather than sitting on top.
                  </p>
                </div>

                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold mb-2">
                    3
                  </div>
                  <h5 className="font-bold text-neutral-900 text-xs uppercase tracking-wider">Fast Automated Tracking</h5>
                  <p className="text-xs text-neutral-500 mt-1">
                    Instant tracking numbers sent straight to your email as soon as your garment clears final heat-cure inspection.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= 2. TERMS & CONDITIONS ================= */}
          {activeTab === 'terms' && (
            <div className="space-y-5 animate-fade-in text-neutral-700">
              <div className="border-b border-neutral-200 pb-4">
                <h3 className="text-lg sm:text-xl font-bold font-['Oswald'] uppercase tracking-wider text-neutral-900">
                  Standard Terms and Conditions of Sale
                </h3>
                <p className="text-neutral-500 text-xs mt-1">
                  Effective Date: January 1, 2026. Please read these terms carefully before placing your order with Anfa Print Wear.
                </p>
              </div>

              <div className="space-y-4 text-xs leading-relaxed">
                <div>
                  <h4 className="font-bold text-neutral-900 text-sm mb-1">1. Scope & Acceptance</h4>
                  <p>
                    These General Terms and Conditions govern all sales and orders made via the Anfa Print Wear online storefront. By placing an order, submitting custom graphic assets, or making payment, the customer unconditionally accepts these Terms.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-neutral-900 text-sm mb-1">2. Print-on-Demand Production & Fulfillment</h4>
                  <p>
                    All apparel products sold on Anfa Print Wear are customized and printed on-demand specifically for each customer. Minor color tolerances (RGB screen to CMYK fabric print reproduction) are standard in digital textile printing.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-neutral-900 text-sm mb-1">3. Intellectual Property & User Content</h4>
                  <p>
                    Customers uploading custom logos, text, or artwork through our POD Studio represent and warrant that they possess all lawful licenses, copyright, and trademark permissions for said content. Anfa Print Wear reserves the right to reject profane or infringing material.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-neutral-900 text-sm mb-1">4. Pricing, Taxes & Payment</h4>
                  <p>
                    All prices are shown in {settings.currency} ({settings.currencySymbol}) and include standard manufacturing. Delivery fees are calculated dynamically at checkout and are free for orders exceeding {settings.currencySymbol}{settings.freeDeliveryThreshold}.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-neutral-900 text-sm mb-1">5. Limitation of Liability & Governing Law</h4>
                  <p>
                    Anfa Print Wear is not liable for incidental or consequential damages resulting from delayed transit beyond reasonable carrier estimates. These terms are governed in accordance with international consumer e-commerce standards.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= 3. REFUND POLICY ================= */}
          {activeTab === 'refund' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-neutral-200 pb-4">
                <h3 className="text-lg sm:text-xl font-bold font-['Oswald'] uppercase tracking-wider text-neutral-900">
                  Standard 30-Day Return & Replacement Policy
                </h3>
                <p className="text-neutral-500 text-xs mt-1">
                  Our commitment to craftsmanship: We stand behind every print and fabric stitch 100%.
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 leading-relaxed">
                  <span className="font-bold">100% Quality & Print Guarantee:</span> If your shirt arrives with a defect, wrong color, incorrect size, or graphic misprint, we will immediately send a brand-new replacement reprint or issue a full refund at zero additional cost to you.
                </div>
              </div>

              <div className="space-y-4 text-xs text-neutral-700 leading-relaxed">
                <div>
                  <h4 className="font-bold text-neutral-900 text-sm mb-1">1. How to Initiate a Return or Reprint Claim</h4>
                  <p>
                    To submit a claim within 30 days of parcel delivery:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 mt-1 pl-2 text-neutral-600">
                    <li>Go to the <strong>Contact Us</strong> tab or email <strong>{settings.email}</strong>.</li>
                    <li>Provide your <strong>Order ID Number</strong> and attach a clear photo of the garment issue.</li>
                    <li>Our quality assurance team reviews and approves requests within 24 hours.</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-bold text-neutral-900 text-sm mb-1">2. Refund Processing Timelines</h4>
                  <p>
                    Approved refunds are credited directly back to your original payment method (Credit Card, PayPal, Visa) within 3 to 5 business days.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-neutral-900 text-sm mb-1">3. Non-Returnable Scenarios</h4>
                  <p>
                    Because each item is printed on demand, customized shirts with personal names or photos cannot be returned for buyer remorse or customer ordering errors (e.g. wrong size chosen by mistake without consulting sizing guide). However, if our team printed the wrong size, it will be replaced immediately!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= 4. FAQS & CARE GUIDES ================= */}
          {activeTab === 'faqs' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-neutral-200 pb-4">
                <h3 className="text-lg sm:text-xl font-bold font-['Oswald'] uppercase tracking-wider text-neutral-900">
                  FAQs & DTG E-Gift Care Guides
                </h3>
                <p className="text-neutral-500 text-xs mt-1">
                  Answers to frequent customer questions and essential garment longevity tips.
                </p>
              </div>

              {/* Garment Care Callout Card */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4">
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center space-x-1.5 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Garment Care & Longevity Rules</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-amber-950">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Machine wash cold (30°C) inside out</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Avoid chlorine bleaches & harsh softeners</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Tumble dry on gentle low heat or hang dry</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Never iron directly on printed graphics</span>
                  </div>
                </div>
              </div>

              {/* Expandable Accordion FAQ List */}
              <div className="space-y-2.5">
                {faqs.map((faq, idx) => {
                  const isOpen = expandedFaq === idx;
                  return (
                    <div
                      key={idx}
                      className="border border-neutral-200 rounded-xl overflow-hidden transition"
                    >
                      <button
                        onClick={() => setExpandedFaq(isOpen ? null : idx)}
                        className="w-full p-3.5 sm:p-4 text-left flex items-center justify-between font-semibold text-xs sm:text-sm text-neutral-900 hover:bg-neutral-50 transition"
                      >
                        <span className="pr-4">{faq.q}</span>
                        {isOpen ? (
                          <ChevronDown className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 text-xs text-neutral-600 leading-relaxed border-t border-neutral-100 bg-neutral-50/50">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= 5. CONTACT US PAGE & FORM ================= */}
          {activeTab === 'contact' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-neutral-200 pb-4">
                <h3 className="text-lg sm:text-xl font-bold font-['Oswald'] uppercase tracking-wider text-neutral-900">
                  Contact Anfa Print Wear
                </h3>
                <p className="text-neutral-500 text-xs mt-1">
                  Have a question about an order, custom graphic design, or wholesale inquiry? Fill out the form below.
                </p>
              </div>

              {submittedTicket ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-4 animate-scale-in">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold font-['Oswald'] text-emerald-950 uppercase tracking-wider">
                    Message Sent Successfully!
                  </h4>
                  <p className="text-xs sm:text-sm text-emerald-900 max-w-md mx-auto leading-relaxed">
                    Thank you for reaching out. We have created ticket{' '}
                    <span className="font-mono font-bold bg-emerald-200 px-2 py-0.5 rounded text-emerald-950">
                      {submittedTicket.id}
                    </span>
                    . A confirmation email and response will be sent to <strong>{submittedTicket.email}</strong> within 12 hours.
                  </p>
                  <button
                    onClick={() => setSubmittedTicket(null)}
                    className="mt-4 px-6 py-2.5 bg-neutral-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-xl transition active:scale-95"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Contact Info details */}
                  <div className="bg-neutral-900 text-white p-5 sm:p-6 rounded-2xl space-y-4">
                    <h4 className="font-['Oswald'] font-bold text-base uppercase tracking-wider text-amber-400">
                      Direct Support Info
                    </h4>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      Our customer experience team is available 6 days a week to support you.
                    </p>

                    <div className="space-y-3 pt-2 text-xs text-neutral-300">
                      <div className="flex items-start space-x-2.5">
                        <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <span>{settings.address}</span>
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <Phone className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <a href={`tel:${settings.phone.replace(/[^0-9+]/g, '')}`} className="hover:text-white font-mono">
                          {settings.phone}
                        </a>
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <Mail className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <a href={`mailto:${settings.email}`} className="hover:text-white">
                          {settings.email}
                        </a>
                      </div>
                      <div className="flex items-start space-x-2.5">
                        <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <span>{settings.workingHours}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-neutral-800 text-[11px] text-neutral-400">
                      ⚡ Average Response Time: <strong className="text-white">Under 2 Hours</strong>
                    </div>
                  </div>

                  {/* Right: Contact Form */}
                  <form onSubmit={handleContactSubmit} className="lg:col-span-2 space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          id="contact-fullname-input"
                          type="text"
                          required
                          value={contactForm.fullName}
                          onChange={(e) => setContactForm({ ...contactForm, fullName: e.target.value })}
                          placeholder="e.g. Alex Morgan"
                          className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-neutral-900 focus:bg-white transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                          Email Address *
                        </label>
                        <input
                          id="contact-email-input"
                          type="email"
                          required
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          placeholder="alex@example.com"
                          className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-neutral-900 focus:bg-white transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                          Inquiry Category
                        </label>
                        <select
                          id="contact-inquiry-select"
                          value={contactForm.inquiryType}
                          onChange={(e) => setContactForm({ ...contactForm, inquiryType: e.target.value })}
                          className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-neutral-900 focus:bg-white transition"
                        >
                          <option value="Order Status & Tracking">Order Status & Tracking</option>
                          <option value="Return / Replacement Request">Return / Replacement Request</option>
                          <option value="Custom POD Bulk Quote">Custom POD Bulk Quote</option>
                          <option value="Sizing & Garment Question">Sizing & Garment Question</option>
                          <option value="General Support">General Support</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                          Order ID (Optional)
                        </label>
                        <input
                          id="contact-orderid-input"
                          type="text"
                          value={contactForm.orderId}
                          onChange={(e) => setContactForm({ ...contactForm, orderId: e.target.value })}
                          placeholder="e.g. #ANFA-10928"
                          className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-neutral-900 focus:bg-white transition font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                        Subject *
                      </label>
                      <input
                        id="contact-subject-input"
                        type="text"
                        required
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                        placeholder="Brief summary of your question"
                        className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-neutral-900 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                        Detailed Message *
                      </label>
                      <textarea
                        id="contact-message-input"
                        required
                        rows={4}
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        placeholder="Please provide as much detail as possible so our support specialists can help right away..."
                        className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded-xl p-3 focus:outline-none focus:border-neutral-900 focus:bg-white transition resize-none"
                      />
                    </div>

                    <button
                      id="contact-submit-btn"
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-neutral-900 hover:bg-black text-white font-['Oswald'] font-bold text-xs tracking-wider uppercase rounded-xl flex items-center justify-center space-x-2 transition active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span>SENDING MESSAGE...</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4 text-amber-400" />
                          <span>SUBMIT CONTACT MESSAGE</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
