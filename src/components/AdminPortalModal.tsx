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
  Maximize2,
  Sliders,
  Palette,
  Ruler,
  Tag,
  Flame,
  Shirt,
  Image as ImageIcon,
} from 'lucide-react';
import {
  AdminUser,
  AdminStats,
  AuthEventLog,
  Product,
  StandardPrintDimension,
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
import { uploadCustomDesignToSupabase } from '../lib/supabase';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  onRefreshStorefrontCatalog?: (updatedCatalog?: Product[]) => void;
}

type SimpleAdminTab = 'products' | 'orders' | 'customers';

const GARMENT_COLOR_PALETTE = [
  { name: 'Pitch Black', hex: '#1E1E24' },
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Navy Blue', hex: '#1A2A44' },
  { name: 'Crimson Red', hex: '#991B1B' },
  { name: 'Bottle Green', hex: '#064E3B' },
  { name: 'Charcoal Grey', hex: '#374151' },
  { name: 'Royal Blue', hex: '#1D4ED8' },
  { name: 'Sand Beige', hex: '#D4C5B9' },
  { name: 'Maroon', hex: '#7F1D1D' },
  { name: 'Mustard Yellow', hex: '#D97706' },
  { name: 'Lavender Violet', hex: '#9B8BB4' },
  { name: 'Acid Dark Wash', hex: '#2B2D42' },
];

const PRESET_ARTWORKS = [
  { label: 'Tokyo Cyberpunk', type: 'graphic-tokyo', url: '' },
  { label: 'Cyber Skater', type: 'skate-graphic', url: '' },
  { label: 'Eat My Dust Racer', type: 'eat-my-dust', url: '' },
  { label: 'Retro Wave Cassette', type: 'cassette-graphic', url: '' },
  { label: 'Botanical Wreath', type: 'floral-wreath', url: '' },
  { label: 'Mountain Sunset', type: 'mountain-graphic', url: '' },
  { label: 'Texas Strong', type: 'texas-graphic', url: '' },
  { label: 'Frenchie Dog Lover', type: 'dog-graphic', url: '' },
];

