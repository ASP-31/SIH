import { Stall, Product, Order, OrderItem, User, Address, SihProblemStatement, ArtistReview, B2BPurchaseOrder } from './types';
import { getSupabaseClient } from './supabase';
import { readReferralAttribution } from './referralAttribution';

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_STALLS: Stall[] = [];

export const SIH_PROBLEM_STATEMENTS: SihProblemStatement[] = [
  {
    id: 'sih-26090',
    code: 'SIH-26090',
    title: 'AI-Driven Market Linkage and Smart Cataloging Mobile Application for Marginalized Artisans',
    ministry: 'Ministry of Social Justice and Empowerment (MoSJE)',
    category: 'Flagship Problem Statement · Heritage & Culture',
    nationalChallenge:
      'Marginalized micro-entrepreneurs, artisans, and weavers struggle to access broader digital markets beyond temporary physical fairs (Shilp Samagam, Surajkund Mela, Dilli Haat) due to low digital literacy, language barriers, and lack of technical skills to professionally photograph, price, and catalog products.',
    toteSolution:
      'AI Virtual Business Manager delivering: 1) AI Image Enhancer & Studio (auto background removal, lighting, 1200x1200px e-commerce standard), 2) Multilingual Auto-Cataloger (vernacular voice notes in Hindi/regional languages auto-translated to SEO descriptions), 3) Dynamic Pricing Assistant (cost-plus algorithm factoring raw materials, labor & GI premiums), and 4) Continuous year-round market linkages (B2B, GeM, and ONDC).',
    impactMetrics:
      'Continuous year-round digital sales channel; eliminates fair dependency; 0 technical barrier voice onboarding; 240% increase in artisan take-home income.',
    alignedScheme: 'MoSJE Artisan Upliftment, PM Vishwakarma Yojana & GeM National Procurement',
    badgeColor: 'bg-amber-100 text-amber-950 border-amber-500',
  },
  {
    id: 'sih-1',
    code: 'SIH-1601',
    title: 'Elimination of Middlemen & Direct Producer-to-Consumer Market Access',
    ministry: 'Ministry of Textiles & Ministry of Rural Development',
    category: 'Supply Chain & Direct Fair Trade',
    nationalChallenge:
      'Rural handloom and craft artisans lose 60% to 70% of product margin to layered intermediaries and local aggregators who control urban access.',
    toteSolution:
      'Multi-stall decentralized architecture allowing direct buyer-to-artisan transacting with instant automated ledger payout routing (Razorpay Route / UPI AutoSplit).',
    impactMetrics:
      'Artisan take-home margin increased by 240%; settlement cycles reduced from 90 days to instant upon fulfillment.',
    alignedScheme: 'PM Vishwakarma Yojana & National Handloom Development Programme (NHDP)',
    badgeColor: 'bg-amber-50 text-amber-900 border-amber-300',
  },
  {
    id: 'sih-2',
    code: 'SIH-1602',
    title: 'Digital Inclusion & Low-Literacy Onboarding for Traditional Artisans',
    ministry: 'Ministry of Micro, Small and Medium Enterprises (MSME)',
    category: 'Digital Inclusion & Accessibility',
    nationalChallenge:
      'Traditional master weavers and stitchers struggle with complex enterprise ERPs, English-only seller consoles, and tedious catalog requirements.',
    toteSolution:
      'Frictionless visual 3-step stall onboarding, vernacular-friendly studio management, and single-click photo upload with automatic aspect and resolution optimization.',
    impactMetrics:
      'Onboarding time reduced from 3 weeks to under 4 minutes; 0 technical barriers for rural weavers.',
    alignedScheme: 'PM Vishwakarma Digital Empowerment & Udyam Assist Platform',
    badgeColor: 'bg-emerald-50 text-emerald-900 border-emerald-300',
  },
  {
    id: 'sih-3',
    code: 'SIH-1603',
    title: 'Authenticity Verification & Geographical Indication (GI) Provenance',
    ministry: 'Ministry of Commerce & Industry / DPIIT',
    category: 'Heritage Authenticity & GI Tagging',
    nationalChallenge:
      'Rampant counterfeit synthetic bags dilute traditional heritage crafts like authentic Kerala handlooms and Rajasthani block prints.',
    toteSolution:
      'GI Tag Verification Badge system & tamper-evident artisan provenance certificates attached to each item, verifying geographic origins and hand-spun materials.',
    impactMetrics:
      '100% verified GI clusters with verified artisan identity seals and geo-tagged workshop origin.',
    alignedScheme: 'One District One Product (ODOP) & Geographical Indications Registry',
    badgeColor: 'bg-blue-50 text-blue-900 border-blue-300',
  },
  {
    id: 'sih-4',
    code: 'SIH-1604',
    title: 'Aggregation & Promotion of One District One Product (ODOP) Clusters',
    ministry: 'Department for Promotion of Industry and Internal Trade (DPIIT)',
    category: 'Regional Economic Development',
    nationalChallenge:
      'District-level artisan clusters remain fragmented without centralized discovery or unified regional storytelling for domestic and international buyers.',
    toteSolution:
      'Interactive ODOP Craft Cluster Explorer with state filtering, showcasing local materials (flax linen, Kerala duck canvas, Bengal jute, Jaipur indigo).',
    impactMetrics:
      'Direct market linkage established across 28 states and 750+ craft clusters nationwide.',
    alignedScheme: 'ODOP Initiative & Invest India Craft Hub',
    badgeColor: 'bg-purple-50 text-purple-900 border-purple-300',
  },
  {
    id: 'sih-5',
    code: 'SIH-1605',
    title: 'Instant Financial Inclusion via Direct UPI Settlement & Zero Working Capital Delay',
    ministry: 'National Payments Corporation of India (NPCI) & Ministry of Finance',
    category: 'Fintech & Working Capital',
    nationalChallenge:
      'Artisans cannot purchase bulk natural raw materials (canvas, brass rivets, organic dyes) due to delayed 30-to-60 day corporate retailer settlement windows.',
    toteSolution:
      'Zero-withholding direct UPI & automated gateway routing that distributes funds directly into the artisan bank account upon dispatch confirmation.',
    impactMetrics:
      'Zero delayed receivables; operational cash flow turnover accelerated 5x for small workshops.',
    alignedScheme: 'Pradhan Mantri Jan Dhan Yojana & PM SVANidhi',
    badgeColor: 'bg-rose-50 text-rose-900 border-rose-300',
  },
  {
    id: 'sih-6',
    code: 'SIH-1606',
    title: 'Mission LiFE & 100% Replacement of Single-Use Plastic Bags',
    ministry: 'Ministry of Environment, Forest and Climate Change (MoEFCC)',
    category: 'Sustainability & Circular Economy',
    nationalChallenge:
      'India produces over 3.4 million tonnes of plastic waste annually, with single-use thin carry bags being the primary urban and water-body pollutant.',
    toteSolution:
      'Durable, high-tensile 12-18oz natural cotton canvas, jute, and linen tote bags engineered for 1,000+ reuse cycles with zero microplastic runoff.',
    impactMetrics:
      'Over 450,000 single-use plastic bags eliminated per 1,000 Tote bags in active daily circulation.',
    alignedScheme: 'Mission LiFE (Lifestyle for Environment) & Swachh Bharat Abhiyan',
    badgeColor: 'bg-teal-50 text-teal-900 border-teal-300',
  },
];

