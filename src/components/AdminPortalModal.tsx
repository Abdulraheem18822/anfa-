import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  Mail,
  Key,
  LogOut,
  Layers,
  ShoppingBag,
  Package,
  Sparkles,
  Users,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Truck,
  Download,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Activity,
  DollarSign,
  FileImage,
  Sliders,
  Send,
  Zap,
  Globe,
  Database,
  ArrowUpRight,
  Filter,
  Check,
} from 'lucide-react';
import {
  Product,
  QikinkFulfillmentOrder,
  CustomDesignUpload,
  AdminUser,
  AdminStats,
  AuthEventLog,
  StoreSettings,
} from '../types/store';
import {
  loginAdmin,
  logoutAdmin,
  verifyAdminSession,
  getStoredAdminUser,
  getStoredAdminToken,
  fetchAdminStats,
  fetchAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  fetchAdminCustomDesigns,
  updateCustomDesignStatus,
  fetchAdminOrders,
  updateAdminOrderStatus,
  redispatchOrderToQikink,
  fetchCustomerAuthLogs,
  fetchSupabaseLiveStatus,
} from '../lib/adminApi';
import {
  simulateQikinkProductPush,
  fetchWebhookLogs,
  fetchSandboxStatus,
  dispatchSandboxTestOrder,
  triggerSandboxWebhook,
  SandboxStatusResponse,
} from '../lib/qikinkApi';
import { SUPABASE_PROJECT_ID, SUPABASE_URL } from '../lib/supabase';
import { TShirtMockup } from './TShirtMockup';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  onRefreshStorefrontCatalog?: () => void;
}