const PRINT_DIMENSION_OPTIONS: {
  id: StandardPrintDimension;
  label: string;
  sublabel: string;
  aspect: string;
  recommended: string;
}[] = [
  {
    id: '8x11',
    label: '8 × 11 Inches',
    sublabel: 'Standard Medium Chest / A4',
    aspect: '2400 × 3300 px (300 DPI)',
    recommended: 'Ideal for chest prints, logo graphics, center badge designs',
  },
  {
    id: '11x16',
    label: '11 × 16 Inches (Standard)',
    sublabel: 'Oversized Front / A3 Print',
    aspect: '3300 × 4800 px (300 DPI)',
    recommended: 'Standard oversized streetwear graphics & full torso illustrations',
  },
  {
    id: '11x18',
    label: '11 × 18 Inches',
    sublabel: 'Streetwear Max / Full Length',
    aspect: '3300 × 5400 px (300 DPI)',
    recommended: 'Max length tall graphic prints & high-impact vertical art',
  },
];

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  isOpen,
  onClose,
  settings,
  onRefreshStorefrontCatalog,
}) => {
  // Authentication State (Email is pre-filled and hidden as requested; password defaults to 2907)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(getStoredAdminUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getStoredAdminToken());
  const [loginEmail] = useState('abdulraheem18822@gmail.com');
  const [loginPassword, setLoginPassword] = useState('2907');
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
    fabricComposition: string;
    fitType: string;
    printTechnique: string;
    qualityGrade: string;
    printDimension: StandardPrintDimension;
    sizes: string[];
    availableColors: { name: string; hex: string }[];
    shirtColor: string;
    graphicType: string;
    graphicUrl: string;
    mockupUrl?: string;
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
    description: 'Premium heavyweight cotton streetwear t-shirt with 300 DPI high-density print and bio-wash softness.',
    fabricGsm: 240,
    fabricComposition: '100% Super-Combed Bio-Washed Organic Cotton',
    fitType: 'oversized',
    printTechnique: 'Direct-to-Garment (DTG) 300 DPI Eco Pigment',
    qualityGrade: 'Export Quality Grade A+',
    printDimension: '11x16',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    availableColors: [
      { name: 'Pitch Black', hex: '#1E1E24' },
      { name: 'Pure White', hex: '#FFFFFF' },
      { name: 'Navy Blue', hex: '#1A2A44' },
    ],
    shirtColor: '#1E1E24',
    graphicType: 'custom',
    graphicUrl: '',
    mockupUrl: '',
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

  // Handle Login Submit (Using default email and entered PIN / password)
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
      setLoginError(res.error || 'Invalid password. Password is 2907.');
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
      description: 'Handcrafted premium 240 GSM bio-washed cotton streetwear t-shirt with 300 DPI high-density direct-to-garment print.',
      fabricGsm: 240,
      fabricComposition: '100% Super-Combed Bio-Washed Organic Cotton',
      fitType: 'oversized',
      printTechnique: 'Direct-to-Garment (DTG) 300 DPI Eco Pigment',
      qualityGrade: 'Export Quality Grade A+',
      printDimension: '11x16',
      sizes: ['S', 'M', 'L', 'XL', '2XL'],
      availableColors: [
        { name: 'Pitch Black', hex: '#1E1E24' },
        { name: 'Pure White', hex: '#FFFFFF' },
        { name: 'Navy Blue', hex: '#1A2A44' },
      ],
      shirtColor: '#1E1E24',
      graphicType: 'custom',
      graphicUrl: '',
      mockupUrl: '',
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
      fabricGsm: prod.fabricGsm || 240,
      fabricComposition: prod.fabricComposition || '100% Super-Combed Bio-Washed Organic Cotton',
      fitType: prod.fitType || 'oversized',
      printTechnique: prod.printTechnique || 'Direct-to-Garment (DTG) 300 DPI Eco Pigment',
      qualityGrade: prod.qualityGrade || 'Export Quality Grade A+',
      printDimension: (prod.printDimension as StandardPrintDimension) || '11x16',
      sizes: prod.sizes || ['S', 'M', 'L', 'XL', '2XL'],
      availableColors: prod.availableColors && prod.availableColors.length > 0
        ? prod.availableColors
        : [{ name: 'Pitch Black', hex: '#1E1E24' }, { name: 'Pure White', hex: '#FFFFFF' }],
      shirtColor: prod.shirtColor || '#1E1E24',
      graphicType: prod.graphicType || 'custom',
      graphicUrl: prod.graphicUrl || prod.image || '',
      mockupUrl: prod.image || '',
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
        const updatedPayload = {
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
          printDimension: productForm.printDimension,
          sizes: productForm.sizes,
          availableColors: productForm.availableColors,
          shirtColor: productForm.shirtColor,
          graphicType: productForm.graphicType,
          graphicUrl: productForm.graphicUrl,
          image: productForm.graphicUrl || productForm.mockupUrl || '',
          isGlowInDark: productForm.isGlowInDark,
          isLive: productForm.isLive,
        };

        const res = await updateAdminProduct(editingProduct.id, updatedPayload);

        const newProductsList = products.map((p) =>
          p.id === editingProduct.id ? { ...p, ...updatedPayload } : p
        );
        setProducts(newProductsList);

        showToast(`✓ Product "${productForm.name}" updated and live!`);
        setIsEditProductOpen(false);
        if (onRefreshStorefrontCatalog) onRefreshStorefrontCatalog(newProductsList);
      } else {
        // Create new product (Auto-Live on Website)
        const newId = `prod-${Date.now()}`;
        const newProductPayload: Partial<Product> = {
          id: newId,
          sku: productForm.sku || `ANFA-${Math.floor(1000 + Math.random() * 9000)}`,
          name: productForm.name,
          price: Number(productForm.price),
          originalPrice: Number(productForm.originalPrice),
          rating: 5,
          reviewCount: 0,
          image: productForm.graphicUrl || productForm.mockupUrl || '',
          shirtColor: productForm.shirtColor,
          shirtColorName:
            productForm.availableColors.find((c) => c.hex === productForm.shirtColor)?.name ||
            GARMENT_COLOR_PALETTE.find((c) => c.hex === productForm.shirtColor)?.name ||
            'Pitch Black',
          category: productForm.category,
          gender: productForm.gender,
          badge: productForm.badge,
          description: productForm.description,
          fabricGsm: Number(productForm.fabricGsm),
          fabricComposition: productForm.fabricComposition,
          fitType: productForm.fitType,
          printTechnique: productForm.printTechnique,
          qualityGrade: productForm.qualityGrade,
          printDimension: productForm.printDimension,
          sizes: productForm.sizes,
          availableColors: productForm.availableColors,
          graphicType: productForm.graphicType || 'custom',
          graphicUrl: productForm.graphicUrl,
          isGlowInDark: productForm.isGlowInDark,
          isLive: true, // Always automatically live on website
        };

        const res = await createAdminProduct(newProductPayload);
        const createdProduct = (res.success && res.product) ? res.product : (newProductPayload as Product);
        const newProductsList = [createdProduct, ...products];
        setProducts(newProductsList);

        showToast(`✓ New product "${productForm.name}" is now live in category "${productForm.category}"!`);
        setIsEditProductOpen(false);
        if (onRefreshStorefrontCatalog) onRefreshStorefrontCatalog(newProductsList);
      }
    } catch (err: any) {
      showToast(`Save failed: ${err.message}`);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    const res = await deleteAdminProduct(id);
    if (res.success) {
      const updated = products.filter((p) => p.id !== id);
      setProducts(updated);
      showToast(`✓ Product "${name}" removed`);
      if (onRefreshStorefrontCatalog) onRefreshStorefrontCatalog(updated);
    } else {
      showToast(`Delete failed: ${res.error}`);
    }
  };

  // Toggle Product Live Visibility
  const handleToggleLive = async (prod: Product) => {
    const nextLive = !prod.isLive;
    const res = await updateAdminProduct(prod.id, { isLive: nextLive });
    if (res.success) {
      const updated = products.map((p) =>
        p.id === prod.id ? { ...p, isLive: nextLive } : p
      );
      setProducts(updated);
      showToast(`✓ Product is now ${nextLive ? 'LIVE on website' : 'HIDDEN from website'}`);
      if (onRefreshStorefrontCatalog) onRefreshStorefrontCatalog(updated);
    }
  };

  // Handle Order Status Change
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: CustomerOrder['qikinkStatus']) => {
    const res = await updateAdminOrderStatus(orderId, nextStatus);
    if (res.success) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId || o.orderNumber === orderId ? { ...o, qikinkStatus: nextStatus } : o))
      );
      showToast(`✓ Order status updated to: ${nextStatus.toUpperCase()}`);
    }
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCat = productCategoryFilter === 'all' || p.category === productCategoryFilter;
    return matchesSearch && matchesCat;
  });

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerPhone.includes(orderSearch);
    const matchesStatus = orderStatusFilter === 'all' || o.qikinkStatus === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Generate WhatsApp / Email Format for Supplier Dispatch
  const generateSupplierDispatchText = (order: CustomerOrder) => {
    const lines = [
      `📦 *ANFA PRINT WEAR - LOCAL SUPPLIER DISPATCH ORDER*`,
      `*Order Ref:* #${order.orderNumber}`,
      `*Date:* ${new Date(order.createdAt).toLocaleDateString('en-IN')}`,
      `-----------------------------------------`,
      `👤 *CUSTOMER SHIPPING DETAILS:*`,
      `Name: ${order.customerName}`,
      `Phone: ${order.customerPhone}`,
      `Email: ${order.customerEmail}`,
      `Address: ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`,
      `-----------------------------------------`,
      `👕 *MANUFACTURING & PRINT SPECIFICATIONS:*`,
    ];

    order.items.forEach((item, idx) => {
      lines.push(
        `${idx + 1}. *${item.name}* (Qty: ${item.quantity})`,
        `   • Size: ${item.size} | Garment Color: ${item.color}`,
        `   • Print Placement: ${item.printPlacement || 'Front Chest'}`,
        `   • Print File / Artwork: ${item.printFileUrl || 'Standard ANFA Graphic'}`,
        `   • Fabric: 240 GSM Super-Combed Bio-Washed Cotton`,
        `   • Notes: ${item.customNotes || 'Direct DTG Pigment High Density'}`
      );
    });

    lines.push(
      `-----------------------------------------`,
      `💰 *Total Amount:* ₹${order.totalAmount}`,
      `*Current Status:* ${order.qikinkStatus.toUpperCase()}`,
      `-----------------------------------------`,
      `📍 *Dispatched from:* ANFA Print Wear Studio, Nilofar Complex, Main Road, Bhainsa, Telangana`
    );

    return lines.join('\n');
  };

  const copySupplierOrderText = (order: CustomerOrder) => {
    const text = generateSupplierDispatchText(order);
    navigator.clipboard.writeText(text);
    setSupplierCopied(true);
    showToast('✓ Supplier dispatch specs copied to clipboard!');
    setTimeout(() => setSupplierCopied(false), 2500);
  };

  const openWhatsAppSupplier = (order: CustomerOrder) => {
    const text = encodeURIComponent(generateSupplierDispatchText(order));
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-60 bg-neutral-900 border border-amber-400/60 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="relative w-full max-w-7xl max-h-[95vh] bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-neutral-100">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-['Oswald'] font-black text-lg shadow-md">
              A
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-['Oswald'] text-lg sm:text-xl font-bold uppercase tracking-wider text-white">
                  ANFA Store Owner Portal
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase">
                  Manual Control Center
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Direct catalog management, custom PNG upload, and order dispatch
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isAuthenticated && adminUser && (
              <div className="hidden sm:flex items-center space-x-2 text-xs text-neutral-300 bg-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-800">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold">{adminUser.name}</span>
                <span className="text-neutral-500">|</span>
                <span className="text-emerald-400">Super Admin</span>
              </div>
            )}

            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
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
        {!isAuthenticated ? (
          /* ===================================================================== */
          /* LOGIN SCREEN (Email is hidden; only security PIN/password is required) */
          /* ===================================================================== */
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center my-auto">
            <div className="w-full max-w-md bg-neutral-950 p-8 rounded-3xl border border-neutral-800 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-7 h-7" />
                </div>
                <h3 className="font-['Oswald'] text-2xl font-bold uppercase tracking-wider text-white">
                  Store Owner Access
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Enter your master password to access the manual store dashboard
                </p>
              </div>

              {loginError && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                    Security Password / PIN
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      placeholder="Enter Password (PIN: 2907)"
                      className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-2xl text-sm text-white font-mono tracking-widest focus:outline-hidden focus:border-amber-400"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500">
                      <Shield className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-black font-['Oswald'] font-bold text-sm uppercase tracking-wider rounded-2xl transition flex items-center justify-center space-x-2 shadow-lg active:scale-98"
                >
                  {isLoggingIn ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                  <span>{isLoggingIn ? 'Verifying Password...' : 'Log In to Dashboard'}</span>
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-neutral-800/80 text-center">
                <p className="text-[12px] text-neutral-400">
                  Store Owner PIN: <strong className="text-amber-400 font-mono">2907</strong>
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ===================================================================== */
          /* AUTHENTICATED DASHBOARD (3 CLEAN TABS: PRODUCTS, ORDERS, CUSTOMERS)  */
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
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-800 text-neutral-300">
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
                  <span>Customer Accounts</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-800 text-neutral-300">
                    {authLogs.length}
                  </span>
                </button>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={fetchAllData}
                  disabled={isLoadingData}
                  className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition"
                  title="Refresh Data"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* TAB CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* ============================================================= */}
              {/* TAB 1: PRODUCTS & CATALOG                                    */}
              {/* ============================================================= */}
              {activeTab === 'products' && (
                <div className="space-y-6">
                  {/* Action Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
                    <div className="flex flex-1 items-center space-x-3">
                      <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Search products by title, SKU, or category..."
                          className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-amber-400"
                        />
                      </div>

                      <select
                        value={productCategoryFilter}
                        onChange={(e) => setProductCategoryFilter(e.target.value)}
                        className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-400"
                      >
                        <option value="all">All Categories</option>
                        <option value="new-arrival">New Arrivals</option>
                        <option value="best-seller">Best Sellers</option>
                        <option value="featured">Featured</option>
                        <option value="dog-lovers">Dog Lovers</option>
                        <option value="traveling">Traveling</option>
                        <option value="summer-special">Summer Special</option>
                        <option value="winter-special">Winter Special</option>
                        <option value="valentines">Valentine's Glow</option>
                      </select>
                    </div>

                    <button
                      onClick={handleOpenCreateProduct}
                      className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-black font-['Oswald'] font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center space-x-2 shadow-md active:scale-95 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Product Manually</span>
                    </button>
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className="bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-4 transition flex flex-col justify-between space-y-3"
                      >
                        <div className="flex space-x-3">
                          {/* Garment Preview Thumbnail */}
                          <div className="w-20 h-20 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-center p-1 shrink-0 relative overflow-hidden">
                            <TShirtMockup
                              shirtColor={prod.shirtColor || '#1E1E24'}
                              graphicType={prod.graphicType}
                              graphicUrl={prod.graphicUrl || prod.image}
                              printDimension={prod.printDimension}
                              isGlowInDark={prod.isGlowInDark}
                              className="w-full h-full"
                            />
                            {prod.isGlowInDark && (
                              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Glow in dark" />
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                                {prod.sku || `ANFA-${prod.id.slice(-4)}`}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  prod.isLive
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                                }`}
                              >
                                {prod.isLive ? '● Live' : '○ Draft'}
                              </span>
                            </div>

                            <h4 className="font-['Oswald'] font-bold text-sm text-white uppercase tracking-wider truncate mt-1">
                              {prod.name}
                            </h4>

                            <div className="flex items-center space-x-2 mt-1">
                              <span className="font-bold text-amber-400 text-xs">
                                ₹{prod.price}
                              </span>
                              {prod.originalPrice && (
                                <span className="text-[10px] text-neutral-400 line-through">
                                  ₹{prod.originalPrice}
                                </span>
                              )}
                              <span className="text-[10px] text-neutral-400 uppercase bg-neutral-900 px-1.5 py-0.5 rounded">
                                {prod.category}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2 mt-1.5 text-[11px] text-neutral-400">
                              <span>Print: {prod.printDimension ? (prod.printDimension === '8x11' ? '8x11"' : prod.printDimension === '11x18' ? '11x18"' : '11x16"') : '11x16"'}</span>
                              <span>•</span>
                              <span>{prod.sizes?.length || 5} Sizes</span>
                            </div>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                          <button
                            onClick={() => handleToggleLive(prod)}
                            className={`text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center space-x-1.5 transition ${
                              prod.isLive
                                ? 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                                : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                            }`}
                          >
                            {prod.isLive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span>{prod.isLive ? 'Hide from Store' : 'Set Live'}</span>
                          </button>

                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleOpenEditProduct(prod)}
                              className="p-1.5 bg-neutral-900 hover:bg-neutral-800 text-amber-400 rounded-lg border border-neutral-800 transition"
                              title="Edit Product"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id, prod.name)}
                              className="p-1.5 bg-neutral-900 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-neutral-800 transition"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredProducts.length === 0 && (
                    <div className="text-center py-12 bg-neutral-950 rounded-2xl border border-neutral-800 p-6">
                      <Package className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-neutral-400">No products found matching your search</p>
                      <button
                        onClick={handleOpenCreateProduct}
                        className="mt-3 px-4 py-2 bg-amber-400 text-black text-xs font-bold font-['Oswald'] uppercase rounded-xl"
                      >
                        Add First Product
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================= */}
              {/* TAB 2: ORDERS & LOCAL SUPPLIERS                               */}
              {/* ============================================================= */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  {/* Order Filter Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
                    <div className="flex flex-1 items-center space-x-3">
                      <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={orderSearch}
                          onChange={(e) => setOrderSearch(e.target.value)}
                          placeholder="Search orders by customer name, phone, or order #..."
                          className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-amber-400"
                        />
                      </div>

                      <select
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-400"
                      >
                        <option value="all">All Statuses</option>
                        <option value="received">Received / New</option>
                        <option value="sent_to_qikink">Sent to Supplier</option>
                        <option value="printed">Printed</option>
                        <option value="dispatched">Dispatched</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </div>

                    <div className="text-xs text-neutral-400 font-medium">
                      Total Orders: <strong className="text-white">{filteredOrders.length}</strong>
                    </div>
                  </div>

                  {/* Orders List */}
                  <div className="space-y-3">
                    {filteredOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-5 transition space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-800">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-['Oswald'] font-bold text-base text-amber-400">
                                #{ord.orderNumber}
                              </span>
                              <span className="text-xs text-neutral-400">
                                • {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-300 font-semibold mt-0.5">
                              {ord.customerName} ({ord.customerPhone}) • {ord.shippingAddress.city}, {ord.shippingAddress.state}
                            </p>
                          </div>

                          <div className="flex items-center space-x-2">
                            <select
                              value={ord.qikinkStatus}
                              onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as any)}
                              className="px-3 py-1 bg-neutral-900 border border-neutral-700 rounded-lg text-xs font-bold text-amber-400 focus:outline-hidden"
                            >
                              <option value="received">Received / New</option>
                              <option value="sent_to_qikink">Sent to Supplier</option>
                              <option value="printed">Printed / Ready</option>
                              <option value="dispatched">Dispatched</option>
                              <option value="delivered">Delivered</option>
                            </select>

                            <button
                              onClick={() => setSelectedOrderForSupplier(ord)}
                              className="px-3 py-1 bg-amber-400 hover:bg-amber-500 text-black font-['Oswald'] font-bold text-xs uppercase rounded-lg transition flex items-center space-x-1"
                            >
                              <Send className="w-3 h-3" />
                              <span>Dispatch Specs</span>
                            </button>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {ord.items.map((it, idx) => (
                            <div
                              key={idx}
                              className="bg-neutral-900/80 p-3 rounded-xl border border-neutral-800 text-xs flex items-center space-x-3"
                            >
                              <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center font-bold text-amber-400 shrink-0">
                                {it.size}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-white truncate">{it.name}</p>
                                <p className="text-[11px] text-neutral-400">
                                  Color: {it.color} • Qty: {it.quantity} • ₹{it.price}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {filteredOrders.length === 0 && (
                      <div className="text-center py-12 bg-neutral-950 rounded-2xl border border-neutral-800 p-6">
                        <ShoppingBag className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-neutral-400">No orders found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ============================================================= */}
              {/* TAB 3: CUSTOMER ACCOUNTS & AUTH LOGS                          */}
              {/* ============================================================= */}
              {activeTab === 'customers' && (
                <div className="space-y-6">
                  <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800">
                    <h3 className="font-['Oswald'] text-base font-bold uppercase tracking-wider text-white mb-4 flex items-center space-x-2">
                      <Users className="w-4 h-4 text-amber-400" />
                      <span>Customer Sign-in & Authentication Activity</span>
                    </h3>

                    <div className="space-y-3">
                      {authLogs.map((log) => (
                        <div
                          key={log.id}
                          className="p-3.5 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-amber-400 font-bold">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-white">{log.email}</p>
                              <p className="text-[11px] text-neutral-400">
                                {log.eventType.toUpperCase()} • {new Date(log.timestamp).toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              log.status === 'success'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {log.status.toUpperCase()}
                          </span>
                        </div>
                      ))}

                      {authLogs.length === 0 && (
                        <p className="text-neutral-500 text-xs text-center py-6">
                          No recent customer login events recorded.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL: ADD / EDIT PRODUCT                                                 */}
        {/* ========================================================================= */}
        {isEditProductOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md">
            <div className="relative w-full max-w-5xl max-h-[92vh] bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-neutral-100">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-400 text-black flex items-center justify-center font-bold">
                    <Shirt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-['Oswald'] text-base sm:text-lg font-bold uppercase tracking-wider text-white">
                      {editingProduct ? 'Edit Product Details' : 'Add New Product Manually'}
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Standard print dimensions, transparent PNG artwork & quality specs
                    </p>
                  </div>
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
                  {/* Left Column: Artwork Upload & Garment Mockup Visualizer */}
                  <div className="lg:col-span-5 space-y-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5 flex items-center space-x-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>1. Product Artwork (Transparent PNG)</span>
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
                        className={`border-2 border-dashed rounded-2xl p-5 text-center transition cursor-pointer flex flex-col items-center justify-center min-h-[140px] ${
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
                        <Upload className="w-7 h-7 text-amber-400 mb-1.5" />
                        <p className="text-xs font-bold text-white uppercase tracking-wider font-['Oswald']">
                          {isUploadingImage ? 'Uploading PNG...' : 'Drag & Drop Transparent PNG Here'}
                        </p>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          or click to browse (.png format)
                        </p>
                      </div>

                      {imageUploadNotice && (
                        <p className="mt-2 text-xs text-amber-400 font-semibold bg-amber-400/10 p-2 rounded-xl border border-amber-400/20">
                          {imageUploadNotice}
                        </p>
                      )}
                    </div>

                    {/* Direct Image / Mockup URL Option */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                        Direct Artwork / Mockup Image URL
                      </label>
                      <input
                        type="url"
                        value={productForm.graphicUrl}
                        onChange={(e) =>
                          setProductForm((prev) => ({
                            ...prev,
                            graphicUrl: e.target.value,
                            graphicType: 'custom',
                          }))
                        }
                        placeholder="https://images.unsplash.com/... or PNG URL"
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-400"
                      />
                    </div>

                    {/* Preset Graphic Selector */}
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                        Or Pick a Preset Studio Artwork
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {PRESET_ARTWORKS.map((preset) => (
                          <button
                            key={preset.type}
                            type="button"
                            onClick={() =>
                              setProductForm((prev) => ({
                                ...prev,
                                graphicType: preset.type,
                                graphicUrl: '',
                              }))
                            }
                            className={`p-2 rounded-xl text-[11px] font-bold text-left transition truncate ${
                              productForm.graphicType === preset.type && !productForm.graphicUrl
                                ? 'bg-amber-400 text-black'
                                : 'bg-neutral-950 text-neutral-300 border border-neutral-800 hover:border-neutral-700'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Live T-Shirt Mockup Preview */}
                    <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 flex flex-col items-center">
                      <div className="w-full flex items-center justify-between mb-2">
                        <span className="text-[11px] text-amber-400 uppercase font-bold tracking-wider">
                          Live Garment Mockup
                        </span>
                        <span className="text-[10px] text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                          {productForm.printDimension} Print
                        </span>
                      </div>

                      <div className="w-52 h-52 relative flex items-center justify-center">
                        <TShirtMockup
                          shirtColor={productForm.shirtColor}
                          graphicType={productForm.graphicType}
                          graphicUrl={productForm.graphicUrl}
                          printDimension={productForm.printDimension}
                          isGlowInDark={productForm.isGlowInDark}
                          className="w-full h-full"
                        />
                      </div>

                      {/* Design Color Selector for Mockup */}
                      <div className="w-full mt-3 pt-3 border-t border-neutral-800">
                        <span className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 text-center">
                          Select T-Shirt Base Color to Design:
                        </span>
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          {GARMENT_COLOR_PALETTE.map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              onClick={() => setProductForm((prev) => ({ ...prev, shirtColor: c.hex }))}
                              className={`w-6 h-6 rounded-full border transition ${
                                productForm.shirtColor === c.hex
                                  ? 'ring-2 ring-amber-400 scale-125 border-white'
                                  : 'border-neutral-700 hover:scale-110'
                              }`}
                              style={{ backgroundColor: c.hex }}
                              title={`${c.name} (${c.hex})`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Standard Sizes, Dimensions & Product Details */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* Basic Info */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                        Product Title *
                      </label>
                      <input
                        type="text"
                        value={productForm.name}
                        onChange={(e) => setProductForm((prev) => ({ ...prev, name: e.target.value }))}
                        required
                        placeholder="e.g. Acid Wash 240 GSM Oversized Heavyweight Tee"
                        className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white focus:outline-hidden focus:border-amber-400"
                      />
                    </div>

                    {/* Standard Print Dimensions (3 Options) */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5 flex items-center space-x-1.5">
                        <Ruler className="w-3.5 h-3.5" />
                        <span>Standard Print Dimensions (3 Options Available) *</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {PRINT_DIMENSION_OPTIONS.map((opt) => {
                          const isSelected = productForm.printDimension === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setProductForm((prev) => ({ ...prev, printDimension: opt.id }))}
                              className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                                isSelected
                                  ? 'bg-amber-400/10 border-amber-400 text-white shadow-md'
                                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="font-['Oswald'] font-bold text-xs uppercase text-amber-400">
                                    {opt.label}
                                  </span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                                </div>
                                <p className="text-[10px] font-semibold text-neutral-300 mt-0.5">
                                  {opt.sublabel}
                                </p>
                              </div>
                              <p className="text-[9px] text-neutral-400 mt-1">
                                {opt.aspect}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Pricing and GSM */}
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
                        <select
                          value={productForm.fabricGsm}
                          onChange={(e) => setProductForm((prev) => ({ ...prev, fabricGsm: Number(e.target.value) }))}
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-400"
                        >
                          <option value={180}>180 GSM (Lightweight Daily)</option>
                          <option value={220}>220 GSM (Standard Streetwear)</option>
                          <option value={240}>240 GSM (Heavyweight Bio-Washed)</option>
                          <option value={280}>280 GSM (French Terry Luxury)</option>
                        </select>
                      </div>
                    </div>

                    {/* Category & Gender */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                          Target Category *
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
                          Fit Type
                        </label>
                        <select
                          value={productForm.fitType}
                          onChange={(e) => setProductForm((prev) => ({ ...prev, fitType: e.target.value }))}
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-400"
                        >
                          <option value="oversized">Oversized Streetwear (Drop Shoulder)</option>
                          <option value="regular">Regular Everyday Fit</option>
                          <option value="boxy">Boxy Heavyweight Cut</option>
                          <option value="relaxed">Relaxed Unisex Fit</option>
                        </select>
                      </div>
                    </div>

                    {/* Quality & Fabric Specifications */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                          Fabric Composition
                        </label>
                        <input
                          type="text"
                          value={productForm.fabricComposition}
                          onChange={(e) => setProductForm((prev) => ({ ...prev, fabricComposition: e.target.value }))}
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                          Print Technique
                        </label>
                        <input
                          type="text"
                          value={productForm.printTechnique}
                          onChange={(e) => setProductForm((prev) => ({ ...prev, printTechnique: e.target.value }))}
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-400"
                        />
                      </div>
                    </div>

                    {/* Garment Size Selection */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                          Garment Sizes (Customer Options)
                        </label>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => setProductForm((prev) => ({ ...prev, sizes: ['S', 'M', 'L', 'XL', '2XL'] }))}
                            className="text-[10px] text-amber-400 hover:underline"
                          >
                            Standard (S-2XL)
                          </button>
                          <span className="text-neutral-600">|</span>
                          <button
                            type="button"
                            onClick={() => setProductForm((prev) => ({ ...prev, sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'] }))}
                            className="text-[10px] text-amber-400 hover:underline"
                          >
                            All (S-3XL)
                          </button>
                        </div>
                      </div>

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
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-['Oswald'] transition ${
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

                    {/* Available Colors to Offer Customers */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                        Available Color Swatches for Customers
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {GARMENT_COLOR_PALETTE.map((c) => {
                          const isIncluded = productForm.availableColors.some((ac) => ac.hex === c.hex);
                          return (
                            <button
                              key={c.hex}
                              type="button"
                              onClick={() => {
                                setProductForm((prev) => ({
                                  ...prev,
                                  availableColors: isIncluded
                                    ? prev.availableColors.filter((ac) => ac.hex !== c.hex)
                                    : [...prev.availableColors, { name: c.name, hex: c.hex }],
                                }));
                              }}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border flex items-center space-x-1.5 transition ${
                                isIncluded
                                  ? 'bg-neutral-800 text-white border-amber-400'
                                  : 'bg-neutral-950 text-neutral-500 border-neutral-800'
                              }`}
                            >
                              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.hex }} />
                              <span>{c.name}</span>
                              {isIncluded && <Check className="w-3 h-3 text-amber-400" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                        Product Description
                      </label>
                      <textarea
                        rows={2}
                        value={productForm.description}
                        onChange={(e) => setProductForm((prev) => ({ ...prev, description: e.target.value }))}
                        className="w-full px-4 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-400"
                      />
                    </div>

                    {/* Auto-Live Status Info */}
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span className="font-semibold">
                          Automatic Live Publishing: Product will be immediately live in category &quot;{productForm.category}&quot;
                        </span>
                      </div>

                      <label className="flex items-center space-x-1.5 cursor-pointer text-xs font-bold text-white">
                        <input
                          type="checkbox"
                          checked={productForm.isGlowInDark}
                          onChange={(e) => setProductForm((prev) => ({ ...prev, isGlowInDark: e.target.checked }))}
                          className="rounded text-amber-400"
                        />
                        <span className="text-amber-400">Glow in Dark</span>
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
                    className="px-7 py-2.5 bg-amber-400 hover:bg-amber-500 text-black font-['Oswald'] font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg active:scale-95 flex items-center space-x-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingProduct ? 'Save & Update Product' : 'Add Product & Publish Live'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL: SUPPLIER DISPATCH DETAILS                                          */}
        {/* ========================================================================= */}
        {selectedOrderForSupplier && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md">
            <div className="relative w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-2xl text-neutral-100 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div>
                  <h3 className="font-['Oswald'] text-lg font-bold uppercase text-white">
                    Local Supplier Dispatch Specs
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Order #{selectedOrderForSupplier.orderNumber} • Send directly to printing team
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrderForSupplier(null)}
                  className="w-8 h-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-neutral-900 p-4 rounded-2xl font-mono text-xs text-neutral-300 max-h-80 overflow-y-auto whitespace-pre-wrap border border-neutral-800">
                {generateSupplierDispatchText(selectedOrderForSupplier)}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={() => copySupplierOrderText(selectedOrderForSupplier)}
                  className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold font-['Oswald'] uppercase rounded-xl flex items-center space-x-2 transition"
                >
                  <Copy className="w-4 h-4" />
                  <span>{supplierCopied ? 'Copied!' : 'Copy Text'}</span>
                </button>

                <button
                  onClick={() => openWhatsAppSupplier(selectedOrderForSupplier)}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold font-['Oswald'] uppercase rounded-xl flex items-center space-x-2 transition shadow-md"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send via WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