export async function getDemoStalls(): Promise<Stall[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('stalls')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching stalls:', error);
    return [];
  }
  return data as Stall[];
}

export async function saveDemoStalls(stalls: Stall[]): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase
    .from('stalls')
    .upsert(stalls);

  if (error) console.error('Error saving stalls:', error);
}

export async function getDemoProducts(): Promise<Product[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('products_catalog')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  return data as Product[];
}

const PRODUCT_WRITE_FIELDS = [
  'id',
  'stall_id',
  'title',
  'slug',
  'description',
  'price',
  'original_price',
  'stock',
  'material',
  'dimensions',
  'capacity_liters',
  'strap_drop',
  'colors',
  'images',
  'original_image_url',
  'enhanced_image_url',
  'cloudinary_public_id',
  'selected_image_url',
  'category',
  'state_origin',
  'odop_cluster',
  'craft_technique',
  'craft_story',
  'loom_heritage',
  'audio_story_title',
  'audio_story_url',
  'is_gi_tagged',
  'care_instructions',
  'b2b_moq_tiers',
  'gem_specs',
  'ondc_publish_status',
  'is_active',
  'is_featured',
  'rating',
  'reviews_count',
  'created_at',
] as const;

function toProductRow(product: Product): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const field of PRODUCT_WRITE_FIELDS) {
    const value = (product as unknown as Record<string, unknown>)[field];
    if (value !== undefined) row[field] = value;
  }
  return row;
}