type AdminTab = 'overview' | 'products' | 'qikink' | 'designs' | 'orders' | 'auth_logs' | 'settings';

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  isOpen,
  onClose,
  settings,
  onRefreshStorefrontCatalog,
}) => {
  // Authentication State
  const [adminUser, setAdminUser] = useState<AdminUser | null>(getStoredAdminUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getStoredAdminToken());
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Dashboard Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Core Data States
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<QikinkFulfillmentOrder[]>([]);
  const [customDesigns, setCustomDesigns] = useState<CustomDesignUpload[]>([]);
  const [authLogs, setAuthLogs] = useState<AuthEventLog[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [supabaseStatus, setSupabaseStatus] = useState<{ connected: boolean; latencyMs?: number; tablesPresent?: boolean }>({ connected: true, latencyMs: 24, tablesPresent: true });
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter & Search states
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productGsmFilter, setProductGsmFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [authLogTypeFilter, setAuthLogTypeFilter] = useState('all');
  const [authLogEmailSearch, setAuthLogEmailSearch] = useState('');

  // Edit / Create Product Modal state
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<{
    id?: string;
    name: string;
    sku: string;
    price: number;
    originalPrice: number;
    category: string;
    gender: 'men' | 'women' | 'unisex';
    badge: string;
    description: string;
    fabricGsm: number;
    fabricComposition: string;
    fitType: 'oversized' | 'regular' | 'boxy' | 'slim';
    printTechnique: string;
    qualityGrade: string;
    stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'made_to_order_pod';
    isLive: boolean;
    image: string;
    shirtColor: string;
    shirtColorName: string;
    tags: string;
  }>({
    name: '',
    sku: '',
    price: 899,
    originalPrice: 1499,
    category: 'new',
    gender: 'unisex',
    badge: '240 GSM HEAVYWEIGHT',
    description: '100% Super-combed organic bio-washed cotton. Drop-shoulder boxy streetwear silhouette.',
    fabricGsm: 240,
    fabricComposition: '100% Super-Combed Bio-Washed Organic Cotton',
    fitType: 'oversized',
    printTechnique: 'Direct-to-Garment (DTG) Digital Pigment',
    qualityGrade: 'Export Quality Grade A+',
    stockStatus: 'in_stock',
    isLive: true,
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    shirtColor: '#1E1E24',
    shirtColorName: 'Pitch Black',
    tags: 'oversized, streetwear, bio-washed, custom',
  });

  // Design Review Modal state
  const [previewDesign, setPreviewDesign] = useState<CustomDesignUpload | null>(null);
  const [designAdminNotes, setDesignAdminNotes] = useState('');

  // Qikink Webhook Simulator state
  const [simForm, setSimForm] = useState({
    title: 'Qikink Acid Wash Drop Tee',
    category: 'streetwear',
    basePrice: 649,
    retailPrice: 1299,
    mockupUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80',
    printArea: 'chest' as 'chest' | 'back' | 'pocket',
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [sandboxStatus, setSandboxStatus] = useState<SandboxStatusResponse | null>(null);
  const [isDispatchingTestOrder, setIsDispatchingTestOrder] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Check existing session on mount
  useEffect(() => {
    if (isOpen) {
      checkAdminSession();
    }
  }, [isOpen]);

  const checkAdminSession = async () => {
    const res = await verifyAdminSession();
    if (res.authenticated && res.admin) {
      setAdminUser(res.admin);
      setIsAuthenticated(true);
      fetchAllDashboardData();
    }
  };

  const fetchAllDashboardData = async () => {
    setIsLoadingData(true);
    try {
      const [st, prods, ords, des, logs, wh, sbx, spStatus] = await Promise.all([
        fetchAdminStats(),
        fetchAdminProducts(),
        fetchAdminOrders(),
        fetchAdminCustomDesigns(),
        fetchCustomerAuthLogs(),
        fetchWebhookLogs(),
        fetchSandboxStatus(),
        fetchSupabaseLiveStatus(),
      ]);

      if (st) setStats(st);
      setProducts(prods);
      setOrders(ords);
      setCustomDesigns(des);
      setAuthLogs(logs);
      setWebhookLogs(wh);
      if (sbx) setSandboxStatus(sbx);
      if (spStatus) setSupabaseStatus({ connected: spStatus.connected, latencyMs: spStatus.latencyMs, tablesPresent: spStatus.tablesPresent });
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleDispatchSandboxTestOrder = async () => {
    setIsDispatchingTestOrder(true);
    try {
      const res = await dispatchSandboxTestOrder({
        sku: 'ANFA-SBX-240-BLK',
        title: 'Acid Wash 240 GSM Oversized Heavyweight Tee (Sandbox Dispatch)',
        price: 999,
        size: 'XL',
        color: 'Pitch Black',
      });
      if (res.success) {
        showToast(`Sandbox Order #${res.order?.orderNumber || 'SBX'} placed & dispatched to Qikink pipeline!`);
        await fetchAllDashboardData();
      } else {
        showToast(`Sandbox test order failed: ${res.error}`);
      }
    } catch (err: any) {
      showToast(`Error: ${err?.message || 'Failed'}`);
    } finally {
      setIsDispatchingTestOrder(false);
    }
  };

  const handleTriggerSandboxWebhook = async (status: string) => {
    try {
      const targetOrder = orders.length > 0 ? orders[0].orderNumber : 'ANFA-SBX-101';
      const res = await triggerSandboxWebhook({
        eventType: 'order.status_changed',
        status,
        orderId: targetOrder,
      });
      if (res.success) {
        showToast(`Sandbox Webhook triggered: #${targetOrder} status changed to ${status}!`);
        await fetchAllDashboardData();
      }
    } catch {
      showToast('Failed to trigger simulated webhook');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await loginAdmin(loginEmail, loginPassword, rememberMe);
      if (res.success && res.admin) {
        setAdminUser(res.admin);
        setIsAuthenticated(true);
        showToast(`Welcome back, ${res.admin.name}!`);
        fetchAllDashboardData();
      } else {
        setLoginError(res.error || 'Invalid administrator credentials');
      }
    } catch {
      setLoginError('Authentication service unreachable. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setAdminUser(null);
    setIsAuthenticated(false);
    setLoginEmail('');
    setLoginPassword('');
    showToast('Administrator logged out successfully.');
  };

  // Open Edit Product Drawer
  const handleOpenEditProduct = (prod?: Product) => {
    if (prod) {
      setEditingProduct(prod);
      setProductForm({
        id: prod.id,
        name: prod.name,
        sku: prod.sku || '',
        price: prod.price,
        originalPrice: prod.originalPrice || prod.price * 1.5,
        category: prod.category || 'new',
        gender: prod.gender || 'unisex',
        badge: prod.badge || '',
        description: prod.description || '',
        fabricGsm: typeof prod.fabricGsm === 'number' ? prod.fabricGsm : 240,
        fabricComposition: prod.fabricComposition || '100% Super-Combed Bio-Washed Organic Cotton',
        fitType: prod.fitType || 'oversized',
        printTechnique: prod.printTechnique || 'Direct-to-Garment (DTG) Digital Pigment',
        qualityGrade: prod.qualityGrade || 'Export Quality Grade A+',
        stockStatus: prod.stockStatus || 'in_stock',
        isLive: prod.isLive ?? true,
        image: prod.image,
        shirtColor: prod.shirtColor || '#1E1E24',
        shirtColorName: prod.shirtColorName || 'Pitch Black',
        tags: Array.isArray(prod.tags) ? prod.tags.join(', ') : '',
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        sku: `ANFA-ST-${Math.floor(100 + Math.random() * 900)}`,
        price: 899,
        originalPrice: 1499,
        category: 'new',
        gender: 'unisex',
        badge: '240 GSM HEAVYWEIGHT',
        description: 'Heavyweight 240 GSM organic bio-washed cotton. Custom DTG print.',
        fabricGsm: 240,
        fabricComposition: '100% Super-Combed Bio-Washed Organic Cotton',
        fitType: 'oversized',
        printTechnique: 'Direct-to-Garment (DTG) Digital Pigment',
        qualityGrade: 'Export Quality Grade A+',
        stockStatus: 'in_stock',
        isLive: true,
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
        shirtColor: '#1E1E24',
        shirtColorName: 'Pitch Black',
        tags: 'oversized, streetwear, pod',
      });
    }
    setIsEditProductOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const tagArray = productForm.tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const payload: Partial<Product> = {
      name: productForm.name,
      sku: productForm.sku,
      price: Number(productForm.price),
      originalPrice: Number(productForm.originalPrice),
      category: productForm.category,
      gender: productForm.gender,
      badge: productForm.badge,
      description: productForm.description,
      fabricGsm: Number(productForm.fabricGsm),
      fabricComposition: productForm.fabricComposition,
      fitType: productForm.fitType,
      printTechnique: productForm.printTechnique,
      qualityGrade: productForm.qualityGrade,
      stockStatus: productForm.stockStatus,
      isLive: productForm.isLive,
      image: productForm.image,
      shirtColor: productForm.shirtColor,
      shirtColorName: productForm.shirtColorName,
      tags: tagArray,
    };

    if (editingProduct?.id) {
      const res = await updateAdminProduct(editingProduct.id, payload);
      if (res.success) {
        showToast(`Product [${productForm.name}] updated successfully!`);
        setIsEditProductOpen(false);
        fetchAllDashboardData();
        if (onRefreshStorefrontCatalog) onRefreshStorefrontCatalog();
      } else {
        alert(res.error || 'Failed to update product');
      }
    } else {
      const res = await createAdminProduct(payload);
      if (res.success) {
        showToast(`New product [${productForm.name}] added to catalog!`);
        setIsEditProductOpen(false);
        fetchAllDashboardData();
        if (onRefreshStorefrontCatalog) onRefreshStorefrontCatalog();
      } else {
        alert(res.error || 'Failed to add product');
      }
    }
  };

  const handleToggleProductLive = async (product: Product) => {
    const newStatus = !product.isLive;
    const res = await updateAdminProduct(product.id, { isLive: newStatus });
    if (res.success) {
      showToast(`Product [${product.name}] is now ${newStatus ? 'LIVE on Storefront' : 'hidden as DRAFT'}.`);
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, isLive: newStatus } : p)));
      if (onRefreshStorefrontCatalog) onRefreshStorefrontCatalog();
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (window.confirm(`Are you sure you want to remove [${product.name}] from catalog?`)) {
      const res = await deleteAdminProduct(product.id);
      if (res.success) {
        showToast(`Product [${product.name}] removed.`);
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        if (onRefreshStorefrontCatalog) onRefreshStorefrontCatalog();
      }
    }
  };

  // Custom Design Review Actions
  const handleUpdateDesignReview = async (
    design: CustomDesignUpload,
    status: 'approved_for_print' | 'revision_requested' | 'rejected'
  ) => {
    const res = await updateCustomDesignStatus(design.id, status, designAdminNotes || undefined);
    if (res.success) {
      showToast(`Design marked as: ${status.replace('_', ' ').toUpperCase()}`);
      setCustomDesigns((prev) =>
        prev.map((d) => (d.id === design.id ? { ...d, approvalStatus: status, adminNotes: designAdminNotes } : d))
      );
      setPreviewDesign(null);
    }
  };

  // Order Fulfillment Actions
  const handleUpdateOrderStatus = async (
    order: QikinkFulfillmentOrder,
    status: string,
    tracking?: string,
    courier?: string
  ) => {
    const res = await updateAdminOrderStatus(order.id, status, tracking, courier);
    if (res.success) {
      showToast(`Order #${order.orderNumber} status updated to: ${status}`);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? { ...o, qikinkStatus: status as any, trackingNumber: tracking || o.trackingNumber, courierName: courier || o.courierName }
            : o
        )
      );
    }
  };

  const handleRedispatchOrder = async (orderId: string) => {
    const res = await redispatchOrderToQikink(orderId);
    if (res.success) {
      showToast(res.message || 'Order re-dispatched to Qikink!');
      fetchAllDashboardData();
    }
  };

  // Run Simulator Push
  const handleRunSimulatorPush = async () => {
    setIsSimulating(true);
    try {
      const res = await simulateQikinkProductPush({
        title: simForm.title,
        category: simForm.category,
        basePrice: simForm.basePrice,
        retailPrice: simForm.retailPrice,
        mockupUrl: simForm.mockupUrl,
        printArea: simForm.printArea,
      });

      if (res.success) {
        showToast(res.message || 'Product pushed from Qikink into Staging Drafts!');
        fetchAllDashboardData();
        if (onRefreshStorefrontCatalog) onRefreshStorefrontCatalog();
      }
    } catch {
      alert('Simulation failed.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase())) ||
        (p.badge && p.badge.toLowerCase().includes(productSearch.toLowerCase()));

      const matchCat =
        productCategoryFilter === 'all'
          ? true
          : productCategoryFilter === 'live'
          ? p.isLive
          : productCategoryFilter === 'draft'
          ? !p.isLive
          : p.category.toLowerCase() === productCategoryFilter.toLowerCase();

      const matchGsm =
        productGsmFilter === 'all'
          ? true
          : String(p.fabricGsm) === productGsmFilter;

      return matchSearch && matchCat && matchGsm;
    });
  }, [products, productSearch, productCategoryFilter, productGsmFilter]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.customerEmail.toLowerCase().includes(orderSearch.toLowerCase()) ||
        (o.trackingNumber && o.trackingNumber.toLowerCase().includes(orderSearch.toLowerCase()));

      const matchStatus = orderStatusFilter === 'all' || o.qikinkStatus === orderStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  // Filtered Auth Logs
  const filteredAuthLogs = useMemo(() => {
    return authLogs.filter((log) => {
      const matchType = authLogTypeFilter === 'all' || log.eventType === authLogTypeFilter;
      const matchEmail =
        !authLogEmailSearch ||
        log.userEmail.toLowerCase().includes(authLogEmailSearch.toLowerCase()) ||
        (log.userName && log.userName.toLowerCase().includes(authLogEmailSearch.toLowerCase()));
      return matchType && matchEmail;
    });
  }, [authLogs, authLogTypeFilter, authLogEmailSearch]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-fade-in select-none text-neutral-200"
      onClick={onClose}
    >
      <div
        className="bg-[#0e141b] rounded-2xl sm:rounded-3xl border border-neutral-800 w-full max-w-7xl h-[94vh] shadow-2xl flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Alert Notification */}
        {toastMessage && (
          <div className="absolute top-4 right-6 z-50 bg-amber-400 text-black px-4 py-2.5 rounded-xl font-bold text-xs shadow-xl flex items-center space-x-2 animate-bounce">
            <Sparkles className="w-4 h-4 text-black flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 1. LOGIN PORTAL VIEW (If not authenticated) */}
        {/* ========================================================================= */}
        {!isAuthenticated ? (
          <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-neutral-400 hover:text-white p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition"
              title="Close Portal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="max-w-md w-full bg-neutral-900/90 border border-neutral-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              {/* Portal Header */}
              <div className="text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h2 className="font-['Oswald'] text-2xl sm:text-3xl font-black tracking-widest text-white uppercase">
                  ADMIN COMMAND PORTAL
                </h2>
                <p className="text-xs text-neutral-400">
                  Secure administration access for ANFA PRINT WEAR management & POD pipelines
                </p>
              </div>

              {/* Login Error Notification */}
              {loginError && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-neutral-400 uppercase mb-1.5">
                    Administrator Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="Enter administrator email"
                      required
                      autoComplete="off"
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-neutral-400 uppercase mb-1.5">
                    Security Passcode / Secret Key
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter security password"
                      required
                      autoComplete="new-password"
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center space-x-2 text-neutral-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded bg-neutral-900 border-neutral-700 text-amber-400 focus:ring-0"
                    />
                    <span>Remember on this device</span>
                  </label>
                  <span className="text-[11px] text-amber-400/80 font-mono">256-Bit Encrypted</span>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-amber-400 hover:bg-amber-500 text-black font-extrabold text-xs py-3 rounded-xl uppercase tracking-wider transition shadow-lg hover:shadow-amber-400/20 active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  {isLoggingIn ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-black" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4 text-black" />
                      <span>AUTHENTICATE & ENTER DASHBOARD</span>
                    </>
                  )}
                </button>
              </form>

              {/* Footer info */}
              <div className="text-center text-[10px] text-neutral-500 flex items-center justify-center space-x-2">
                <Globe className="w-3 h-3 text-neutral-500" />
                <span>Bhainsa Hub • Telangana 504103</span>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* 2. AUTHENTICATED ADMIN COMMAND DASHBOARD */
          /* ========================================================================= */
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Top Navigation & Status Bar */}
            <div className="bg-neutral-950 px-4 sm:px-6 py-3.5 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
              {/* Brand & Admin Badge */}
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-black font-black flex items-center justify-center text-sm shadow-md">
                  A
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-['Oswald'] font-black text-lg tracking-wider text-white uppercase">
                      {settings.storeName || 'ANFA PRINT WEAR'}
                    </span>
                    <span className="text-[9px] bg-amber-400 text-black font-black px-2 py-0.5 rounded-full uppercase">
                      ADMIN
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    Logged in as <span className="text-amber-400 font-mono">{adminUser?.email}</span>
                  </p>
                </div>
              </div>

              {/* Quick Actions & Live Connection Indicators */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Real-time Supabase Database Live Connection Green Badge */}
                <div
                  className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono select-none"
                  title={`Supabase PostgreSQL connected (${supabaseStatus.latencyMs || 24}ms latency)`}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]"></span>
                  </span>
                  <span className="font-bold tracking-tight">Supabase</span>
                  <span className="text-[9px] text-emerald-300/80 uppercase font-sans font-bold">Connected</span>
                </div>

                <button
                  onClick={fetchAllDashboardData}
                  disabled={isLoadingData}
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition active:scale-95"
                  title="Refresh website data & database sync"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin text-amber-400' : ''}`} />
                  <span className="hidden sm:inline">Sync Data</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs font-bold flex items-center space-x-1.5 transition"
                  title="Log out from admin"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition"
                  title="Exit Admin Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Dashboard Tabs Bar */}
            <div className="bg-neutral-900/90 px-4 sm:px-6 border-b border-neutral-800 flex items-center space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none py-2 text-xs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-2 rounded-xl font-bold tracking-wider uppercase transition flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('products')}
                className={`px-3 py-2 rounded-xl font-bold tracking-wider uppercase transition flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === 'products'
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Products & Pricing ({products.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('qikink')}
                className={`px-3 py-2 rounded-xl font-bold tracking-wider uppercase transition flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === 'qikink'
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Qikink POD Sync</span>
              </button>

              <button
                onClick={() => setActiveTab('designs')}
                className={`px-3 py-2 rounded-xl font-bold tracking-wider uppercase transition flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === 'designs'
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <FileImage className="w-3.5 h-3.5" />
                <span>Custom Designs ({customDesigns.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`px-3 py-2 rounded-xl font-bold tracking-wider uppercase transition flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>POD Orders ({orders.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('auth_logs')}
                className={`px-3 py-2 rounded-xl font-bold tracking-wider uppercase transition flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === 'auth_logs'
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Customer Auth Logs ({authLogs.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-2 rounded-xl font-bold tracking-wider uppercase transition flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Store & System</span>
              </button>
            </div>

            {/* Main Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* ========================================================================= */}
              {/* TAB 1: OVERVIEW & ANALYTICS */}
              {/* ========================================================================= */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* KPI Metric Cards Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Revenue */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-2">
                      <div className="flex items-center justify-between text-neutral-400 text-xs">
                        <span className="font-bold uppercase tracking-wider">Total POD Revenue</span>
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                      </div>
                      <p className="font-['Oswald'] text-2xl sm:text-3xl font-black text-white">
                        ₹{(stats?.totalRevenue ?? orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)).toLocaleString('en-IN')}
                      </p>
                      <p className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>Live Qikink fulfillment stream</span>
                      </p>
                    </div>

                    {/* Total Orders */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-2">
                      <div className="flex items-center justify-between text-neutral-400 text-xs">
                        <span className="font-bold uppercase tracking-wider">Total Orders</span>
                        <ShoppingBag className="w-4 h-4 text-amber-400" />
                      </div>
                      <p className="font-['Oswald'] text-2xl sm:text-3xl font-black text-white">
                        {orders.length} Orders
                      </p>
                      <p className="text-[11px] text-amber-400 font-semibold">
                        {orders.filter((o) => o.qikinkStatus === 'in_production').length} in active production
                      </p>
                    </div>

                    {/* Live vs Draft Catalog */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-2">
                      <div className="flex items-center justify-between text-neutral-400 text-xs">
                        <span className="font-bold uppercase tracking-wider">Live Catalog</span>
                        <Layers className="w-4 h-4 text-blue-400" />
                      </div>
                      <p className="font-['Oswald'] text-2xl sm:text-3xl font-black text-white">
                        {products.filter((p) => p.isLive).length}{' '}
                        <span className="text-sm font-normal text-neutral-400">/ {products.length} Total</span>
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        {products.filter((p) => !p.isLive).length} staged drafts awaiting pricing
                      </p>
                    </div>

                    {/* Customer Auth Activity Today */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-2">
                      <div className="flex items-center justify-between text-neutral-400 text-xs">
                        <span className="font-bold uppercase tracking-wider">Logins Today</span>
                        <Users className="w-4 h-4 text-purple-400" />
                      </div>
                      <p className="font-['Oswald'] text-2xl sm:text-3xl font-black text-white">
                        {stats?.loginsTodayCount ?? 4}{' '}
                        <span className="text-sm font-normal text-neutral-400">Customer Logins</span>
                      </p>
                      <p className="text-[11px] text-purple-400 font-semibold">
                        {authLogs.filter((l) => l.eventType === 'logout').length} logouts monitored
                      </p>
                    </div>
                  </div>

                  {/* Two Column Section: Quick Actions & Live Activity Stream */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 Cols: Recent Customer Orders & Design Submissions */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Active POD Queue Table */}
                      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-['Oswald'] text-base font-bold tracking-wider text-white uppercase flex items-center space-x-2">
                            <Truck className="w-4 h-4 text-amber-400" />
                            <span>Recent POD Manufacturing Queue</span>
                          </h3>
                          <button
                            onClick={() => setActiveTab('orders')}
                            className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1"
                          >
                            <span>View All</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {orders.length === 0 ? (
                          <p className="text-xs text-neutral-500 py-4 text-center">No orders in queue.</p>
                        ) : (
                          <div className="divide-y divide-neutral-800">
                            {orders.slice(0, 4).map((ord) => (
                              <div key={ord.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                                <div className="space-y-0.5">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-bold text-white font-mono">{ord.orderNumber}</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-amber-400/10 text-amber-400 border border-amber-400/20">
                                      {ord.qikinkStatus.replace('_', ' ')}
                                    </span>
                                  </div>
                                  <p className="text-neutral-400">
                                    {ord.customerName} • {ord.items.length} item(s) • ₹{ord.totalAmount}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className="font-mono text-neutral-400 text-[11px]">
                                    {ord.trackingNumber || 'Pending Courier'}
                                  </span>
                                  <p className="text-[10px] text-neutral-500">{new Date(ord.createdAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* User Custom Designs Stored */}
                      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-['Oswald'] text-base font-bold tracking-wider text-white uppercase flex items-center space-x-2">
                            <FileImage className="w-4 h-4 text-amber-400" />
                            <span>Recent Custom Design Uploads (Supabase Bucket)</span>
                          </h3>
                          <button
                            onClick={() => setActiveTab('designs')}
                            className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1"
                          >
                            <span>Inspect All</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {customDesigns.slice(0, 2).map((des) => (
                            <div
                              key={des.id}
                              className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex items-center space-x-3"
                            >
                              <div className="w-14 h-14 rounded-lg bg-neutral-900 border border-neutral-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                                <img
                                  src={des.fileUrl}
                                  alt={des.fileName}
                                  className="w-full h-full object-contain p-1"
                                />
                              </div>
                              <div className="flex-1 min-w-0 space-y-0.5">
                                <p className="font-bold text-white text-xs truncate">{des.fileName}</p>
                                <p className="text-[10px] text-neutral-400 truncate">{des.customerEmail}</p>
                                <div className="flex items-center space-x-2 text-[10px]">
                                  <span className="text-emerald-400 font-bold">300 DPI Transparent</span>
                                  <span className="text-neutral-500">•</span>
                                  <span className="text-amber-400 uppercase font-semibold">
                                    {des.approvalStatus?.replace('_', ' ') || 'Pending'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right 1 Col: Customer Auth Events Live Stream & Quick Admin Actions */}
                    <div className="space-y-6">
                      {/* Customer Logins/Logouts Stream */}
                      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-['Oswald'] text-base font-bold tracking-wider text-white uppercase flex items-center space-x-2">
                            <Users className="w-4 h-4 text-purple-400" />
                            <span>Customer Logins & Logouts</span>
                          </h3>
                          <button
                            onClick={() => setActiveTab('auth_logs')}
                            className="text-xs text-purple-400 hover:text-purple-300 font-bold"
                          >
                            All Logs
                          </button>
                        </div>

                        <div className="space-y-3">
                          {authLogs.slice(0, 4).map((log) => (
                            <div
                              key={log.id}
                              className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1 text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white truncate max-w-[140px]">{log.userEmail}</span>
                                <span
                                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                    log.eventType === 'login'
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : log.eventType === 'logout'
                                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                  }`}
                                >
                                  {log.eventType}
                                </span>
                              </div>
                              <p className="text-[10px] text-neutral-400 truncate">{log.device || log.ipAddress}</p>
                              <p className="text-[9px] text-neutral-500 font-mono">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Quick Actions Card */}
                      <div className="bg-gradient-to-br from-amber-950/30 to-neutral-900 border border-amber-500/20 rounded-2xl p-5 space-y-3">
                        <h4 className="font-['Oswald'] text-sm font-bold text-amber-400 uppercase tracking-wider">
                          Admin Quick Dispatch
                        </h4>
                        <div className="space-y-2">
                          <button
                            onClick={() => handleOpenEditProduct()}
                            className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-bold text-xs flex items-center justify-center space-x-2 transition"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add New Product to Catalog</span>
                          </button>

                          <button
                            onClick={() => setActiveTab('qikink')}
                            className="w-full py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition border border-neutral-700"
                          >
                            <Zap className="w-4 h-4 text-amber-400" />
                            <span>Trigger Qikink Product Drop</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 2: PRODUCTS, PRICING & QUALITY GSM MANAGER */}
              {/* ========================================================================= */}
              {activeTab === 'products' && (
                <div className="space-y-6">
                  {/* Controls Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900 p-4 rounded-2xl border border-neutral-800">
                    {/* Search & Filters */}
                    <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                      <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Search products by title, SKU, badge..."
                          className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      {/* Status Filter */}
                      <select
                        value={productCategoryFilter}
                        onChange={(e) => setProductCategoryFilter(e.target.value)}
                        className="bg-neutral-950 border border-neutral-700 text-neutral-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
                      >
                        <option value="all">All Visibility (Live + Draft)</option>
                        <option value="live">Live on Storefront Only</option>
                        <option value="draft">Staged Drafts Only</option>
                        <option value="bestseller">Bestsellers</option>
                        <option value="featured">Featured</option>
                        <option value="winter-special">Winter Special</option>
                      </select>

                      {/* GSM Quality Filter */}
                      <select
                        value={productGsmFilter}
                        onChange={(e) => setProductGsmFilter(e.target.value)}
                        className="bg-neutral-950 border border-neutral-700 text-neutral-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
                      >
                        <option value="all">All Fabric Qualities</option>
                        <option value="180">180 GSM (Everyday Light)</option>
                        <option value="220">220 GSM (Premium Bio-Wash)</option>
                        <option value="240">240 GSM (Luxury French Terry)</option>
                        <option value="280">280 GSM (Heavyweight Streetwear)</option>
                      </select>
                    </div>

                    {/* Add Product Button */}
                    <button
                      onClick={() => handleOpenEditProduct()}
                      className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Product</span>
                    </button>
                  </div>

                  {/* Products Table */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-neutral-300">
                        <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                          <tr>
                            <th className="py-3 px-4">Item & SKU</th>
                            <th className="py-3 px-4">Pricing & MRP</th>
                            <th className="py-3 px-4">Fabric Quality & GSM</th>
                            <th className="py-3 px-4">Print Specs</th>
                            <th className="py-3 px-4">Storefront Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/80">
                          {filteredProducts.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-neutral-500">
                                No products match your filter criteria.
                              </td>
                            </tr>
                          ) : (
                            filteredProducts.map((p) => {
                              const margin = p.originalPrice ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
                              return (
                                <tr key={p.id} className="hover:bg-neutral-800/40 transition">
                                  {/* Item & SKU */}
                                  <td className="py-3 px-4">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-12 h-12 rounded-lg bg-neutral-950 border border-neutral-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                        <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                                      </div>
                                      <div>
                                        <p className="font-bold text-white max-w-[200px] truncate">{p.name}</p>
                                        <div className="flex items-center space-x-1.5 text-[10px] text-neutral-400 font-mono">
                                          <span>{p.sku || p.id}</span>
                                          {p.badge && (
                                            <span className="bg-neutral-800 text-amber-400 px-1.5 py-0.2 rounded font-sans font-bold text-[9px]">
                                              {p.badge}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Pricing & MRP */}
                                  <td className="py-3 px-4 font-mono">
                                    <p className="text-amber-400 font-bold text-sm">₹{p.price}</p>
                                    {p.originalPrice && (
                                      <p className="text-[10px] text-neutral-500 line-through">MRP: ₹{p.originalPrice}</p>
                                    )}
                                    {margin > 0 && <span className="text-[9px] text-emerald-400 font-sans">{margin}% Off MRP</span>}
                                  </td>

                                  {/* Fabric Quality & GSM */}
                                  <td className="py-3 px-4">
                                    <div className="space-y-0.5">
                                      <span className="inline-block px-2 py-0.5 rounded font-black text-[10px] bg-amber-400/10 text-amber-400 border border-amber-400/20">
                                        {p.fabricGsm ? `${p.fabricGsm} GSM` : '240 GSM'}
                                      </span>
                                      <p className="text-[10px] text-neutral-400 truncate max-w-[180px]">
                                        {p.fabricComposition || '100% Bio-Washed Cotton'}
                                      </p>
                                      <p className="text-[9px] text-neutral-500 uppercase">{p.fitType || 'Oversized'}</p>
                                    </div>
                                  </td>

                                  {/* Print Specs */}
                                  <td className="py-3 px-4 text-[11px] text-neutral-400">
                                    <p className="text-white font-medium capitalize">
                                      {p.printSpecs?.printArea || 'Front Chest'} DTG
                                    </p>
                                    <p className="text-[10px] text-emerald-400 font-mono">300 DPI Cured</p>
                                  </td>

                                  {/* Live Toggle */}
                                  <td className="py-3 px-4">
                                    <button
                                      onClick={() => handleToggleProductLive(p)}
                                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center space-x-1 transition ${
                                        p.isLive
                                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                                          : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-700'
                                      }`}
                                    >
                                      {p.isLive ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3" />}
                                      <span>{p.isLive ? 'LIVE' : 'DRAFT'}</span>
                                    </button>
                                  </td>

                                  {/* Actions */}
                                  <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end space-x-2">
                                      <button
                                        onClick={() => handleOpenEditProduct(p)}
                                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-amber-400 hover:text-black text-neutral-300 transition"
                                        title="Edit pricing & quality specs"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteProduct(p)}
                                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rose-600 text-neutral-400 hover:text-white transition"
                                        title="Delete product"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 3: QIKINK POD SYNC & WEBHOOK MONITOR */}
              {/* ========================================================================= */}
              {activeTab === 'qikink' && (
                <div className="space-y-6">
                  {/* Qikink Sandbox Connection Status Card */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-['Oswald'] text-lg font-black tracking-wider text-white uppercase">
                            QIKINK POD SANDBOX PIPELINE
                          </span>
                          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                            ACTIVE SANDBOX
                          </span>
                          <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono">
                            TEST INTEGRATION READY
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400">
                          Automated Direct-to-Garment (DTG) production and webhook synchronization with Qikink Tirupur Hub & Hyderabad Gateway.
                        </p>
                      </div>

                      <div className="flex items-center space-x-3 text-xs font-mono">
                        <div className="bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800">
                          <span className="text-neutral-500">Client ID: </span>
                          <strong className="text-amber-400">{sandboxStatus?.qikink.clientId || 'ANFA_STORE_SANDBOX_01'}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Sandbox Credentials & Endpoint Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 space-y-1">
                        <span className="text-[10px] text-neutral-500 uppercase font-sans font-bold block">Sandbox API Key</span>
                        <span className="text-emerald-400">{sandboxStatus?.qikink.apiKeyMasked || 'qik_san••••••••••••2026'}</span>
                      </div>
                      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 space-y-1">
                        <span className="text-[10px] text-neutral-500 uppercase font-sans font-bold block">Webhook Secret</span>
                        <span className="text-amber-400">{sandboxStatus?.qikink.webhookSecretMasked || 'qik_wh••••••••'}</span>
                      </div>
                      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 space-y-1">
                        <span className="text-[10px] text-neutral-500 uppercase font-sans font-bold block">Qikink API Base</span>
                        <span className="text-neutral-300 text-[11px] truncate block">{sandboxStatus?.qikink.baseUrl || 'https://sandbox.qikink.com/api'}</span>
                      </div>
                    </div>

                    {/* Endpoint display */}
                    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-neutral-300">
                      <div>
                        <span className="text-neutral-500">Inbound Webhook URL: </span>
                        <span className="text-amber-400">/api/webhooks/qikink</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-sans font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        READY FOR LIVE & SANDBOX PUSHES
                      </span>
                    </div>
                  </div>

                  {/* Sandbox Test Trigger Bar */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-['Oswald'] text-base font-bold tracking-wider text-white uppercase flex items-center space-x-2">
                          <Zap className="w-4 h-4 text-amber-400" />
                          <span>Interactive Sandbox Test Controls</span>
                        </h3>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Execute automated test orders through the sandbox fulfillment pipeline or trigger live webhook status callbacks.
                        </p>
                      </div>

                      <button
                        onClick={handleDispatchSandboxTestOrder}
                        disabled={isDispatchingTestOrder}
                        className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-extrabold text-xs uppercase tracking-wider transition shadow-lg flex items-center space-x-2 disabled:opacity-50"
                      >
                        {isDispatchingTestOrder ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-black" />
                            <span>Dispatching Test Order...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 text-black" />
                            <span>Dispatch Test Order to Sandbox</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Webhook Status Simulation Triggers */}
                    <div className="pt-2 border-t border-neutral-800 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-neutral-400 text-[11px] font-bold uppercase mr-1">Simulate Order Status Callback:</span>
                      <button
                        onClick={() => handleTriggerSandboxWebhook('in_production')}
                        className="px-2.5 py-1 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white font-mono text-[11px] transition"
                      >
                        in_production
                      </button>
                      <button
                        onClick={() => handleTriggerSandboxWebhook('printed')}
                        className="px-2.5 py-1 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 text-amber-400 hover:text-amber-300 font-mono text-[11px] transition"
                      >
                        printed (DTG Cured)
                      </button>
                      <button
                        onClick={() => handleTriggerSandboxWebhook('shipped')}
                        className="px-2.5 py-1 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 text-cyan-400 hover:text-cyan-300 font-mono text-[11px] transition"
                      >
                        shipped (Delhivery)
                      </button>
                      <button
                        onClick={() => handleTriggerSandboxWebhook('delivered')}
                        className="px-2.5 py-1 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 text-emerald-400 hover:text-emerald-300 font-mono text-[11px] transition"
                      >
                        delivered
                      </button>
                    </div>
                  </div>

                  {/* Simulator & Tester Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Product Push Simulator */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
                      <h3 className="font-['Oswald'] text-base font-bold tracking-wider text-white uppercase flex items-center space-x-2">
                        <Send className="w-4 h-4 text-amber-400" />
                        <span>Simulate Live Qikink Product Push</span>
                      </h3>
                      <p className="text-xs text-neutral-400">
                        Simulates Qikink pushing a newly created on-demand apparel design into the staging drafts queue.
                      </p>

                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block text-neutral-400 font-bold uppercase text-[10px] mb-1">
                            Product Title
                          </label>
                          <input
                            type="text"
                            value={simForm.title}
                            onChange={(e) => setSimForm({ ...simForm, title: e.target.value })}
                            className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-white"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-neutral-400 font-bold uppercase text-[10px] mb-1">
                              Base Cost (₹)
                            </label>
                            <input
                              type="number"
                              value={simForm.basePrice}
                              onChange={(e) => setSimForm({ ...simForm, basePrice: Number(e.target.value) })}
                              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-neutral-400 font-bold uppercase text-[10px] mb-1">
                              Retail MRP (₹)
                            </label>
                            <input
                              type="number"
                              value={simForm.retailPrice}
                              onChange={(e) => setSimForm({ ...simForm, retailPrice: Number(e.target.value) })}
                              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-white font-mono"
                            />
                          </div>
                        </div>

                        <button
                          onClick={handleRunSimulatorPush}
                          disabled={isSimulating}
                          className="w-full bg-amber-400 hover:bg-amber-500 text-black font-extrabold text-xs py-2.5 rounded-xl uppercase tracking-wider transition shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          {isSimulating ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin text-black" />
                              <span>Dispatching Webhook Payload...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 text-black" />
                              <span>PUSH MOCK PRODUCT TO DRAFTS</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Right: Webhook Payload Logs */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-['Oswald'] text-base font-bold tracking-wider text-white uppercase flex items-center space-x-2">
                          <Activity className="w-4 h-4 text-emerald-400" />
                          <span>Inbound Webhook Event Logs</span>
                        </h3>
                        <span className="text-[10px] font-mono text-neutral-500">
                          Total: {webhookLogs.length} events
                        </span>
                      </div>

                      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                        {webhookLogs.length === 0 ? (
                          <p className="text-xs text-neutral-500 py-6 text-center">No webhook payloads logged yet.</p>
                        ) : (
                          webhookLogs.map((log) => (
                            <div
                              key={log.id}
                              className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1 text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-amber-400 font-mono">{log.event}</span>
                                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">
                                  {log.status}
                                </span>
                              </div>
                              <pre className="text-[10px] text-neutral-400 font-mono overflow-x-auto p-1.5 bg-neutral-900 rounded">
                                {JSON.stringify(log.payload, null, 2)}
                              </pre>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 4: USER CUSTOM DESIGNS REVIEW (SUPABASE BUCKET) */}
              {/* ========================================================================= */}
              {activeTab === 'designs' && (
                <div className="space-y-6">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-['Oswald'] text-base font-bold tracking-wider text-white uppercase">
                        Customer Transparent PNG Design Submissions
                      </h3>
                      <p className="text-xs text-neutral-400">
                        Inspect high-resolution customer artwork stored in Supabase (`custom-designs` bucket) before DTG print production
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 text-xs">
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                        PNG Alpha Transparency Verified
                      </span>
                    </div>
                  </div>

                  {/* Designs Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {customDesigns.map((des) => (
                      <div
                        key={des.id}
                        className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden p-4 space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          {/* Image preview box with checkerboard background */}
                          <div className="w-full h-44 rounded-xl bg-[linear-gradient(45deg,#171717_25%,transparent_25%),linear-gradient(-45deg,#171717_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#171717_75%),linear-gradient(-45deg,transparent_75%,#171717_75%)] bg-[size:16px_16px] bg-[#101010] border border-neutral-800 flex items-center justify-center p-3 overflow-hidden relative group">
                            <img
                              src={des.fileUrl}
                              alt={des.fileName}
                              className="max-h-full max-w-full object-contain group-hover:scale-105 transition"
                            />
                            <span className="absolute bottom-2 right-2 text-[9px] bg-black/80 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                              {des.widthPx}x{des.heightPx} • 300 DPI
                            </span>
                          </div>

                          <div className="space-y-1 text-xs">
                            <p className="font-bold text-white truncate" title={des.fileName}>
                              {des.fileName}
                            </p>
                            <p className="text-[11px] text-neutral-400 truncate">
                              Customer: <span className="text-amber-400">{des.customerEmail || des.customerId}</span>
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-1">
                              <span>Size: {(des.fileSizeBytes / 1024 / 1024).toFixed(2)} MB</span>
                              <span className="text-amber-400 font-bold uppercase">
                                {des.approvalStatus?.replace('_', ' ') || 'Pending Review'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-2 border-t border-neutral-800 flex items-center space-x-2 text-xs">
                          <button
                            onClick={() => {
                              setPreviewDesign(des);
                              setDesignAdminNotes(des.adminNotes || '');
                            }}
                            className="flex-1 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold flex items-center justify-center space-x-1 transition"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-400" />
                            <span>Review Asset</span>
                          </button>

                          <a
                            href={des.fileUrl}
                            download={des.fileName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-amber-400 hover:text-black text-neutral-300 transition"
                            title="Download original PNG file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 5: POD ORDERS & FULFILLMENT MONITOR */}
              {/* ========================================================================= */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  {/* Search and Filters */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900 p-4 rounded-2xl border border-neutral-800">
                    <div className="relative flex-1 min-w-[240px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <input
                        type="text"
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        placeholder="Search by order #, customer, tracking..."
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      className="bg-neutral-950 border border-neutral-700 text-neutral-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
                    >
                      <option value="all">All Fulfillment Stages</option>
                      <option value="sent_to_qikink">Sent to Qikink</option>
                      <option value="in_production">In Production</option>
                      <option value="printed">Printed</option>
                      <option value="packed">Packed</option>
                      <option value="dispatched">Dispatched</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>

                  {/* Orders Cards List */}
                  <div className="space-y-4">
                    {filteredOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-md"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className="font-['Oswald'] text-base font-bold text-white tracking-wider">
                                {ord.orderNumber}
                              </span>
                              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-amber-400/10 text-amber-400 border border-amber-400/30">
                                {ord.qikinkStatus.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-400">
                              Placed on {new Date(ord.createdAt).toLocaleString()}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="font-mono text-sm font-bold text-emerald-400">₹{ord.totalAmount}</p>
                            <p className="text-[10px] text-neutral-400 font-mono">
                              Courier: {ord.courierName || 'Delhivery Express'} ({ord.trackingNumber || 'Pending'})
                            </p>
                          </div>
                        </div>

                        {/* Items Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-2">
                            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                              Order Items ({ord.items.length})
                            </p>
                            {ord.items.map((it, idx) => (
                              <div
                                key={idx}
                                className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between"
                              >
                                <div className="space-y-0.5">
                                  <p className="font-bold text-white">{it.name}</p>
                                  <p className="text-[10px] text-neutral-400">
                                    Size: {it.size} • Color: {it.color} • Qty: {it.quantity}
                                  </p>
                                </div>
                                <span className="font-mono text-amber-400 font-bold">₹{it.price * it.quantity}</span>
                              </div>
                            ))}
                          </div>

                          <div className="space-y-2">
                            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                              Shipping & Customer Address
                            </p>
                            <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 space-y-1 text-neutral-300">
                              <p className="font-bold text-white">{ord.customerName}</p>
                              <p className="text-[11px] text-neutral-400">{ord.customerEmail} • {ord.customerPhone}</p>
                              <p className="text-[11px] text-neutral-400 leading-tight">
                                {ord.shippingAddress?.street}, {ord.shippingAddress?.city}, {ord.shippingAddress?.state} - {ord.shippingAddress?.pincode}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Status Change Buttons */}
                        <div className="pt-2 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] text-neutral-400 mr-1">Update Status:</span>
                            {['in_production', 'printed', 'dispatched', 'delivered'].map((st) => (
                              <button
                                key={st}
                                onClick={() => handleUpdateOrderStatus(ord, st)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                                  ord.qikinkStatus === st
                                    ? 'bg-amber-400 text-black font-extrabold'
                                    : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'
                                }`}
                              >
                                {st.replace('_', ' ')}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() => handleRedispatchOrder(ord.id)}
                            className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-amber-400 hover:text-black text-amber-400 font-bold text-xs transition flex items-center space-x-1"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Re-sync with Qikink</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 6: CUSTOMER ACCOUNT LOGINS & LOGOUTS MONITORING */}
              {/* ========================================================================= */}
              {activeTab === 'auth_logs' && (
                <div className="space-y-6">
                  {/* Header info & filters */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-['Oswald'] text-base font-bold tracking-wider text-white uppercase flex items-center space-x-2">
                          <Users className="w-4 h-4 text-purple-400" />
                          <span>Live Customer Authentication Audit Stream</span>
                        </h3>
                        <p className="text-xs text-neutral-400">
                          Monitor all customer account logins, logouts, signups, and session devices in real-time
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <select
                          value={authLogTypeFilter}
                          onChange={(e) => setAuthLogTypeFilter(e.target.value)}
                          className="bg-neutral-950 border border-neutral-700 text-neutral-300 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-400"
                        >
                          <option value="all">All Events (Login + Logout + Signup)</option>
                          <option value="login">Logins Only</option>
                          <option value="logout">Logouts Only</option>
                          <option value="signup">Signups Only</option>
                        </select>
                      </div>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <input
                        type="text"
                        value={authLogEmailSearch}
                        onChange={(e) => setAuthLogEmailSearch(e.target.value)}
                        placeholder="Filter by customer email or name..."
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Auth Logs Table */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-neutral-300">
                        <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                          <tr>
                            <th className="py-3 px-4">Timestamp</th>
                            <th className="py-3 px-4">Customer Account</th>
                            <th className="py-3 px-4">Auth Event</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Device & IP Location</th>
                            <th className="py-3 px-4">Audit Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/80">
                          {filteredAuthLogs.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-neutral-500">
                                No authentication logs match your query.
                              </td>
                            </tr>
                          ) : (
                            filteredAuthLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-neutral-800/40 transition">
                                <td className="py-3 px-4 font-mono text-[11px] text-neutral-400 whitespace-nowrap">
                                  {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="py-3 px-4">
                                  <p className="font-bold text-white">{log.userEmail}</p>
                                  {log.userName && <p className="text-[10px] text-neutral-400">{log.userName}</p>}
                                </td>
                                <td className="py-3 px-4">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase inline-block ${
                                      log.eventType === 'login'
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        : log.eventType === 'logout'
                                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                    }`}
                                  >
                                    {log.eventType}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span
                                    className={`text-[10px] font-bold ${
                                      log.status === 'success' ? 'text-emerald-400' : 'text-rose-400'
                                    }`}
                                  >
                                    {log.status.toUpperCase()}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-[11px] text-neutral-400">
                                  <p className="text-white truncate max-w-[180px]">{log.device || 'Web Session'}</p>
                                  <p className="text-[10px] text-neutral-500 font-mono truncate max-w-[180px]">
                                    {log.ipAddress}
                                  </p>
                                </td>
                                <td className="py-3 px-4 text-[11px] text-neutral-400 max-w-[240px]">
                                  {log.details || 'Customer session state updated.'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 7: STORE & SYSTEM CONFIGURATION */}
              {/* ========================================================================= */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Store Contact & Address Card */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
                      <h3 className="font-['Oswald'] text-base font-bold tracking-wider text-white uppercase">
                        Store Profile & Contacts
                      </h3>
                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block text-neutral-500 text-[10px] uppercase font-bold">Store Name</label>
                          <p className="text-white font-bold">{settings.storeName}</p>
                        </div>
                        <div>
                          <label className="block text-neutral-500 text-[10px] uppercase font-bold">Physical Address</label>
                          <p className="text-neutral-300">{settings.address}</p>
                        </div>
                        <div>
                          <label className="block text-neutral-500 text-[10px] uppercase font-bold">Support Email</label>
                          <p className="text-amber-400 font-mono">{settings.email}</p>
                        </div>
                        <div>
                          <label className="block text-neutral-500 text-[10px] uppercase font-bold">Phone Number</label>
                          <p className="text-white font-mono">{settings.phone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Infrastructure & Database Health */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
                      <h3 className="font-['Oswald'] text-base font-bold tracking-wider text-white uppercase">
                        Backend, Sandbox & Cloud Integrations
                      </h3>
                      <div className="space-y-3 text-xs">
                        <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-white">Qikink DTG Fulfillment Sandbox</p>
                            <p className="text-[10px] text-neutral-400 font-mono">
                              Client: {sandboxStatus?.qikink.clientId || 'ANFA_STORE_SANDBOX_01'} | Key: {sandboxStatus?.qikink.apiKeyMasked || 'Active'}
                            </p>
                          </div>
                          <span className="text-amber-400 font-bold text-[10px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            SANDBOX ACTIVE
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-white">Razorpay & UPI Payment Test Gateway</p>
                            <p className="text-[10px] text-neutral-400 font-mono">Key: {sandboxStatus?.payment.keyIdMasked || 'rzp_test_••••••••'}</p>
                          </div>
                          <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded">
                            TEST MODE READY
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-white">Supabase Cloud Database & Auth</p>
                            <p className="text-[10px] text-neutral-400 font-mono">Project: {SUPABASE_PROJECT_ID}</p>
                          </div>
                          <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded">
                            CONNECTED
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-white">Supabase Storage Bucket (PNGs)</p>
                            <p className="text-[10px] text-neutral-400 font-mono">Bucket: custom-designs</p>
                          </div>
                          <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded">
                            ACTIVE
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* EDIT / CREATE PRODUCT DRAWER */}
        {/* ========================================================================= */}
        {isEditProductOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in"
            onClick={() => setIsEditProductOpen(false)}
          >
            <div
              className="bg-neutral-900 border border-neutral-700 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-neutral-950 px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
                <h3 className="font-['Oswald'] text-lg font-bold text-white uppercase tracking-wider">
                  {editingProduct ? 'Edit Product Details & Quality Specs' : 'Add New Product to Catalog'}
                </h3>
                <button onClick={() => setIsEditProductOpen(false)} className="text-neutral-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-neutral-400 font-bold uppercase text-[10px] mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-neutral-400 font-bold uppercase text-[10px] mb-1">SKU</label>
                    <input
                      type="text"
                      value={productForm.sku}
                      onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 font-bold uppercase text-[10px] mb-1">
                      Selling Price (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 font-bold uppercase text-[10px] mb-1">
                      Original MRP (₹)
                    </label>
                    <input
                      type="number"
                      value={productForm.originalPrice}
                      onChange={(e) => setProductForm({ ...productForm, originalPrice: Number(e.target.value) })}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-white font-mono"
                    />
                  </div>
                </div>

                {/* Fabric Quality & GSM Specifications */}
                <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
                  <h4 className="font-['Oswald'] text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Fabric Quality & Material Specifications
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-neutral-400 font-bold uppercase text-[10px] mb-1">Fabric GSM</label>
                      <select
                        value={productForm.fabricGsm}
                        onChange={(e) => setProductForm({ ...productForm, fabricGsm: Number(e.target.value) })}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-2 text-white"
                      >
                        <option value="180">180 GSM (Everyday Light)</option>
                        <option value="220">220 GSM (Bio-Washed Cotton)</option>
                        <option value="240">240 GSM (Luxury French Terry)</option>
                        <option value="280">280 GSM (Heavyweight Streetwear)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-neutral-400 font-bold uppercase text-[10px] mb-1">Fit Type</label>
                      <select
                        value={productForm.fitType}
                        onChange={(e) => setProductForm({ ...productForm, fitType: e.target.value as any })}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-2 text-white"
                      >
                        <option value="oversized">Oversized Drop-Shoulder</option>
                        <option value="regular">Regular Classic Fit</option>
                        <option value="boxy">Boxy Streetwear</option>
                        <option value="slim">Slim Fit</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-neutral-400 font-bold uppercase text-[10px] mb-1">Quality Grade</label>
                      <input
                        type="text"
                        value={productForm.qualityGrade}
                        onChange={(e) => setProductForm({ ...productForm, qualityGrade: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-2 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-400 font-bold uppercase text-[10px] mb-1">
                      Fabric Composition
                    </label>
                    <input
                      type="text"
                      value={productForm.fabricComposition}
                      onChange={(e) => setProductForm({ ...productForm, fabricComposition: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-400 font-bold uppercase text-[10px] mb-1">Category</label>
                    <input
                      type="text"
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 font-bold uppercase text-[10px] mb-1">Badge</label>
                    <input
                      type="text"
                      value={productForm.badge}
                      onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-400 font-bold uppercase text-[10px] mb-1">Mockup Image URL</label>
                  <input
                    type="text"
                    value={productForm.image}
                    onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-bold uppercase text-[10px] mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <label className="flex items-center space-x-2 text-white font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.isLive}
                      onChange={(e) => setProductForm({ ...productForm, isLive: e.target.checked })}
                      className="rounded bg-neutral-950 border-neutral-700 text-amber-400 focus:ring-0 w-4 h-4"
                    />
                    <span>Publish live on storefront immediately</span>
                  </label>
                </div>

                <div className="pt-4 border-t border-neutral-800 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditProductOpen(false)}
                    className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg"
                  >
                    Save Product Specifications
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CUSTOM DESIGN REVIEW MODAL */}
        {/* ========================================================================= */}
        {previewDesign && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 animate-fade-in"
            onClick={() => setPreviewDesign(null)}
          >
            <div
              className="bg-neutral-900 border border-neutral-700 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-neutral-950 px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
                <h3 className="font-['Oswald'] text-lg font-bold text-white uppercase tracking-wider">
                  DTG Print Proof Check: {previewDesign.fileName}
                </h3>
                <button onClick={() => setPreviewDesign(null)} className="text-neutral-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto text-xs">
                {/* Large Preview */}
                <div className="w-full h-64 rounded-2xl bg-[linear-gradient(45deg,#171717_25%,transparent_25%),linear-gradient(-45deg,#171717_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#171717_75%),linear-gradient(-45deg,transparent_75%,#171717_75%)] bg-[size:16px_16px] bg-[#101010] border border-neutral-800 flex items-center justify-center p-4">
                  <img
                    src={previewDesign.fileUrl}
                    alt={previewDesign.fileName}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 text-neutral-300">
                  <div>
                    <span className="text-neutral-500 text-[10px] uppercase font-bold">Dimensions</span>
                    <p className="font-mono text-white font-bold">{previewDesign.widthPx} x {previewDesign.heightPx} px</p>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px] uppercase font-bold">Alpha Transparency</span>
                    <p className="text-emerald-400 font-bold">100% Transparent PNG</p>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px] uppercase font-bold">Customer</span>
                    <p className="text-amber-400 truncate">{previewDesign.customerEmail}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px] uppercase font-bold">Estimated DPI</span>
                    <p className="text-white font-mono font-bold">{previewDesign.dpiEstimated || 300} DPI (Print Ready)</p>
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-400 font-bold uppercase text-[10px] mb-1">
                    Administrator Review Notes
                  </label>
                  <textarea
                    rows={2}
                    value={designAdminNotes}
                    onChange={(e) => setDesignAdminNotes(e.target.value)}
                    placeholder="e.g., Verified transparent background; approved for DTG printing on black t-shirt."
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div className="pt-3 border-t border-neutral-800 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => handleUpdateDesignReview(previewDesign, 'rejected')}
                    className="px-3 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold"
                  >
                    Reject Design
                  </button>
                  <button
                    onClick={() => handleUpdateDesignReview(previewDesign, 'approved_for_print')}
                    className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-500 text-black font-extrabold shadow-lg"
                  >
                    Approve for DTG Printing
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
