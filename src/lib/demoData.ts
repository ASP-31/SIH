import { Stall, Product, Order, User, Address, SihProblemStatement, ArtistReview, B2BPurchaseOrder } from './types';

export const SIH_PROBLEM_STATEMENTS: SihProblemStatement[] = [
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

export const INITIAL_STALLS: Stall[] = [
  {
    id: 'stall_1',
    user_id: 'seller_1',
    name: 'EarthStitch Studio',
    slug: 'earthstitch-studio',
    artisan_name: 'Mira Shenoy',
    location: 'Fort Kochi, India',
    state: 'Kerala',
    odop_district: 'Ernakulam (Handloom & Natural Fiber Cluster)',
    craft_heritage: 'Traditional Hand-loomed Canvas & Natural Indigo Vat Dyeing',
    bio: 'Organic hand-loomed 16oz cotton canvas, plant-derived indigo dyes, and heritage hand-stitched leather reinforcement.',
    logo_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300&q=80',
    banner_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80',
    is_verified: true,
    is_vishwakarma_verified: true,
    is_gi_tagged: true,
    rating: 5.0,
    review_count: 0,
    sales_count: 0,
    payout_account_id: 'acct_earthstitch_live',
    payout_status: 'ready',
    heritage_story:
      'Rooted in the coastal lanes of Fort Kochi, EarthStitch Studio was founded by third-generation weaver Mira Shenoy. Every yarn is spun from certified organic Indian rain-fed cotton, dipped in natural plant-fermented indigo vats that have matured over 18 months, and stitched on vintage pedal looms. No chemical binders or petrochemical dyes touch our fabric.',
    craft_origin_history:
      'Kerala’s Chendamangalam handloom lineage dates back to the 17th century under the patronage of the Paliam lords. The intricate plain weave and double-ply twisted yarns produce an exceptional high-tensile fabric naturally resistant to coastal humidity.',
    audio_story_url: 'https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg',
    artisan_quote:
      '"When you hold an authentic indigo tote, you are not just carrying cotton — you are holding 300 years of monsoon rivers, plant alchemy, and ancestral pride."',
    created_at: '2025-01-15T10:00:00Z',
  },
  {
    id: 'stall_2',
    user_id: 'seller_2',
    name: 'The Weave & Knot',
    slug: 'the-weave-knot',
    artisan_name: 'Ananya & Kabir',
    location: 'Jaipur, India',
    state: 'Rajasthan',
    odop_district: 'Jaipur (Handicrafts & Textile Weaving Cluster)',
    craft_heritage: 'Heritage Knotwork, Sun-dried Jute & Block-stitch Macrame',
    bio: 'Artisan crochet, knotted macrame, and sun-dried natural jute. Each tote takes 14 hours of mindful slow crafting.',
    logo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    banner_url: 'https://images.unsplash.com/photo-1528458876885-544243324950?auto=format&fit=crop&w=1200&q=80',
    is_verified: true,
    is_vishwakarma_verified: true,
    is_gi_tagged: true,
    rating: 5.0,
    review_count: 0,
    sales_count: 0,
    payout_account_id: 'acct_weaveknot_live',
    payout_status: 'ready',
    heritage_story:
      'Working from Sanganer on the outskirts of Jaipur, Kabir and Ananya combine Rajasthani golden jute with ancient macrame knotting. The raw jute fibers are softened in natural neem and castor oils before being braided by hand.',
    craft_origin_history:
      'Rajasthani knotwork and macrame traditions were historically created to craft desert saddlebags capable of holding heavy camel loads without fraying across hot arid terrain.',
    audio_story_url: 'https://actions.google.com/sounds/v1/weather/wind_blowing_through_trees.ogg',
    artisan_quote:
      '"Every knot is tied with intention and care, honoring the strength of Rajasthan’s golden fiber."',
    created_at: '2025-02-01T11:00:00Z',
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    stall_id: 'stall_1',
    stall_name: 'EarthStitch Studio',
    stall_slug: 'earthstitch-studio',
    title: 'The Indigo Horizon Heavy Canvas Tote',
    slug: 'indigo-horizon-canvas-tote',
    description: 'Hand-dipped natural indigo canvas tote bag featuring double-needle copper rivets, internal key lanyard, and vegetable-tanned bridle leather handles.',
    price: 1850,
    original_price: 2200,
    stock: 14,
    material: '16oz Organic Duck Canvas & Full-Grain Leather',
    dimensions: '40cm x 38cm x 12cm',
    capacity_liters: 18,
    strap_drop: '27cm (Comfortable shoulder drop)',
    colors: ['Deep Indigo', 'Natural Sand', 'Terracotta'],
    images: [
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
    ],
    category: 'Heavy-Duty',
    state_origin: 'Kerala',
    odop_cluster: 'Ernakulam Handloom & Coir Cluster',
    craft_technique: 'Hand-dipped organic indigo vat fermentation & saddle-riveted leatherwork',
    is_gi_tagged: true,
    care_instructions: 'Spot clean with cool water and mild soap. Condition leather straps twice yearly.',
    b2b_moq_tiers: [
      { min_qty: 10, price_per_unit: 1350, discount_label: '27% Bulk Discount' },
      { min_qty: 50, price_per_unit: 1100, discount_label: '40% GeM / Corporate Batch' },
    ],
    gem_specs: {
      hsn_code: '42021290',
      gem_category_id: 'GEM-CAT-HANDLOOM-BAGS',
      qci_certified: true,
      min_procurement_batch: 10,
      lead_time_days: 7,
      cpse_aligned: true,
    },
    ondc_publish_status: 'published',
    is_active: true,
    is_featured: true,
    rating: 5.0,
    reviews_count: 0,
    created_at: '2025-02-10T10:00:00Z',
  },
  {
    id: 'prod_2',
    stall_id: 'stall_2',
    stall_name: 'The Weave & Knot',
    stall_slug: 'the-weave-knot',
    title: 'Hand-Crocheted Sunburst Market Tote',
    slug: 'hand-crocheted-sunburst-market-tote',
    description: 'Intricately hand-crocheted from sustainable raw cotton twine with reinforced base lining and soft round handles. Expands effortlessly for farmer market hauls.',
    price: 1450,
    original_price: 1750,
    stock: 8,
    material: '100% Unbleached Spun Cotton Cord',
    dimensions: '36cm x 42cm x 8cm (Flexible)',
    capacity_liters: 15,
    strap_drop: '24cm',
    colors: ['Oatmeal Cream', 'Sunbleached Sage', 'Warm Amber'],
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
    ],
    category: 'Crochet',
    state_origin: 'Rajasthan',
    odop_cluster: 'Jaipur Handicraft Cluster',
    craft_technique: 'Intricate 14-hour heritage knotwork & unbleached natural cotton spooling',
    is_gi_tagged: true,
    care_instructions: 'Hand wash gently in lukewarm water, dry flat in shade to maintain shape.',
    b2b_moq_tiers: [
      { min_qty: 10, price_per_unit: 1100, discount_label: '24% Bulk Discount' },
      { min_qty: 50, price_per_unit: 890, discount_label: '38% GeM / Corporate Batch' },
    ],
    gem_specs: {
      hsn_code: '42021290',
      gem_category_id: 'GEM-CAT-CROCHET-BAGS',
      qci_certified: true,
      min_procurement_batch: 10,
      lead_time_days: 10,
      cpse_aligned: true,
    },
    ondc_publish_status: 'published',
    is_active: true,
    is_featured: true,
    rating: 5.0,
    reviews_count: 0,
    created_at: '2025-02-14T11:30:00Z',
  },
];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_B2B_ORDERS: B2BPurchaseOrder[] = [];