export async function saveDemoProducts(products: Product[]): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const rows = products.map(toProductRow);

  const { error } = await supabase.from('products').upsert(rows);
  if (error) console.error('Error saving products:', error);
}

interface OrderRow extends Record<string, unknown> {
  id: string;
  order_items?: OrderItemRow[];
}

interface OrderItemRow extends Record<string, unknown> {
  id: string;
  order_id: string;
  product_id: string | null;
  stall_id: string;
  stall_name: string | null;
  title: string;
  price_at_purchase: number;
  quantity: number;
  image_url: string | null;
  status: OrderItem['status'];
  tracking_number: string | null;
  carrier: string | null;
  shipped_at: string | null;
}

function mapOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: String(row.id),
    order_id: String(row.order_id),
    product_id: row.product_id ? String(row.product_id) : '',
    stall_id: String(row.stall_id),
    stall_name: row.stall_name ?? undefined,
    title: String(row.title),
    price_at_purchase: Number(row.price_at_purchase),
    quantity: Number(row.quantity),
    image_url: row.image_url ?? '',
    status: row.status,
    tracking_number: row.tracking_number ?? undefined,
    carrier: row.carrier ?? undefined,
    shipped_at: row.shipped_at ?? undefined,
  };
}

function mapOrder(row: OrderRow): Order {
  const items = (row.order_items ?? [])
    .map(mapOrderItem)
    .sort((a, b) => a.id.localeCompare(b.id));

  return {
    id: String(row.id),
    buyer_id: String(row.buyer_id),
    buyer_name: String(row.buyer_name),
    buyer_email: String(row.buyer_email),
    buyer_phone: (row.buyer_phone as string) ?? '',
    shipping_address: (row.shipping_address as unknown as Order['shipping_address']) ?? ({} as Order['shipping_address']),
    delivery_method: row.delivery_method as Order['delivery_method'],
    payment_method: row.payment_method as Order['payment_method'],
    payment_status: row.payment_status as Order['payment_status'],
    buyer_transaction_last5: (row.buyer_transaction_last5 as string) ?? undefined,
    seller_confirmed_last5: (row.seller_confirmed_last5 as string) ?? undefined,
    payment_verified_at: (row.payment_verified_at as string) ?? undefined,
    delivery_scheduled_date: (row.delivery_scheduled_date as string) ?? undefined,
    carrier: (row.carrier as string) ?? undefined,
    tracking_number: (row.tracking_number as string) ?? undefined,
    dispute_status: (row.dispute_status as Order['dispute_status']) ?? 'none',
    dispute_issue: (row.dispute_issue as string) ?? undefined,
    dispute_created_at: (row.dispute_created_at as string) ?? undefined,
    subtotal: Number(row.subtotal ?? 0),
    shipping_total: Number(row.shipping_total ?? 0),
    total_amount: Number(row.total_amount ?? 0),
    created_at: String(row.created_at),
    items,
  };
}

export async function getDemoOrders(): Promise<Order[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }

  return ((data ?? []) as unknown as OrderRow[]).map(mapOrder);
}

export async function saveNewOrder(order: Order): Promise<Order> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase is not configured');

  const referralCode = typeof window !== 'undefined' ? readReferralAttribution()?.trackingCode : null;

  const { data, error } = await supabase.rpc('place_order', {
    p_buyer_name: order.buyer_name,
    p_buyer_email: order.buyer_email,
    p_buyer_phone: order.buyer_phone,
    p_shipping_address: order.shipping_address as unknown as Record<string, unknown>,
    p_delivery_method: order.delivery_method,
    p_payment_method: order.payment_method,
    p_payment_last5: order.buyer_transaction_last5 ?? null,
    p_shipping_total: order.shipping_total,
    p_items: order.items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      image_url: item.image_url,
    })),
    p_referral_code: referralCode,
  });

  if (error) {
    console.error('Error placing order:', error);
    throw new Error(error.message);
  }

  const created = data as unknown as OrderRow;
  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', created.id)
    .order('created_at', { ascending: true });

  created.order_items = (items ?? []) as unknown as OrderItemRow[];

  return mapOrder(created);
}

export async function updateOrderItemStatus(
  orderId: string,
  itemId: string,
  status: OrderItem['status'],
  options?: { carrier?: string; trackingNumber?: string }
): Promise<OrderItem | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc('set_order_item_status', {
    p_order_id: orderId,
    p_item_id: itemId,
    p_status: status,
    p_carrier: options?.carrier ?? null,
    p_tracking_number: options?.trackingNumber ?? null,
  });

  if (error) {
    console.error('Error updating order item status:', error);
    throw new Error(error.message);
  }

  return data ? mapOrderItem(data as unknown as OrderItemRow) : null;
}

