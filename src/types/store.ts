export type GraphicType =
  | 'eat-my-dust'
  | 'portrait-che'
  | 'cute-headphones'
  | 'texas-strong'
  | 'be-great'
  | 'vintage-book'
  | 'streetwear-comic'
  | 'vintage-camera'
  | 'tokyo-retro'
  | 'floral-wreath'
  | 'anime-hero'
  | 'peter-sagan-skull'
  | 'graphic-tokyo'
  | 'graphic-sunset'
  | 'graphic-skull'
  | 'graphic-mountain'
  | 'graphic-geometric'
  | 'graphic-abstract'
  | 'graphic-vintage-skate'
  | 'graphic-cosmic'
  | string;

export type StandardPrintDimension = '8x11' | '11x16' | '11x18' | string;

export interface Product {
  id: string;
  sku?: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  shirtColor: string; // hex or css color
  shirtColorName: string;
  category: 'new' | 'bestseller' | 'featured' | string;
  gender: 'men' | 'women' | 'unisex';
  badge?: string;
  description: string;
  sizes: string[];
  availableColors: { name: string; hex: string; textColor?: string }[];
  graphicType: GraphicType;
  graphicUrl?: string;
  printDimension?: StandardPrintDimension; // 8x11, 11x16, 11x18 inches
  isGlowInDark?: boolean;
  isLive?: boolean; // Qikink imported products can be draft or live
  qikinkProductId?: string;
  fabricGsm?: number | string; // 180, 220, 240, 280 GSM
  fabricComposition?: string; // e.g. "100% Super-Combed Bio-Washed Cotton"
  fitType?: 'oversized' | 'regular' | 'boxy' | 'slim' | string;
  printTechnique?: string; // e.g. "Direct-to-Garment (DTG) Digital Pigment"
  qualityGrade?: string; // e.g. "Export Quality Grade A+"
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'made_to_order_pod';
  printSpecs?: {
    printArea?: 'chest' | 'back' | 'pocket' | 'all-over' | string;
    dpi?: number;
    recommendedWidth?: number;
    recommendedHeight?: number;
    dimensionsInches?: string; // e.g. "8 x 11 Inches", "11 x 16 Inches", "11 x 18 Inches"
  };
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface QikinkWebhookPayload {
  event: 'product.created' | 'product.updated' | 'order.status_changed' | string;
  timestamp?: string;
  product?: {
    qikink_id: string;
    sku: string;
    title: string;
    description?: string;
    base_price: number;
    category?: string;
    gender?: 'men' | 'women' | 'unisex';
    colors?: { name: string; hex: string }[];
    sizes?: string[];
    mockup_urls?: string[];
    print_area?: 'chest' | 'back' | 'pocket' | 'all-over';
    print_dpi?: number;
    tags?: string[];
  };
  order?: {
    order_id: string;
    qikink_order_id: string;
    status: 'pending' | 'in_production' | 'printed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
    tracking_number?: string;
    courier_name?: string;
  };
}

export interface QikinkFulfillmentOrder {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  items: {
    productId: string;
    sku?: string;
    name: string;
    size: string;
    color: string;
    quantity: number;
    price: number;
    printFileUrl?: string;
    printPlacement?: 'front' | 'back' | 'pocket';
    customNotes?: string;
  }[];
  totalAmount: number;
  qikinkOrderId?: string;
  qikinkStatus: 'pending' | 'sent_to_qikink' | 'in_production' | 'printed' | 'packed' | 'dispatched' | 'delivered' | 'failed';
  trackingNumber?: string;
  courierName?: string;
  dispatchedAt?: string;
  createdAt: string;
  qikinkRawResponse?: Record<string, unknown>;
}

export interface CustomDesignUpload {
  id: string;
  customerId: string;
  customerEmail?: string;
  fileName: string;
  fileUrl: string;
  storagePath: string;
  fileSizeBytes: number;
  widthPx: number;
  heightPx: number;
  isTransparentPng: boolean;
  dpiEstimated?: number;
  createdAt: string;
  approvalStatus?: 'pending_review' | 'approved_for_print' | 'revision_requested' | 'rejected';
  adminNotes?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'store_manager' | 'fulfillment_agent';
  name: string;
  avatar?: string;
  token?: string;
  lastLogin?: string;
}

export interface AuthEventLog {
  id: string;
  userId?: string;
  userEmail: string;
  userName?: string;
  eventType: 'login' | 'logout' | 'signup' | 'password_reset' | 'session_active';
  status: 'success' | 'failed';
  ipAddress?: string;
  userAgent?: string;
  device?: string;
  timestamp: string;
  details?: string;
}

export interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  pendingPodOrders: number;
  liveProductsCount: number;
  draftProductsCount: number;
  customDesignsCount: number;
  activeCustomersCount: number;
  loginsTodayCount: number;
  logoutsTodayCount: number;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image?: string;
  shirtColor: string;
  shirtColorName: string;
  size: string;
  quantity: number;
  graphicType?: GraphicType;
  graphicUrl?: string;
  isGlowInDark?: boolean;
  customText?: string;
  customGraphicUrl?: string;
}

export interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  shirtColor: string;
  category: string;
  dateAdded: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  currency: string;
  currencySymbol: string;
  freeDeliveryThreshold: number;
  phone: string;
  email: string;
  address: string;
  workingHours: string;
  copyrightYear: number;
  announcementText: string;
  socialHandle?: string;
  facebookUrl?: string;
  instagramUrl?: string;
}

export interface InstagramPost {
  id: string;
  image: string;
  caption: string;
  likes: number;
  comments: number;
  username: string;
  taggedShirtId?: string;
  taggedShirtName?: string;
}

export interface PartnerBrand {
  id: string;
  name: string;
  iconName: string;
  subtext?: string;
}

export interface PromoBanner {
  id: string;
  bgColor: string;
  badgeText: string;
  title: string;
  subtitle: string;
  tshirtColor: string;
  graphicType: GraphicType;
  isGlowInDark?: boolean;
  btnText: string;
  linkCategory: string;
}