// Helper functions with client-side localStorage persistence
const STALLS_KEY = 'tote_stalls_v5';
const PRODUCTS_KEY = 'tote_products_v5';
const ORDERS_KEY = 'tote_orders_v5';
const B2B_ORDERS_KEY = 'tote_b2b_orders_v5';

export function getDemoStalls(): Stall[] {
  if (typeof window === 'undefined') return INITIAL_STALLS;
  try {
    const raw = localStorage.getItem(STALLS_KEY);
    if (!raw) {
      localStorage.setItem(STALLS_KEY, JSON.stringify(INITIAL_STALLS));
      return INITIAL_STALLS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_STALLS;
  }
}

export function saveDemoStalls(stalls: Stall[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STALLS_KEY, JSON.stringify(stalls));
  } catch {}
}

export function getDemoProducts(): Product[] {
  if (typeof window === 'undefined') return INITIAL_PRODUCTS;
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (!raw) {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PRODUCTS;
  }
}

export function saveDemoProducts(products: Product[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch {}
}

export function getDemoOrders(): Order[] {
  if (typeof window === 'undefined') return INITIAL_ORDERS;
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ORDERS;
  }
}

export function saveDemoOrders(orders: Order[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch {}
}

export function getB2BOrders(): B2BPurchaseOrder[] {
  if (typeof window === 'undefined') return INITIAL_B2B_ORDERS;
  try {
    const raw = localStorage.getItem(B2B_ORDERS_KEY);
    if (!raw) {
      localStorage.setItem(B2B_ORDERS_KEY, JSON.stringify(INITIAL_B2B_ORDERS));
      return INITIAL_B2B_ORDERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_B2B_ORDERS;
  }
}

export function saveB2BOrders(orders: B2BPurchaseOrder[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(B2B_ORDERS_KEY, JSON.stringify(orders));
  } catch {}
}

export function updateB2BOrderStatus(
  orderId: string,
  status: B2BPurchaseOrder['status'],
  consignmentTracking?: string
): void {
  const current = getB2BOrders();
  const updated = current.map((order) => {
    if (order.id === orderId) {
      return {
        ...order,
        status,
        ...(consignmentTracking ? { consignment_tracking: consignmentTracking } : {}),
      };
    }
    return order;
  });
  saveB2BOrders(updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tote_b2b_orders_updated'));
  }
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

export function saveNewOrder(order: Order): void {
  const current = getDemoOrders();
  const updated = [order, ...current];
  saveDemoOrders(updated);

  // Decrement product inventory accordingly
  const products = getDemoProducts();
  const updatedProducts = products.map((p) => {
    const item = order.items.find((it) => it.product_id === p.id);
    if (item) {
      const newStock = Math.max(0, p.stock - item.quantity);
      return {
        ...p,
        stock: newStock,
        is_active: newStock > 0,
      };
    }
    return p;
  });
  saveDemoProducts(updatedProducts);
}

export function removeProductFromMarketplace(productId: string): void {
  const products = getDemoProducts();
  const updatedProducts = products.map((p) => {
    if (p.id === productId) {
      return {
        ...p,
        stock: 0,
        is_active: false,
      };
    }
    return p;
  });
  saveDemoProducts(updatedProducts);
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

// ----------------------------------------------------------------------
// ARTISAN REVIEWS & RATINGS STORE
// ----------------------------------------------------------------------
const ARTIST_REVIEWS_KEY = 'tote_artist_reviews_v5';

export const INITIAL_ARTIST_REVIEWS: ArtistReview[] = [];

export function getArtisanReviews(stallId?: string): ArtistReview[] {
  if (typeof window === 'undefined') {
    return stallId ? INITIAL_ARTIST_REVIEWS.filter((r) => r.stall_id === stallId) : INITIAL_ARTIST_REVIEWS;
  }
  try {
    const raw = localStorage.getItem(ARTIST_REVIEWS_KEY);
    const list: ArtistReview[] = raw ? JSON.parse(raw) : INITIAL_ARTIST_REVIEWS;
    if (!raw) {
      localStorage.setItem(ARTIST_REVIEWS_KEY, JSON.stringify(INITIAL_ARTIST_REVIEWS));
    }
    return stallId ? list.filter((r) => r.stall_id === stallId) : list;
  } catch {
    return stallId ? INITIAL_ARTIST_REVIEWS.filter((r) => r.stall_id === stallId) : INITIAL_ARTIST_REVIEWS;
  }
}

export function addArtisanReview(
  review: Omit<ArtistReview, 'id' | 'created_at'>
): ArtistReview {
  const current = getArtisanReviews();
  const newRev: ArtistReview = {
    ...review,
    id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
  };
  const updated = [newRev, ...current];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(ARTIST_REVIEWS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('tote_artisan_reviews_updated', { detail: newRev }));
    } catch {}
  }
  return newRev;
}

// ----------------------------------------------------------------------
// UPI 5-DIGIT VERIFICATION & DELIVERY / DISPUTE LIFECYCLE HELPERS
// ----------------------------------------------------------------------
export function confirmOrderPayment(orderId: string, sellerLast5: string): boolean {
  const orders = getDemoOrders();
  let matched = false;
  const updated = orders.map((o) => {
    if (o.id === orderId) {
      matched = true;
      return {
        ...o,
        payment_status: 'confirmed' as const,
        seller_confirmed_last5: sellerLast5,
        payment_verified_at: new Date().toISOString(),
      };
    }
    return o;
  });
  if (matched) {
    saveDemoOrders(updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tote_orders_updated'));
    }
  }
  return matched;
}

export function scheduleOrderDelivery(
  orderId: string,
  carrier: string,
  trackingNumber: string,
  scheduledDate: string
): void {
  const orders = getDemoOrders();
  const updated = orders.map((o) => {
    if (o.id === orderId) {
      return {
        ...o,
        carrier,
        tracking_number: trackingNumber,
        delivery_scheduled_date: scheduledDate,
        items: o.items.map((it) => ({
          ...it,
          carrier,
          tracking_number: trackingNumber,
          status: 'out_for_delivery' as const,
        })),
      };
    }
    return o;
  });
  saveDemoOrders(updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tote_orders_updated'));
  }
}

export function reportOrderDispute(orderId: string, issue: string): void {
  const orders = getDemoOrders();
  const updated = orders.map((o) => {
    if (o.id === orderId) {
      return {
        ...o,
        dispute_status: 'reported' as const,
        dispute_issue: issue,
        dispute_created_at: new Date().toISOString(),
      };
    }
    return o;
  });
  saveDemoOrders(updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tote_orders_updated'));
  }
}

export function resolveOrderDispute(orderId: string): void {
  const orders = getDemoOrders();
  const updated = orders.map((o) => {
    if (o.id === orderId) {
      return {
        ...o,
        dispute_status: 'resolved' as const,
      };
    }
    return o;
  });
  saveDemoOrders(updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tote_orders_updated'));
  }
}

