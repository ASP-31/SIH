export type UserRole = 'buyer' | 'seller' | 'influencer' | 'admin';

export interface Address {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  addresses?: Address[];
  created_at: string;
}

export interface Stall {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  bio: string;
  artisan_name: string;
  location: string;
  state: string;
  odop_district: string; // One District One Product identifier
  craft_heritage: string;
  logo_url: string;
  banner_url: string;
  is_verified: boolean;
  is_vishwakarma_verified?: boolean;
  is_gi_tagged?: boolean;
  rating: number;
  review_count: number;
  sales_count: number;
  payout_account_id?: string;
  payout_status?: 'ready' | 'pending' | 'unlinked';
  heritage_story?: string;
  audio_story_url?: string;
  craft_origin_history?: string;
  artisan_quote?: string;
  created_at: string;
}

export type ToteCategory =
  | 'Canvas'
  | 'Crochet'
  | 'Everyday'
  | 'Heavy-Duty'
  | 'Work & Laptop'
  | 'Eco Linen';

export interface B2BMoqTier {
  min_qty: number;
  price_per_unit: number;
  discount_label: string; // e.g. "27% Bulk Discount"
}

export interface GemSpecification {
  hsn_code: string; // e.g. "42021290"
  gem_category_id: string; // e.g. "GEM-CAT-HANDLOOM-BAGS"
  qci_certified: boolean;
  min_procurement_batch: number;
  lead_time_days: number;
  cpse_aligned: boolean; // Central Public Sector Enterprise procurement compliant
}

export interface B2BPurchaseOrder {
  id: string;
  po_number: string;
  buyer_entity: string; // e.g. "Ministry of Textiles - Craft Conclave" or "Tata Trent Retail"
  buyer_gstin?: string;
  order_type: 'gem_government' | 'b2b_corporate';
  product_id: string;
  product_title: string;
  quantity: number;
  unit_price: number;
  total_value: number;
  sanction_order_ref: string;
  delivery_deadline: string;
  status: 'rfq_pending' | 'po_issued' | 'in_production' | 'bulk_dispatched' | 'payment_settled';
  consignment_tracking?: string;
  created_at: string;
}

export interface Product {
  id: string;
  stall_id: string;
  stall_name?: string;
  stall_slug?: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  original_price?: number;
  stock: number;
  material: string;
  dimensions: string; // e.g. "38cm x 42cm x 10cm"
  capacity_liters: number; // e.g. 16
  strap_drop: string; // e.g. "28cm"
  colors: string[];
  images: string[];
  original_image_url?: string;
  enhanced_image_url?: string;
  cloudinary_public_id?: string;
  selected_image_url?: string;
  category: ToteCategory;
  state_origin?: string;
  odop_cluster?: string;
  craft_technique?: string;
  craft_story?: string;
  loom_heritage?: string;
  audio_story_title?: string;
  is_gi_tagged?: boolean;
  care_instructions?: string;
  // B2B & Government Marketplace Specs
  b2b_moq_tiers?: B2BMoqTier[];
  gem_specs?: GemSpecification;
  ondc_publish_status?: 'published' | 'pending' | 'draft';
  is_active: boolean;
  is_featured?: boolean;
  rating?: number;
  reviews_count?: number;
  created_at: string;
}

export type OrderItemStatus =
  | 'pending'
  | 'ready_to_pack'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  stall_id: string;
  stall_name?: string;
  title: string;
  price_at_purchase: number;
  quantity: number;
  image_url: string;
  status: OrderItemStatus;
  tracking_number?: string;
  carrier?: string;
  shipped_at?: string;
}

export interface OrderMessage {
  id: string;
  order_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'buyer' | 'seller' | 'system';
  message: string;
  created_at: string;
}

export interface OrderNotification {
  id: string;
  target_role: 'buyer' | 'seller';
  order_id: string;
  product_id?: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
}

export interface Order {
  id: string;
  buyer_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  shipping_address: Address;
  delivery_method: 'standard' | 'express';
  payment_method: 'card' | 'upi' | 'apple_pay';
  payment_status: 'paid' | 'pending' | 'failed' | 'pending_verification' | 'confirmed';
  buyer_transaction_last5?: string;
  seller_confirmed_last5?: string;
  payment_verified_at?: string;
  delivery_scheduled_date?: string;
  carrier?: string;
  tracking_number?: string;
  dispute_status?: 'none' | 'reported' | 'resolved';
  dispute_issue?: string;
  dispute_created_at?: string;
  subtotal: number;
  shipping_total: number;
  total_amount: number;
  created_at: string;
  items: OrderItem[];
}

export interface ArtistReview {
  id: string;
  stall_id: string;
  user_name: string;
  buyer_name?: string;
  user_location?: string;
  rating: number;
  title?: string;
  comment: string;
  craft_purchased: string;
  verified_purchase: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface SihProblemStatement {
  id: string;
  code: string;
  title: string;
  ministry: string;
  category: string;
  nationalChallenge: string;
  toteSolution: string;
  impactMetrics: string;
  alignedScheme: string;
  badgeColor: string;
}

export interface InfluencerProfile {
  id: string;
  user_id: string;
  name: string;
  handle: string; // e.g. "@kabir_craftculture"
  platform: 'instagram' | 'youtube' | 'lifestyle_blog' | 'multi_channel';
  followers: string; // e.g. "185K"
  category: string; // e.g. "Sustainable Heritage & Slow Fashion"
  bio: string;
  avatar_url: string;
  state?: string;
  preferred_rate_type: 'commission' | 'barter' | 'hybrid';
  default_commission_pct: number;
}

export interface CollabMessage {
  id: string;
  sender_role: 'influencer' | 'seller';
  sender_name: string;
  text: string;
  created_at: string;
}

export interface CollabProposal {
  id: string;
  influencer_id: string;
  influencer_name: string;
  influencer_handle: string;
  influencer_avatar: string;
  influencer_followers: string;
  influencer_niche: string;
  seller_id: string;
  stall_id: string;
  stall_name: string;
  product_id: string;
  product_title: string;
  product_image: string;
  product_price: number;
  promo_format: 'Instagram Reel' | 'YouTube Short' | 'Story Series & Unboxing' | 'Affiliate Review';
  pitch_message: string;
  sample_requested: boolean;
  commission_pct: number;
  tracking_code: string; // e.g. "KABIR-INDIGO-REEL"
  tracking_url: string; // e.g. "/?ref=kabir_craftculture&prod=prod_1"
  status: 'pending' | 'accepted' | 'declined' | 'in_discussion';
  created_at: string;
  updated_at: string;
  clicks: number; // real-time clicks recorded from link
  orders_count: number; // purchases completed through this link
  revenue_generated: number; // gross merchandise value attributed
  messages: CollabMessage[];
}

export interface ReferralClick {
  id: string;
  ref_code: string;
  product_id?: string;
  timestamp: string;
  source: string;
}

