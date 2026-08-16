import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Cloud,
  Webhook,
  Package,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Edit3,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  Send,
  Truck,
  FileImage,
  ShieldCheck,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { Product, QikinkFulfillmentOrder, CustomDesignUpload, StoreSettings } from '../types/store';
import {
  getBackendProducts,
  updateProductDetails,
  simulateQikinkProductPush,
  fetchAllOrders,
  fetchWebhookLogs,
} from '../lib/qikinkApi';
import { SUPABASE_PROJECT_ID, SUPABASE_URL, CUSTOM_DESIGNS_BUCKET } from '../lib/supabase';

interface QikinkManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  onRefreshCatalog: () => void;
}

export const QikinkManagerModal: React.FC<QikinkManagerModalProps> = ({
  isOpen,
  onClose,
  settings,
  onRefreshCatalog,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'webhook' | 'storage'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<QikinkFulfillmentOrder[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Product Modal / Drawer state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    price: 0,
    originalPrice: 0,
    category: '',
    description: '',
    badge: '',
    tags: '',
    isLive: false,
  });

  // Simulator Form State
  const [simForm, setSimForm] = useState({
    title: 'Qikink Vintage Acid Wash Oversized Tee',
    category: 'winter-special',
    basePrice: 649,
    retailPrice: 1199,
    mockupUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    printArea: 'chest' as 'chest' | 'back' | 'pocket',
  });
  const [isSimulating, setIsSimulating] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, ords, lg] = await Promise.all([
        getBackendProducts(true),
        fetchAllOrders(),
        fetchWebhookLogs(),
      ]);
      setProducts(prods);
      setOrders(ords);
      setLogs(lg);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const webhookEndpointUrl = `${window.location.origin}/api/webhooks/qikink`;

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookEndpointUrl);
    setCopiedUrl(true);
    showToast('Qikink Webhook URL copied to clipboard!');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleStartEdit = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice || Math.round(product.price * 1.4),
      category: product.category,
      description: product.description,
      badge: product.badge || '',
      tags: (product.tags || []).join(', '),
      isLive: product.isLive ?? true,
    });
  };

  const handleSaveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const tagsArray = editForm.tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const result = await updateProductDetails(editingProduct.id, {
      name: editForm.name,
      price: Number(editForm.price),
      originalPrice: Number(editForm.originalPrice),
      category: editForm.category,
      description: editForm.description,
      badge: editForm.badge || undefined,
      tags: tagsArray,
      isLive: editForm.isLive,
    });

    if (result.success) {
      showToast(
        `Product "${editForm.name}" updated successfully! Status: ${
          editForm.isLive ? 'LIVE on Website' : 'Draft'
        }`
      );
      setEditingProduct(null);
      await loadData();
      onRefreshCatalog();
    } else {
      showToast(`Error updating product: ${result.error}`);
    }
  };

  const handleToggleLive = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = !product.isLive;
    const result = await updateProductDetails(product.id, { isLive: newStatus });
    if (result.success) {
      showToast(
        `Product "${product.name}" is now ${newStatus ? 'LIVE ON STOREFRONT' : 'DRAFT (HIDDEN)'}`
      );
      await loadData();
      onRefreshCatalog();
    }
  };

  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    const result = await simulateQikinkProductPush(simForm);
    setIsSimulating(false);

    if (result.success) {
      showToast(`Simulated Qikink product pushed! Inserted as Draft in Supabase database.`);
      await loadData();
      setActiveTab('products');
    } else {
      showToast(`Simulation error: ${result.error}`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 md:p-6 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-5xl w-full overflow-hidden shadow-2xl relative my-auto border border-neutral-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-4 right-4 z-50 bg-neutral-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center space-x-2 border border-amber-400/40 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="px-5 py-4 bg-neutral-950 text-white flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-black flex items-center justify-center font-bold shadow-md">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-['Oswald'] font-bold text-lg sm:text-xl tracking-wider uppercase text-white">
                  SUPABASE & QIKINK <span className="text-amber-400">STORE MANAGER</span>
                </h2>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
                  CONNECTED: {SUPABASE_PROJECT_ID}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Webhook Receiver, Product Staging, Qikink POD Auto-Fulfillment & Transparent PNG Storage
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 px-4 sm:px-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 px-4 font-['Oswald'] text-xs uppercase tracking-wider font-bold transition flex items-center space-x-2 border-b-2 whitespace-nowrap ${
              activeTab === 'products'
                ? 'border-amber-500 text-neutral-900 bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Package className="w-4 h-4 text-amber-500" />
            <span>Product Catalog & Staging ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-4 font-['Oswald'] text-xs uppercase tracking-wider font-bold transition flex items-center space-x-2 border-b-2 whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-amber-500 text-neutral-900 bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Truck className="w-4 h-4 text-amber-500" />
            <span>Qikink Fulfillment Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('webhook')}
            className={`py-3 px-4 font-['Oswald'] text-xs uppercase tracking-wider font-bold transition flex items-center space-x-2 border-b-2 whitespace-nowrap ${
              activeTab === 'webhook'
                ? 'border-amber-500 text-neutral-900 bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Webhook className="w-4 h-4 text-amber-500" />
            <span>Webhook Endpoint & Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('storage')}
            className={`py-3 px-4 font-['Oswald'] text-xs uppercase tracking-wider font-bold transition flex items-center space-x-2 border-b-2 whitespace-nowrap ${
              activeTab === 'storage'
                ? 'border-amber-500 text-neutral-900 bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <FileImage className="w-4 h-4 text-amber-500" />
            <span>PNG Storage Bucket ({CUSTOM_DESIGNS_BUCKET})</span>
          </button>
        </div>

        {/* Tab Body Contents */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-100/60">
          {/* ================= TAB 1: PRODUCT CATALOG & ENHANCEMENT ================= */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
                <div>
                  <h3 className="font-['Oswald'] font-bold text-base uppercase text-neutral-900">
                    Product Staging & Live Status Manager
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Products pushed from Qikink are inserted as <strong>Draft</strong>. Enhance details and toggle <strong>Mark Live</strong> to display them on the storefront.
                  </p>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    ● {products.filter((p) => p.isLive).length} Live on Website
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold border border-amber-200">
                    ● {products.filter((p) => !p.isLive).length} Staged Drafts
                  </span>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-neutral-200 space-y-3">
                  <Package className="w-10 h-10 text-neutral-400 mx-auto" />
                  <h4 className="font-['Oswald'] font-bold text-lg text-neutral-900 uppercase">
                    No Products in Staging
                  </h4>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto">
                    Push your first product from Qikink via the Webhook endpoint or use the simulator in the next tab to test.
                  </p>
                  <button
                    onClick={() => setActiveTab('webhook')}
                    className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                  >
                    Go to Webhook Simulator
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {products.map((prod) => (
                    <div
                      key={prod.id}
                      className={`bg-white rounded-xl p-4 border transition flex flex-col justify-between ${
                        prod.isLive
                          ? 'border-emerald-300 shadow-sm'
                          : 'border-amber-300 bg-amber-50/20'
                      }`}
                    >
                      <div>
                        {/* Top Badge & Live Switch */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono text-[10px] font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded">
                              {prod.sku || `SKU-${prod.id.slice(0, 8)}`}
                            </span>
                            {prod.qikinkProductId && (
                              <span className="text-[9px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                                QIKINK ID: {prod.qikinkProductId}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={(e) => handleToggleLive(prod, e)}
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition ${
                              prod.isLive
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-700'
                            }`}
                            title="Toggle Live on Storefront"
                          >
                            {prod.isLive ? (
                              <>
                                <Eye className="w-3 h-3" />
                                <span>LIVE ON SITE</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3" />
                                <span>DRAFT (STAGED)</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Title & Info */}
                        <div className="flex space-x-3">
                          <div className="w-16 h-16 rounded-lg bg-neutral-100 border border-neutral-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                            {prod.image ? (
                              <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-6 h-6 text-neutral-400" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs text-neutral-900 truncate">
                              {prod.name}
                            </h4>
                            <p className="text-[11px] text-neutral-500 line-clamp-2 mt-0.5">
                              {prod.description}
                            </p>
                            <div className="flex items-center space-x-2 mt-1.5">
                              <span className="font-['Oswald'] font-bold text-sm text-neutral-900">
                                {settings.currencySymbol || '₹'}
                                {prod.price}
                              </span>
                              {prod.originalPrice && (
                                <span className="text-[11px] text-neutral-400 line-through">
                                  {settings.currencySymbol || '₹'}
                                  {prod.originalPrice}
                                </span>
                              )}
                              <span className="text-[10px] font-semibold uppercase bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded">
                                {prod.category}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Action: Enhance / Edit */}
                      <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between">
                        <div className="flex items-center space-x-1 overflow-hidden">
                          {(prod.tags || []).slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="text-[9px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded truncate">
                              #{tag}
                            </span>
                          ))}
                        </div>

                        <button
                          onClick={() => handleStartEdit(prod)}
                          className="px-3 py-1.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center space-x-1.5 transition"
                        >
                          <Edit3 className="w-3 h-3 text-amber-400" />
                          <span>Enhance Product</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 2: QIKINK FULFILLMENT ORDERS ================= */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-['Oswald'] font-bold text-base uppercase text-neutral-900">
                    Automated Qikink Order Dispatch Queue
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Every order placed on the website is automatically formatted and sent to Qikink POD manufacturing facilities.
                  </p>
                </div>
                <div className="text-xs font-mono bg-neutral-100 px-3 py-1.5 rounded-lg text-neutral-700">
                  Total Orders: <strong>{orders.length}</strong>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-neutral-200 space-y-3">
                  <Truck className="w-10 h-10 text-neutral-400 mx-auto" />
                  <h4 className="font-['Oswald'] font-bold text-lg text-neutral-900 uppercase">
                    No Orders in Fulfillment Queue
                  </h4>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto">
                    When customers checkout or design custom t-shirts in the POD studio, their orders are automatically dispatched to Qikink.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((ord) => (
                    <div key={ord.id} className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-100 pb-2.5 gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-['Oswald'] font-bold text-sm text-neutral-900">
                              Order #{ord.orderNumber}
                            </span>
                            <span className="text-[10px] font-mono bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold">
                              Qikink Ref: {ord.qikinkOrderId || 'QIK-PENDING'}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-500">
                            Customer: <strong>{ord.customerName}</strong> ({ord.customerEmail} • {ord.customerPhone})
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{ord.qikinkStatus.replace(/_/g, ' ')}</span>
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-neutral-50 p-3 rounded-lg">
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-neutral-900">{it.name}</span>
                              <span className="text-neutral-500 ml-1.5 font-mono text-[11px]">
                                ({it.size} / {it.color} × {it.quantity})
                              </span>
                            </div>
                            <span className="font-bold text-amber-700">
                              {settings.currencySymbol || '₹'}{it.price}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Shipping & Tracking */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-neutral-600 pt-1 gap-2">
                        <div>
                          <span>Shipping to: </span>
                          <strong className="text-neutral-800">
                            {ord.shippingAddress.street}, {ord.shippingAddress.city}, {ord.shippingAddress.state} - {ord.shippingAddress.pincode}
                          </strong>
                        </div>

                        {ord.trackingNumber && (
                          <div className="flex items-center space-x-1 font-mono text-[11px] bg-neutral-100 px-2 py-1 rounded text-neutral-800">
                            <span>Courier: {ord.courierName || 'Delhivery'} | Track:</span>
                            <strong className="text-amber-700">{ord.trackingNumber}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 3: WEBHOOK ENDPOINT & SIMULATOR ================= */}
          {activeTab === 'webhook' && (
            <div className="space-y-6">
              {/* Webhook URL Endpoint Box */}
              <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Webhook className="w-5 h-5 text-amber-600" />
                    <h3 className="font-['Oswald'] font-bold text-base uppercase text-neutral-900">
                      Qikink Inbound Webhook Endpoint
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                    HTTP POST Active
                  </span>
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed">
                  Enter this Webhook URL into your <strong>Qikink Developer / Integration Settings</strong>. When you push products from Qikink, our backend parses the details, saves them in Supabase as drafts for review, and enables instant publishing.
                </p>

                <div className="flex items-center space-x-2 bg-neutral-900 text-amber-400 p-3 rounded-xl font-mono text-xs overflow-x-auto">
                  <span className="text-neutral-400 uppercase select-none font-bold">POST</span>
                  <span className="flex-1 select-all">{webhookEndpointUrl}</span>
                  <button
                    onClick={handleCopyWebhookUrl}
                    className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition"
                    title="Copy Webhook URL"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Push Simulator */}
              <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm space-y-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h3 className="font-['Oswald'] font-bold text-base uppercase text-neutral-900">
                    Simulate Inbound Qikink Product Push
                  </h3>
                </div>
                <p className="text-xs text-neutral-600">
                  Test the complete webhook workflow by simulating a product push directly from Qikink into your Supabase database.
                </p>

                <form onSubmit={handleSimulateWebhook} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="sm:col-span-2">
                    <label className="font-bold text-neutral-700 block mb-1">Product Title</label>
                    <input
                      type="text"
                      value={simForm.title}
                      onChange={(e) => setSimForm({ ...simForm, title: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg p-2 text-xs focus:outline-none focus:border-neutral-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">Category</label>
                    <select
                      value={simForm.category}
                      onChange={(e) => setSimForm({ ...simForm, category: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg p-2 text-xs focus:outline-none focus:border-neutral-900"
                    >
                      <option value="winter-special">Winter Special</option>
                      <option value="summer-special">Summer Special</option>
                      <option value="traveling">Traveling</option>
                      <option value="dog-lovers">Dog Lovers</option>
                      <option value="valentines">Valentine's Day</option>
                      <option value="new-arrival">New Arrival</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">Print Location Area</label>
                    <select
                      value={simForm.printArea}
                      onChange={(e) => setSimForm({ ...simForm, printArea: e.target.value as any })}
                      className="w-full border border-neutral-300 rounded-lg p-2 text-xs focus:outline-none focus:border-neutral-900"
                    >
                      <option value="chest">Front Chest (10×12 in)</option>
                      <option value="pocket">Pocket Size (4×4 in)</option>
                      <option value="back">Full Back (12×16 in)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">Base Price (INR ₹)</label>
                    <input
                      type="number"
                      value={simForm.basePrice}
                      onChange={(e) => setSimForm({ ...simForm, basePrice: parseFloat(e.target.value) })}
                      className="w-full border border-neutral-300 rounded-lg p-2 text-xs focus:outline-none focus:border-neutral-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">Suggested Retail Price (INR ₹)</label>
                    <input
                      type="number"
                      value={simForm.retailPrice}
                      onChange={(e) => setSimForm({ ...simForm, retailPrice: parseFloat(e.target.value) })}
                      className="w-full border border-neutral-300 rounded-lg p-2 text-xs focus:outline-none focus:border-neutral-900"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={isSimulating}
                      className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-black font-['Oswald'] font-bold text-xs tracking-wider uppercase rounded-xl flex items-center justify-center space-x-2 transition shadow-md active:scale-95 disabled:opacity-50"
                    >
                      {isSimulating ? (
                        <span>DISPATCHING WEBHOOK...</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>TRIGGER QIKINK PRODUCT PUSH TO SUPABASE</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Webhook Activity Logs */}
              <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm space-y-3">
                <h4 className="font-['Oswald'] font-bold text-sm uppercase text-neutral-900">
                  Recent Inbound Webhook Event Logs ({logs.length})
                </h4>
                {logs.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic">No webhook requests logged yet.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-[11px]">
                    {logs.map((log) => (
                      <div key={log.id} className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-neutral-800">[{log.event}]</span>
                          <span className="text-neutral-500 ml-2">{log.timestamp}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {log.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 4: HIGH-RES PNG STORAGE BUCKET ================= */}
          {activeTab === 'storage' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileImage className="w-5 h-5 text-amber-600" />
                    <h3 className="font-['Oswald'] font-bold text-base uppercase text-neutral-900">
                      Supabase Storage Bucket: <span className="text-amber-600 font-mono font-bold">{CUSTOM_DESIGNS_BUCKET}</span>
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    PNG Validation Enforced
                  </span>
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed">
                  Configured specifically for <strong>High-Resolution Transparent PNG Artwork</strong>. When customers upload designs in the Custom POD Studio, our system analyzes alpha transparency, resolution/DPI, and links the asset to the authenticated customer account for direct DTG manufacturing.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                  <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 mb-1" />
                    <strong className="block text-neutral-900">Format Rule</strong>
                    <span className="text-[11px] text-neutral-500">Strictly `.png` (MIME image/png)</span>
                  </div>

                  <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                    <Sparkles className="w-4 h-4 text-amber-500 mb-1" />
                    <strong className="block text-neutral-900">Alpha Transparency</strong>
                    <span className="text-[11px] text-neutral-500">Verified pixel alpha channels</span>
                  </div>

                  <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                    <Database className="w-4 h-4 text-blue-600 mb-1" />
                    <strong className="block text-neutral-900">Customer Link</strong>
                    <span className="text-[11px] text-neutral-500">Saved under `customers/:id/`</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-neutral-900 text-white flex items-center justify-between border-t border-neutral-800 text-xs">
          <div className="flex items-center space-x-2 text-neutral-400">
            <span>Store: <strong>ANFA PRINT WEAR</strong></span>
            <span>•</span>
            <span>Telangana, India</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-400 hover:bg-amber-500 text-black font-bold text-xs uppercase tracking-wider rounded-lg transition"
          >
            Close Manager
          </button>
        </div>

        {/* ================= EDIT / ENHANCE PRODUCT DIALOG ================= */}
        {editingProduct && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-neutral-200 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-amber-600 tracking-wider">
                    Manual Product Enhancement
                  </span>
                  <h3 className="font-['Oswald'] font-bold text-xl uppercase text-neutral-900">
                    Edit Product Details
                  </h3>
                </div>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="p-1.5 text-neutral-400 hover:text-black rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProductEdit} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full border border-neutral-300 rounded-lg p-2.5 text-xs focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">Selling Price (₹) *</label>
                    <input
                      type="number"
                      required
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                      className="w-full border border-neutral-300 rounded-lg p-2.5 text-xs focus:outline-none focus:border-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">Original MRP Price (₹)</label>
                    <input
                      type="number"
                      value={editForm.originalPrice}
                      onChange={(e) => setEditForm({ ...editForm, originalPrice: parseFloat(e.target.value) })}
                      className="w-full border border-neutral-300 rounded-lg p-2.5 text-xs focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">Category</label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg p-2.5 text-xs focus:outline-none focus:border-neutral-900"
                    >
                      <option value="winter-special">Winter Special</option>
                      <option value="summer-special">Summer Special</option>
                      <option value="traveling">Traveling</option>
                      <option value="dog-lovers">Dog Lovers</option>
                      <option value="valentines">Valentine's Day</option>
                      <option value="new-arrival">New Arrival</option>
                      <option value="bestseller">Best Seller</option>
                      <option value="featured">Featured</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">Badge (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. BEST SELLER, NEW"
                      value={editForm.badge}
                      onChange={(e) => setEditForm({ ...editForm, badge: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg p-2.5 text-xs focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full border border-neutral-300 rounded-lg p-2.5 text-xs focus:outline-none focus:border-neutral-900 resize-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Search & Filter Tags (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="qikink, oversized, dtg-print, winter"
                    value={editForm.tags}
                    onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                    className="w-full border border-neutral-300 rounded-lg p-2.5 text-xs focus:outline-none focus:border-neutral-900"
                  />
                </div>

                {/* Live Status Toggle in Edit Form */}
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-neutral-900 block">Display Product on Website (Live)</span>
                    <span className="text-[10px] text-neutral-500">
                      When enabled, this product is published to the live store and searchable.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editForm.isLive}
                    onChange={(e) => setEditForm({ ...editForm, isLive: e.target.checked })}
                    className="w-5 h-5 accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="flex-1 py-2.5 border border-neutral-300 rounded-xl font-bold uppercase text-neutral-700 hover:bg-neutral-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-neutral-900 hover:bg-black text-white font-bold uppercase text-xs rounded-xl flex items-center justify-center space-x-1.5 transition"
                  >
                    <Save className="w-4 h-4 text-amber-400" />
                    <span>Save & Update Database</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
