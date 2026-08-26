import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Check,
  X,
  Upload,
  RefreshCw,
  Package,
  ShoppingBag,
  Users,
  LogOut,
  Sparkles,
  Layers,
  Send,
  Printer,
  Copy,
  ExternalLink,
  MessageCircle,
  FileText,
  AlertCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import {
  AdminUser,
  AdminStats,
  AuthEventLog,
  Product,
  QikinkFulfillmentOrder as CustomerOrder,
  StoreSettings,
} from '../types/store';
import {
  loginAdmin,
  logoutAdmin,
  getStoredAdminToken,
  getStoredAdminUser,
  fetchAdminStats,
  fetchAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  fetchAdminOrders,
  updateAdminOrderStatus,
  fetchCustomerAuthLogs,
  fetchSupabaseLiveStatus,
} from '../lib/adminApi';
import { TShirtMockup } from './TShirtMockup';
import { uploadCustomDesignToSupabase, syncLocalStateWithSupabase } from '../lib/supabase';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  onRefreshStorefrontCatalog?: () => void;
}

type SimpleAdminTab = 'products' | 'orders' | 'customers';

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  isOpen,
  onClose,
  settings,
  onRefreshStorefrontCatalog,
}) => {
  // Authentication State with default email
  const [adminUser, setAdminUser] = useState<AdminUser | null>(getStoredAdminUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getStoredAdminToken());
  const [loginEmail, setLoginEmail] = useState('abdulraheem18822@gmail.com');
  const [loginPassword, setLoginPassword] = useState('2605');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Tab: Products, Orders, Customers
  const [activeTab, setActiveTab] = useState<SimpleAdminTab>('products');

  // Core Data
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [authLogs, setAuthLogs] = useState<AuthEventLog[]>([]);
  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean;
    latencyMs?: number;
  }>({ connected: true, latencyMs: 24 });
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters & Search
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // Product Add / Edit Modal State
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
    sizes: string[];
    availableColors: { name: string; hex: string }[];
    shirtColor: string;
    graphicType: string;
    graphicUrl: string;
    isGlowInDark: boolean;
    isLive: boolean;
  }>({
    name: '',
    sku: '',
    price: 799,
    originalPrice: 1299,
    category: 'new-arrival',
    gender: 'unisex',
    badge: 'NEW ARRIVAL',
    description: 'Premium heavyweight cotton streetwear t-shirt with 300 DPI direct-to-garment print.',
    fabricGsm: 240,
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    availableColors: [
      { name: 'Pitch Black', hex: '#1E1E24' },
      { name: 'Pure White', hex: '#FFFFFF' },
      { name: 'Navy Blue', hex: '#1A2A44' },
    ],
    shirtColor: '#1E1E24',
    graphicType: 'custom',
    graphicUrl: '',
    isGlowInDark: false,
    isLive: true,
  });

  // Drag & drop image upload state
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadNotice, setImageUploadNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Supplier Dispatch Order Modal State
  const [selectedOrderForSupplier, setSelectedOrderForSupplier] = useState<CustomerOrder | null>(null);
  const [supplierCopied, setSupplierCopied] = useState(false);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch all admin data
  const fetchAllData = async () => {
    setIsLoadingData(true);
    try {
      const [prods, ords, logs, spStatus] = await Promise.all([
        fetchAdminProducts(),
        fetchAdminOrders(),
        fetchCustomerAuthLogs(),
        fetchSupabaseLiveStatus(),
      ]);

      if (prods && prods.length > 0) setProducts(prods);
      if (ords) setOrders(ords);
      if (logs) setAuthLogs(logs);
      if (spStatus) setSupabaseStatus({ connected: spStatus.connected, latencyMs: spStatus.latencyMs });
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchAllData();
    }
  }, [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    const res = await loginAdmin(loginEmail, loginPassword, true);
    setIsLoggingIn(false);

    if (res.success && res.admin) {
      setAdminUser(res.admin);
      setIsAuthenticated(true);
      showToast(`Welcome back, ${res.admin.name}`);
      fetchAllData();
    } else {
      setLoginError(res.error || 'Invalid password. Default PIN is 2605.');
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await logoutAdmin();
    setIsAuthenticated(false);
    setAdminUser(null);
    showToast('Logged out of Admin Portal');
  };

  // Handle Image File Upload (PNG Transparent background)
  const processUploadedImageFile = async (file: File) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.png') && file.type !== 'image/png') {
      setImageUploadNotice('Please upload a PNG file with transparent background for clean DTG printing.');
      return;
    }

    setIsUploadingImage(true);
    setImageUploadNotice(null);

    try {
      const uploadRes = await uploadCustomDesignToSupabase(file, 'admin_upload', adminUser?.email);
      if (uploadRes.success && uploadRes.data?.fileUrl) {
        setProductForm((prev) => ({
          ...prev,
          graphicUrl: uploadRes.data!.fileUrl,
          graphicType: 'custom',
        }));
        setImageUploadNotice(`✓ PNG Image loaded (${uploadRes.data.widthPx}x${uploadRes.data.heightPx}px, Transparent)`);
      } else {
        const localUrl = URL.createObjectURL(file);
        setProductForm((prev) => ({
          ...prev,
          graphicUrl: localUrl,
          graphicType: 'custom',
        }));
        setImageUploadNotice('✓ PNG Image loaded from device');
      }
    } catch {
      const localUrl = URL.createObjectURL(file);
      setProductForm((prev) => ({
        ...prev,
        graphicUrl: localUrl,
        graphicType: 'custom',
      }));
      setImageUploadNotice('✓ PNG Image loaded');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Open Create Product Modal
  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      sku: `ANFA-${Math.floor(1000 + Math.random() * 9000)}`,
      price: 799,
      originalPrice: 1299,
      category: 'new-arrival',
      gender: 'unisex',
      badge: 'NEW ARRIVAL',
      description: 'Handcrafted premium 240 GSM bio-washed cotton streetwear t-shirt with high-density print.',
      fabricGsm: 240,
      sizes: ['S', 'M', 'L', 'XL', '2XL'],
      availableColors: [
        { name: 'Pitch Black', hex: '#1E1E24' },
        { name: 'Pure White', hex: '#FFFFFF' },
        { name: 'Navy Blue', hex: '#1A2A44' },
      ],
      shirtColor: '#1E1E24',
      graphicType: 'custom',
      graphicUrl: '',
      isGlowInDark: false,
      isLive: true,
    });
    setImageUploadNotice(null);
    setIsEditProductOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      id: prod.id,
      name: prod.name,
      sku: prod.sku || `SKU-${prod.id}`,
      price: prod.price,
      originalPrice: prod.originalPrice || Math.round(prod.price * 1.5),
      category: prod.category || 'new-arrival',
      gender: prod.gender || 'unisex',
      badge: prod.badge || '',
      description: prod.description || '',
      fabricGsm: 240,
      sizes: prod.sizes || ['S', 'M', 'L', 'XL', '2XL'],
      availableColors: prod.availableColors || [{ name: 'Pitch Black', hex: '#1E1E24' }],
      shirtColor: prod.shirtColor || '#1E1E24',
      graphicType: prod.graphicType || 'custom',
      graphicUrl: prod.graphicUrl || '',
      isGlowInDark: prod.isGlowInDark || false,
      isLive: prod.isLive ?? true,
    });
    setImageUploadNotice(null);
    setIsEditProductOpen(true);
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      showToast('Please enter a product name');
      return;
    }

    try {
      if (editingProduct) {
        // Update existing product
        const res = await updateAdminProduct(editingProduct.id, {
          name: productForm.name,
          sku: productForm.sku,
          price: productForm.price,
          originalPrice: productForm.originalPrice,
          category: productForm.category,
          gender: productForm.gender,
          badge: productForm.badge,
          description: productForm.description,
          sizes: productForm.sizes,
          availableColors: productForm.availableColors,
          shirtColor: productForm.shirtColor,
          graphicType: productForm.graphicType,
          graphicUrl: productForm.graphicUrl,
          isGlowInDark: productForm.isGlowInDark,
          isLive: productForm.isLive,
        });

        if (res.success) {
          setProducts((prev) =>
            prev.map((p) =>
              p.id === editingProduct.id
                ? {
                    ...p,
                    ...productForm,
                    price: Number(productForm.price),
                    originalPrice: Number(productForm.originalPrice),
                  }
                : p
            )
          );
          showToast(`✓ Product "${productForm.name}" updated successfully`);
          setIsEditProductOpen(false);
          if (onRefreshStorefrontCatalog) onRefreshStorefrontCatalog();
        } else {
          showToast(`Error: ${res.error}`);
        }
      } else {
        // Create new product
        const newId = `prod-${Date.now()}`;
        const newProductPayload: Partial<Product> = {
          id: newId,
          sku: productForm.sku || `ANFA-${Math.floor(1000 + Math.random() * 9000)}`,
          name: productForm.name,
          price: Number(productForm.price),
          originalPrice: Number(productForm.originalPrice),
          rating: 5,
          reviewCount: 0,
          image: productForm.graphicUrl || '',
          shirtColor: productForm.shirtColor,
          shirtColorName:
            productForm.availableColors.find((c) => c.hex === productForm.shirtColor)?.name ||
            'Pitch Black',
          category: productForm.category,
          gender: productForm.gender,
          badge: productForm.badge,
          description: productForm.description,
          sizes: productForm.sizes,
          availableColors: productForm.availableColors,
          graphicType: productForm.graphicType || 'custom',
          graphicUrl: productForm.graphicUrl,
          isGlowInDark: productForm.isGlowInDark,
          isLive: productForm.isLive,
        };

        const res = await createAdminProduct(newProductPayload);
        if (res.success && res.product) {
          setProducts((prev) => [res.product!, ...prev]);
        } else {
          setProducts((prev) => [newProductPayload as Product, ...prev]);
        }
        showToast(`✓ New product "${productForm.name}" created!`);
        setIsEditProductOpen(false);
        if (onRefreshStorefrontCatalog) onRefreshStorefrontCatalog();
      }
    } catch (err: any) {
      showToast(`Save failed: ${err.message}`);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (productId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteAdminProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      showToast(`Product "${name}" deleted`);
      if (onRefreshStorefrontCatalog) onRefreshStorefrontCatalog();
    } catch {
      showToast('Failed to delete product');
    }
  };

  // Toggle Live Status
  const handleToggleProductLive = async (product: Product) => {
    const newLive = !product.isLive;
    try {
      await updateAdminProduct(product.id, { isLive: newLive });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isLive: newLive } : p))
      );
      showToast(`Product is now ${newLive ? 'LIVE on Store' : 'HIDDEN (Draft)'}`);
      if (onRefreshStorefrontCatalog) onRefreshStorefrontCatalog();
    } catch {
      showToast('Status update failed');
    }
  };

  // Format Order for Local Supplier
  const getSupplierOrderSlipText = (order: CustomerOrder) => {
    const itemLines = order.items
      .map(
        (i, idx) =>
          `[#${idx + 1}] ${i.name}\n` +
          `   • Garment: 240 GSM Bio-Washed T-Shirt\n` +
          `   • Color: ${i.color || 'Black'}\n` +
          `   • Size: ${i.size}\n` +
          `   • Quantity: ${i.quantity} pcs\n` +
          `   • Print Placement: ${i.printPlacement || 'Front Chest DTG (A3 Size, 300 DPI)'}\n` +
          (i.printFileUrl ? `   • High-Res PNG Artwork: ${i.printFileUrl}\n` : '')
      )
      .join('\n');

    return (
      `*========================================*\n` +
      `*ANFA PRINT WEAR - LOCAL SUPPLIER PRODUCTION SLIP*\n` +
      `*========================================*\n` +
      `Order Reference: ${order.orderNumber || order.id}\n` +
      `Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}\n\n` +
      `*CUSTOMER & SHIPPING DETAILS:*\n` +
      `Customer Name: ${order.customerName}\n` +
      `Phone: ${order.customerPhone}\n` +
      `Address: ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}\n\n` +
      `*PRODUCTION GARMENTS:* \n` +
      `${itemLines}\n\n` +
      `*SPECIAL INSTRUCTIONS:*\n` +
      `1. Use non-crackable eco pigment ink for Direct-to-Garment (DTG) print.\n` +
      `2. Pack in dust-free ANFA polybag with size sticker.\n` +
      `3. Notify store when package is ready for courier pickup.\n` +
      `*========================================*`
    );
  };

  // Copy Supplier Order Text to Clipboard
  const handleCopySupplierSlip = (order: CustomerOrder) => {
    const text = getSupplierOrderSlipText(order);
    navigator.clipboard.writeText(text);
    setSupplierCopied(true);
    showToast('✓ Order slip copied to clipboard! Paste directly into WhatsApp or email.');
    setTimeout(() => setSupplierCopied(false), 2500);
  };

  // Open WhatsApp with Supplier Order Text
  const handleSendWhatsAppToSupplier = (order: CustomerOrder) => {
    const text = getSupplierOrderSlipText(order);
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateAdminOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, qikinkStatus: newStatus as any } : o
        )
      );
      showToast(`Order status updated to: ${newStatus.replace(/_/g, ' ').toUpperCase()}`);
    } catch {
      showToast('Status update failed');
    }
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !productSearch.trim() ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()));
    const matchesCat =
      productCategoryFilter === 'all' || p.category === productCategoryFilter;
    return matchesSearch && matchesCat;
  });

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      !orderSearch.trim() ||
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerPhone.includes(orderSearch);
    const matchesStatus =
      orderStatusFilter === 'all' || o.qikinkStatus === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-neutral-900 text-white rounded-2xl sm:rounded-3xl border border-neutral-800 shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* ========================================================================= */}
        {/* HEADER */}
        {/* ========================================================================= */}
        <div className="px-6 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-['Oswald'] text-lg font-bold uppercase tracking-wider text-white">
                  ANFA Store Admin Command
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-black uppercase">
                  Manual Store Engine
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Manage Products, Customer Logins & Local Supplier Dispatches
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isAuthenticated && (
              <>
                {/* Supabase Live Status Badge */}
                <div
                  className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono"
                  title="Supabase Database Persistent Storage Connected"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-bold">Database Live</span>
                </div>

                <button
                  onClick={fetchAllData}
                  disabled={isLoadingData}
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition text-xs font-semibold flex items-center space-x-1.5"
                  title="Refresh & Sync Data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin text-amber-400' : ''}`} />
                  <span className="hidden md:inline">Sync Data</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center space-x-1.5 transition"
                  title="Log out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BODY (LOGIN OR DASHBOARD) */}
        {/* ========================================================================= */}
        {!isAuthenticated ? (
          /* ===================================================================== */
          /* LOGIN SCREEN */
          /* ===================================================================== */
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center my-auto">
            <div className="w-full max-w-md bg-neutral-950 p-8 rounded-2xl border border-neutral-800 shadow-xl">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="font-['Oswald'] text-xl font-bold uppercase tracking-wider text-white">
                  Owner & Admin Access
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Enter your password to access the manual store dashboard
                </p>
              </div>

              {loginError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Admin Email (Default)
                  </label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-sm text-white focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Password / PIN
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    placeholder="Enter PIN (Default: 2605)"
                    className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-sm text-white focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-black font-['Oswald'] font-bold text-sm uppercase tracking-wider rounded-xl transition flex items-center justify-center space-x-2 shadow-md active:scale-98"
                >
                  {isLoggingIn ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                  <span>{isLoggingIn ? 'Verifying...' : 'Log In to Dashboard'}</span>
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-neutral-800/80 text-center">
                <p className="text-[11px] text-neutral-500">
                  Default PIN: <strong className="text-neutral-300">2605</strong> • Instant Access
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ===================================================================== */
          /* AUTHENTICATED DASHBOARD (3 CLEAN TABS) */
          /* ===================================================================== */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tab Navigation Menu */}
            <div className="px-6 bg-neutral-950/60 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex space-x-2 sm:space-x-4">
                <button
                  onClick={() => setActiveTab('products')}
                  className={`py-3 px-4 border-b-2 font-['Oswald'] font-bold text-xs sm:text-sm uppercase tracking-wider transition flex items-center space-x-2 ${
                    activeTab === 'products'
                      ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Products & Catalog</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-800 text-neutral-300">
                    {products.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('orders')}
                  className={`py-3 px-4 border-b-2 font-['Oswald'] font-bold text-xs sm:text-sm uppercase tracking-wider transition flex items-center space-x-2 ${
                    activeTab === 'orders'
                      ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Orders & Local Suppliers</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400/20 text-amber-400 font-bold">
                    {orders.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('customers')}
                  className={`py-3 px-4 border-b-2 font-['Oswald'] font-bold text-xs sm:text-sm uppercase tracking-wider transition flex items-center space-x-2 ${
                    activeTab === 'customers'
                      ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Customer Logins & Accounts</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-800 text-neutral-300">
                    {authLogs.length}
                  </span>
                </button>
              </div>

              {activeTab === 'products' && (
                <button
                  id="admin-add-product-btn"
                  onClick={handleOpenCreateProduct}
                  className="my-2 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black font-['Oswald'] font-bold text-xs uppercase tracking-wider rounded-xl flex items-center space-x-1.5 transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Product</span>
                </button>
              )}
            </div>

            {/* Tab Content Area */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
              {/* =============================================================== */}
              {/* 1. PRODUCTS TAB */}
              {/* =============================================================== */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  {/* Search and Category Filter Bar */}
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800">
                    <div className="relative w-full sm:w-72">
                      <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Search products by title, SKU..."
                        className="w-full pl-9 pr-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-amber-400"
                      />
                    </div>

                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <select
                        value={productCategoryFilter}
                        onChange={(e) => setProductCategoryFilter(e.target.value)}
                        className="px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-400"
                      >
                        <option value="all">All Categories</option>
                        <option value="new-arrival">New Arrival</option>
                        <option value="best-seller">Best Seller</option>
                        <option value="featured">Featured</option>
                        <option value="dog-lovers">Dog Lovers</option>
                        <option value="traveling">Traveling</option>
                        <option value="summer-special">Summer Special</option>
                        <option value="winter-special">Winter Special</option>
                        <option value="valentines">Valentine's Glow</option>
                      </select>

                      <span className="text-xs text-neutral-400 font-mono">
                        Showing {filteredProducts.length} items
                      </span>
                    </div>
                  </div>

                  {/* Separate Product List */}
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-16 bg-neutral-950/50 rounded-2xl border border-neutral-800">
                      <Package className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-neutral-400">
                        No products match your search.
                      </p>
                      <button
                        onClick={handleOpenCreateProduct}
                        className="mt-3 px-4 py-2 bg-amber-400 text-black rounded-xl text-xs font-bold uppercase tracking-wider font-['Oswald']"
                      >
                        Add Your First Product
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredProducts.map((prod) => (
                        <div
                          key={prod.id}
                          className={`bg-neutral-950 p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                            prod.isLive ? 'border-neutral-800 hover:border-neutral-700' : 'border-dashed border-neutral-800 opacity-70'
                          }`}
                        >
                          <div className="flex space-x-3">
                            {/* Product Mockup Visual */}
                            <div className="w-24 h-24 rounded-xl bg-neutral-900 border border-neutral-800 p-1 flex items-center justify-center shrink-0">
                              <TShirtMockup
                                shirtColor={prod.shirtColor}
                                graphicType={prod.graphicType}
                                graphicUrl={prod.graphicUrl}
                                isGlowInDark={prod.isGlowInDark}
                                className="w-full h-full"
                              />
                            </div>

                            {/* Product Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase truncate">
                                  {prod.sku || `ANFA-${prod.id.slice(0, 5)}`}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                    prod.isLive
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-neutral-800 text-neutral-400'
                                  }`}
                                >
                                  {prod.isLive ? 'Live' : 'Hidden'}
                                </span>
                              </div>

                              <h4 className="font-['Oswald'] text-sm font-bold text-white uppercase truncate">
                                {prod.name}
                              </h4>

                              <div className="flex items-baseline space-x-2 mt-1">
                                <span className="text-base font-['Oswald'] font-bold text-white">
                                  {settings.currencySymbol}
                                  {prod.price}
                                </span>
                                {prod.originalPrice && (
                                  <span className="text-xs text-neutral-500 line-through">
                                    {settings.currencySymbol}
                                    {prod.originalPrice}
                                  </span>
                                )}
                              </div>

                              <div className="text-[11px] text-neutral-400 mt-1 flex flex-wrap gap-1">
                                <span className="px-1.5 py-0.5 bg-neutral-900 rounded">
                                  {prod.category}
                                </span>
                                <span className="px-1.5 py-0.5 bg-neutral-900 rounded uppercase">
                                  {prod.gender || 'unisex'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons for Each Product */}
                          <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                            <button
                              onClick={() => handleToggleProductLive(prod)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition ${
                                prod.isLive
                                  ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                              }`}
                              title={prod.isLive ? 'Hide from storefront' : 'Make live on storefront'}
                            >
                              {prod.isLive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              <span>{prod.isLive ? 'Hide' : 'Set Live'}</span>
                            </button>

                            <div className="flex items-center space-x-1.5">
                              <button
                                onClick={() => handleOpenEditProduct(prod)}
                                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                                <span>Edit</span>
                              </button>

                              <button
                                onClick={() => handleDeleteProduct(prod.id, prod.name)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs transition"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* =============================================================== */}
              {/* 2. ORDERS & LOCAL SUPPLIER DISPATCH TAB */}
              {/* =============================================================== */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  {/* Filter & Search Bar */}
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800">
                    <div className="relative w-full sm:w-72">
                      <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        placeholder="Search orders by name, phone, order #..."
                        className="w-full pl-9 pr-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-amber-400"
                      />
                    </div>

                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <select
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                        className="px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-400"
                      >
                        <option value="all">All Order Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="sent_to_supplier">Sent to Supplier</option>
                        <option value="in_production">In Production / Printing</option>
                        <option value="dispatched">Dispatched</option>
                        <option value="delivered">Delivered</option>
                      </select>

                      <span className="text-xs text-neutral-400 font-mono">
                        {filteredOrders.length} Orders
                      </span>
                    </div>
                  </div>

                  {/* Orders List */}
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-16 bg-neutral-950/50 rounded-2xl border border-neutral-800">
                      <ShoppingBag className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-neutral-400">
                        No customer orders match your search.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredOrders.map((order) => (
                        <div
                          key={order.id}
                          className="bg-neutral-950 p-4 sm:p-5 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition"
                        >
                          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                            {/* Left: Order summary */}
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-['Oswald'] text-base font-bold text-white">
                                  {order.orderNumber || order.id}
                                </span>
                                <span className="text-xs text-neutral-400">
                                  • {new Date(order.createdAt).toLocaleDateString('en-IN')}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-400/10 text-amber-400 border border-amber-400/20">
                                  {order.qikinkStatus.replace(/_/g, ' ')}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-300">
                                <span className="font-semibold text-white flex items-center space-x-1">
                                  <User className="w-3.5 h-3.5 text-neutral-400" />
                                  <span>{order.customerName}</span>
                                </span>
                                <span className="flex items-center space-x-1 text-neutral-400">
                                  <Phone className="w-3.5 h-3.5" />
                                  <span>{order.customerPhone}</span>
                                </span>
                                <span className="flex items-center space-x-1 text-neutral-400">
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span>
                                    {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                                  </span>
                                </span>
                              </div>

                              {/* Items summary */}
                              <div className="pt-2 text-xs text-neutral-400">
                                <strong>Items:</strong>{' '}
                                {order.items.map((it) => `${it.name} (${it.color} / ${it.size} x${it.quantity})`).join(', ')}
                              </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                              {/* Send to Local Supplier Button */}
                              <button
                                onClick={() => setSelectedOrderForSupplier(order)}
                                className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black font-['Oswald'] font-bold text-xs uppercase tracking-wider rounded-xl flex items-center space-x-1.5 transition shadow-sm"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Send to Local Supplier</span>
                              </button>

                              {/* Status update dropdown */}
                              <select
                                value={order.qikinkStatus}
                                onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-400"
                              >
                                <option value="pending">Mark Pending</option>
                                <option value="sent_to_supplier">Sent to Supplier</option>
                                <option value="in_production">In Production / Printing</option>
                                <option value="dispatched">Dispatched</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* =============================================================== */}
              {/* 3. CUSTOMER ACCOUNTS & AUTHENTICATION LOGS TAB */}
              {/* =============================================================== */}
              {activeTab === 'customers' && (
                <div className="space-y-4">
                  <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 flex items-center justify-between">
                    <div>
                      <h3 className="font-['Oswald'] text-base font-bold uppercase tracking-wider text-white">
                        Customer Authentication & Profiles
                      </h3>
                      <p className="text-xs text-neutral-400">
                        Live log of customer sign-ins, registered phone numbers, and active store accounts.
                      </p>
                    </div>
                    <span className="text-xs text-neutral-400 font-mono">
                      {authLogs.length} Total Logs Recorded
                    </span>
                  </div>

                  {authLogs.length === 0 ? (
                    <div className="text-center py-16 bg-neutral-950/50 rounded-2xl border border-neutral-800">
                      <Users className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-neutral-400">
                        No customer authentication logs yet.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">
                        <thead className="bg-neutral-900 text-neutral-400 uppercase font-['Oswald'] tracking-wider">
                          <tr>
                            <th className="p-3">Time</th>
                            <th className="p-3">Customer</th>
                            <th className="p-3">Email / Phone</th>
                            <th className="p-3">Event Type</th>
                            <th className="p-3">Device / Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800 text-neutral-300">
                          {authLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-neutral-900/50">
                              <td className="p-3 text-neutral-400 font-mono whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="p-3 font-semibold text-white">
                                {log.userName || 'Customer User'}
                              </td>
                              <td className="p-3 text-neutral-300 font-mono">
                                {log.userEmail}
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-400/10 text-amber-400">
                                  {log.eventType}
                                </span>
                              </td>
                              <td className="p-3 text-neutral-400">
                                {log.device || 'Desktop Web'} •{' '}
                                <span className="text-emerald-400 font-semibold">Success</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL: MANUAL PRODUCT ADD / EDIT WITH DRAG & DROP PNG UPLOADER */}
        {/* ========================================================================= */}
        {isEditProductOpen && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="bg-neutral-900 text-white rounded-3xl border border-neutral-700 shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
              {/* Header */}
              <div className="px-6 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                  <Package className="w-5 h-5 text-amber-400" />
                  <h3 className="font-['Oswald'] text-lg font-bold uppercase tracking-wider text-white">
                    {editingProduct ? 'Edit Product Details' : 'Add New Custom T-Shirt'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsEditProductOpen(false)}
                  className="w-8 h-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Drag & Drop PNG Uploader & Visualizer */}
                  <div className="lg:col-span-5 space-y-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                      1. Product Artwork / Graphic (PNG with Transparent BG)
                    </label>

                    {/* Drag & Drop Zone */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingImage(true);
                      }}
                      onDragLeave={() => setIsDraggingImage(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingImage(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          processUploadedImageFile(e.dataTransfer.files[0]);
                        }
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center min-h-[160px] ${
                        isDraggingImage
                          ? 'border-amber-400 bg-amber-400/10'
                          : 'border-neutral-700 hover:border-amber-400 bg-neutral-950/60'
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/png"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            processUploadedImageFile(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                      <Upload className="w-8 h-8 text-amber-400 mb-2" />
                      <p className="text-xs font-bold text-white uppercase tracking-wider font-['Oswald']">
                        {isUploadingImage ? 'Uploading & Processing PNG...' : 'Drag & Drop Transparent PNG Here'}
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        or click to browse from device (.png format)
                      </p>
                    </div>

                    {imageUploadNotice && (
                      <p className="text-xs text-amber-400 font-semibold bg-amber-400/10 p-2 rounded-xl border border-amber-400/20">
                        {imageUploadNotice}
                      </p>
                    )}

                    {/* Live T-Shirt Mockup Preview */}
                    <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 flex flex-col items-center">
                      <span className="text-[11px] text-neutral-400 uppercase font-bold tracking-wider mb-2">
                        Live Garment Preview on {productForm.shirtColor}
                      </span>
                      <div className="w-48 h-48 relative flex items-center justify-center">
                        <TShirtMockup
                          shirtColor={productForm.shirtColor}
                          graphicType={productForm.graphicType}
                          graphicUrl={productForm.graphicUrl}
                          isGlowInDark={productForm.isGlowInDark}
                          className="w-full h-full"
                        />
                      </div>

                      {/* Mockup Color Selector for Preview */}
                      <div className="flex gap-2 mt-3">
                        {productForm.availableColors.map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => setProductForm((prev) => ({ ...prev, shirtColor: c.hex }))}
                            className={`w-6 h-6 rounded-full border ${
                              productForm.shirtColor === c.hex ? 'ring-2 ring-amber-400 scale-110' : 'border-neutral-700'
                            }`}
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Specifications Form */}
                  <div className="lg:col-span-7 space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                        Product Title *
                      </label>
                      <input
                        type="text"
                        value={productForm.name}
                        onChange={(e) => setProductForm((prev) => ({ ...prev, name: e.target.value }))}
                        required
                        placeholder="e.g. Tokyo Cyberpunk Oversized Tee"
                        className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white focus:outline-hidden focus:border-amber-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                          SKU Code
                        </label>
                        <input
                          type="text"
                          value={productForm.sku}
                          onChange={(e) => setProductForm((prev) => ({ ...prev, sku: e.target.value }))}
                          placeholder="ANFA-1001"
                          className="w-full px-4 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                          Badge / Tag
                        </label>
                        <input
                          type="text"
                          value={productForm.badge}
                          onChange={(e) => setProductForm((prev) => ({ ...prev, badge: e.target.value }))}
                          placeholder="NEW ARRIVAL / BEST SELLER"
                          className="w-full px-4 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                          Selling Price (₹) *
                        </label>
                        <input
                          type="number"
                          value={productForm.price}
                          onChange={(e) => setProductForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                          required
                          className="w-full px-4 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white font-bold focus:outline-hidden focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                          MRP Strike Price (₹)
                        </label>
                        <input
                          type="number"
                          value={productForm.originalPrice}
                          onChange={(e) => setProductForm((prev) => ({ ...prev, originalPrice: Number(e.target.value) }))}
                          className="w-full px-4 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-neutral-400 focus:outline-hidden focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                          Fabric GSM
                        </label>
                        <input
                          type="number"
                          value={productForm.fabricGsm}
                          onChange={(e) => setProductForm((prev) => ({ ...prev, fabricGsm: Number(e.target.value) }))}
                          className="w-full px-4 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                          Category
                        </label>
                        <select
                          value={productForm.category}
                          onChange={(e) => setProductForm((prev) => ({ ...prev, category: e.target.value }))}
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-400"
                        >
                          <option value="new-arrival">New Arrival</option>
                          <option value="best-seller">Best Seller</option>
                          <option value="featured">Featured</option>
                          <option value="dog-lovers">Dog Lovers</option>
                          <option value="traveling">Traveling</option>
                          <option value="summer-special">Summer Special</option>
                          <option value="winter-special">Winter Special</option>
                          <option value="valentines">Valentine's Glow</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                          Gender
                        </label>
                        <select
                          value={productForm.gender}
                          onChange={(e) => setProductForm((prev) => ({ ...prev, gender: e.target.value as any }))}
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-400"
                        >
                          <option value="unisex">Unisex</option>
                          <option value="men">Men's</option>
                          <option value="women">Women's</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                        Product Description
                      </label>
                      <textarea
                        rows={3}
                        value={productForm.description}
                        onChange={(e) => setProductForm((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Detailed fabric specs, wash care instructions, styling notes..."
                        className="w-full px-4 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-400"
                      />
                    </div>

                    {/* Sizes checkboxes */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                        Available Sizes
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['S', 'M', 'L', 'XL', '2XL', '3XL'].map((s) => {
                          const isChecked = productForm.sizes.includes(s);
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                setProductForm((prev) => ({
                                  ...prev,
                                  sizes: isChecked
                                    ? prev.sizes.filter((sz) => sz !== s)
                                    : [...prev.sizes, s],
                                }));
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-['Oswald'] transition ${
                                isChecked
                                  ? 'bg-amber-400 text-black'
                                  : 'bg-neutral-950 text-neutral-400 border border-neutral-700'
                              }`}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Glow & Live Toggles */}
                    <div className="flex items-center space-x-6 pt-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={productForm.isLive}
                          onChange={(e) => setProductForm((prev) => ({ ...prev, isLive: e.target.checked }))}
                          className="rounded text-amber-400 focus:ring-0"
                        />
                        <span className="text-xs font-bold uppercase tracking-wider text-white">
                          Publish Live on Store
                        </span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={productForm.isGlowInDark}
                          onChange={(e) => setProductForm((prev) => ({ ...prev, isGlowInDark: e.target.checked }))}
                          className="rounded text-emerald-400 focus:ring-0"
                        />
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Glow in Dark Ink</span>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Submit & Cancel Buttons */}
                <div className="pt-4 border-t border-neutral-800 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditProductOpen(false)}
                    className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-['Oswald'] font-bold text-xs uppercase tracking-wider rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-black font-['Oswald'] font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-md flex items-center space-x-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingProduct ? 'Save Changes' : 'Create Product'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL: LOCAL SUPPLIER ORDER DISPATCH SLIP */}
        {/* ========================================================================= */}
        {selectedOrderForSupplier && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="bg-neutral-900 text-white rounded-3xl border border-neutral-700 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
              <div className="px-6 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                  <Send className="w-5 h-5 text-amber-400" />
                  <h3 className="font-['Oswald'] text-lg font-bold uppercase tracking-wider text-white">
                    Send Order to Local Supplier / DTG Vendor
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedOrderForSupplier(null)}
                  className="w-8 h-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <p className="text-xs text-neutral-300">
                  Formatted work order ready to send to your local Kolkata printing vendor, tailor, or screen printer.
                </p>

                {/* Pre-formatted Work Order Slip Box */}
                <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 font-mono text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap select-all">
                  {getSupplierOrderSlipText(selectedOrderForSupplier)}
                </div>

                {/* Action Buttons: WhatsApp & Copy */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => handleSendWhatsAppToSupplier(selectedOrderForSupplier)}
                    className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-['Oswald'] font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center space-x-2 shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Send on WhatsApp</span>
                  </button>

                  <button
                    onClick={() => handleCopySupplierSlip(selectedOrderForSupplier)}
                    className="py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-white font-['Oswald'] font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center space-x-2 border border-neutral-700"
                  >
                    {supplierCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{supplierCopied ? 'Copied Slip!' : 'Copy Order Text'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-70 bg-neutral-900 text-white border border-neutral-700 px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold flex items-center space-x-2 animate-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