export async function getB2BOrders(): Promise<B2BPurchaseOrder[]> {
  return [];
}

export async function saveB2BOrders(orders: B2BPurchaseOrder[]): Promise<void> {
  // TODO: Implement B2B order persistence
}

export async function updateB2BOrderStatus(
  orderId: string,
  status: B2BPurchaseOrder['status'],
  consignmentTracking?: string
): Promise<void> {
  // TODO: Implement B2B order status update
}

export function exportGemCatalogJson(products: Product[]): string {
  const gemSchemaCatalog = products.map((p) => ({
    gemProductCode: `GEM-TEXT-${p.id.toUpperCase()}`,
    hsnCode: p.gem_specs?.hsn_code || '42021290',
    title: p.title,
    sellerStall: p.stall_name,
    stateOrigin: p.state_origin,
    craftCluster: p.odop_cluster,
    unitPriceINR: p.price,
    wholesaleBulkMoq: p.b2b_moq_tiers || [],
    qciVerified: p.gem_specs?.qci_certified ?? true,
    cpseProcurementEligible: p.gem_specs?.cpse_aligned ?? true,
    ondcCatalogStatus: p.ondc_publish_status || 'published',
    specs: {
      dimensions: p.dimensions,
      material: p.material,
      leadTimeDays: p.gem_specs?.lead_time_days || 7,
    },
  }));
  return JSON.stringify(gemSchemaCatalog, null, 2);
}

export async function removeProductFromMarketplace(productId: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase
    .from('products')
    .update({
      stock: 0,
      is_active: false,
    })
    .eq('id', productId);

  if (error) console.error('Error removing product:', error);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tote_products_changed', { detail: { productId } }));
  }
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export async function getArtisanReviews(stallId?: string): Promise<ArtistReview[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase.from('artist_reviews').select('*');

  if (stallId) {
    query = query.eq('stall_id', stallId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
  return data as ArtistReview[];
}

export async function addArtisanReview(
  review: Omit<ArtistReview, 'id' | 'created_at'>
): Promise<ArtistReview> {
  const supabase = getSupabaseClient();
  if (!supabase) return { ...review, id: 'err', created_at: new Date().toISOString() } as any;

  const { data, error } = await supabase
    .from('artist_reviews')
    .insert([review])
    .select()
    .single();

  if (error) {
    console.error('Error adding review:', error);
    return { ...review, id: 'err', created_at: new Date().toISOString() } as any;
  }
  return data as ArtistReview;
}

export async function confirmOrderPayment(orderId: string, sellerLast5: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { data: order } = await supabase
    .from('orders')
    .select('buyer_transaction_last5')
    .eq('id', orderId)
    .single();

  if (!order) return false;

  const hasMatchingPayment = order.buyer_transaction_last5?.trim() === sellerLast5.trim();
  if (!hasMatchingPayment) return false;

  const { error } = await supabase.rpc('verify_order_payment', {
    p_order_id: orderId,
    p_last5: sellerLast5.trim(),
  });

  if (error) {
    console.error('Error verifying payment:', error);
    return false;
  }

  return true;
}

export async function submitOrderPaymentProof(orderId: string, last5: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase.rpc('submit_order_payment', {
    p_order_id: orderId,
    p_last5: last5,
  });

  if (error) {
    console.error('Error submitting payment proof:', error);
    return false;
  }

  return true;
}

export async function scheduleOrderDelivery(
  orderId: string,
  carrier: string,
  trackingNumber: string,
  scheduledDate: string
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase.rpc('schedule_order_delivery', {
    p_order_id: orderId,
    p_carrier: carrier,
    p_tracking_number: trackingNumber,
    p_date: scheduledDate,
  });

  if (error) {
    console.error('Error scheduling delivery:', error);
    return false;
  }

  return true;
}

export async function reportOrderDispute(orderId: string, issue: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase.rpc('report_order_dispute', {
    p_order_id: orderId,
    p_issue: issue,
  });

  if (error) {
    console.error('Error reporting dispute:', error);
    return false;
  }

  return true;
}

export async function resolveOrderDispute(orderId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase.rpc('resolve_order_dispute', { p_order_id: orderId });

  if (error) {
    console.error('Error resolving dispute:', error);
    return false;
  }

  return true;
}
