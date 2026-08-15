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

export interface Product {
  id: string;
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
  sizes: ('XS' | 'S' | 'M' | 'L' | 'XL' | '2XL')[];
  availableColors: { name: string; hex: string; textColor?: string }[];
  graphicType: GraphicType;
  graphicUrl?: string;
  isGlowInDark?: boolean;
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
