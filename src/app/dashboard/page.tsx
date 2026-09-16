'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Store,
  DollarSign,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Printer,
  ShieldCheck,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Bell,
  MessageSquare,
  Mic,
  Camera,
  Users,
  Smartphone,
  Volume2,
  ShieldAlert,
  Check,
  Copy,
  Calendar,
  RefreshCw,
  Building2,
  FileSpreadsheet,
  FileText,
  Download,
  Share2,
  Video,
  Send,
  Eye,
  Loader2,
} from 'lucide-react';
import { Order, OrderItem, Product, Stall, OrderItemStatus, OrderNotification, CollabProposal } from '@/lib/types';
import {
  getDemoOrders,
  saveDemoOrders,
  getDemoProducts,
  saveDemoProducts,
  INITIAL_PRODUCTS,
  getDemoStalls,
  saveDemoStalls,
  confirmOrderPayment,
  scheduleOrderDelivery,
  resolveOrderDispute,
  formatINR,
  getB2BOrders,
  updateB2BOrderStatus,
  exportGemCatalogJson,
} from '@/lib/demoData';
import { B2BPurchaseOrder } from '@/lib/types';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  sendOrderMessage,
  addNotification,
} from '@/lib/conversationService';
import {
  getCollabProposalsForSeller,
  updateCollabStatus,
  sendCollabMessage,
} from '@/lib/influencerService';
import { getUserSession, UserSession } from '@/lib/userSession';
import { useToastStore } from '@/hooks/useToastStore';
import { OrderChatModal } from '@/components/OrderChatModal';
import { VoiceInputButton } from '@/components/VoiceInputButton';
import { ProductPhotoUploader } from '@/components/ProductPhotoUploader';

export default function SellerDashboardPage() {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);

  const stallId = session?.sellerStallId || 'stall_1';

  const [activeTab, setActiveTab] = useState<'pipeline' | 'b2b_hub' | 'collabs' | 'catalog' | 'payouts' | 'profile'>('pipeline');
  const [pipelineSubTab, setPipelineSubTab] = useState<OrderItemStatus>('pending');

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [b2bOrders, setB2bOrders] = useState<B2BPurchaseOrder[]>([]);
  const [stallProducts, setStallProducts] = useState<Product[]>([]);
  const [stall, setStall] = useState<Stall | null>(null);

  // Influencer Collabs State
  const [sellerCollabs, setSellerCollabs] = useState<CollabProposal[]>([]);
  const [activeSellerCollabChat, setActiveSellerCollabChat] = useState<CollabProposal | null>(null);
  const [sellerCollabChatInput, setSellerCollabChatInput] = useState('');

  // B2B & GeM Modals
  const [selectedInvoicePO, setSelectedInvoicePO] = useState<B2BPurchaseOrder | null>(null);
  const [isConsignmentModalOpen, setIsConsignmentModalOpen] = useState<B2BPurchaseOrder | null>(null);
  const [consignmentInput, setConsignmentInput] = useState('');

  // Chat & Notifications state
  const [chatOrder, setChatOrder] = useState<Order | null>(null);
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Modals
  const [fulfillmentModalItem, setFulfillmentModalItem] = useState<{
    orderId: string;
    item: OrderItem;
  } | null>(null);
  const [carrier, setCarrier] = useState('BlueDart Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [deliveryDateEstimate, setDeliveryDateEstimate] = useState('Sep 18, 2026, 3:00 PM IST');

  // Real UPI Verification Modal State
  const [verificationModalOrder, setVerificationModalOrder] = useState<Order | null>(null);
  const [enteredVerificationDigits, setEnteredVerificationDigits] = useState('');

  // Core Features Modals State
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
  const [isAiStudioOpen, setIsAiStudioOpen] = useState(false);
  const [isAffiliateEngineOpen, setIsAffiliateEngineOpen] = useState(false);
  const [isWhatsAppPreviewOpen, setIsWhatsAppPreviewOpen] = useState(false);
  const [isWaybillModalOpen, setIsWaybillModalOpen] = useState(false);
  const [selectedVoiceLang, setSelectedVoiceLang] = useState<'ml' | 'hi' | 'ta' | 'en'>('ml');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [aiStudioStep, setAiStudioStep] = useState<1 | 2 | 3>(1);

  const [packingSlipOrder, setPackingSlipOrder] = useState<{
    order: Order;
    item: OrderItem;
  } | null>(null);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);

  // New product form state
  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    price: 1500,
    stock: 10,
    material: '16oz Organic Cotton Canvas',
    dimensions: '38cm x 40cm x 10cm',
    capacity_liters: 16,
    strap_drop: '26cm',
    category: 'Canvas',
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
    originalImageUrl: '',
    enhancedImageUrl: '',
    cloudinaryPublicId: '',
    audioUrl: '',
    audioLang: '',
  });

  const loadData = () => {
    const currSession = getUserSession();
    const effectiveStallId = currSession?.sellerStallId || stallId;

    const orders = getDemoOrders();
    setAllOrders(orders);

    const b2b = getB2BOrders();
    setB2bOrders(b2b);

    const stalls = getDemoStalls();
    let currentStall = stalls.find(
      (s) => s.id === effectiveStallId || (currSession?.sellerStallSlug && s.slug === currSession.sellerStallSlug)
    );

    if (!currentStall && currSession) {
      currentStall = {
        id: effectiveStallId,
        user_id: currSession.id,
        name: currSession.sellerStallName || currSession.name || 'Artisan Workshop',
        slug: currSession.sellerStallSlug || `stall-${effectiveStallId}`,
        artisan_name: currSession.name || 'Master Artisan',
        location: 'Kochi, Kerala',
        state: currSession.stateOrigin || 'Kerala',
        odop_district: currSession.craftSpecialty || 'Handloom & Craft Cluster',
        craft_heritage: currSession.craftSpecialty || 'Traditional Handcrafted Canvas & Khadi',
        bio: `${currSession.name}'s dedicated rural artisan workshop, crafting authentic Atmanirbhar Bharat handloom creations.`,
        logo_url: currSession.avatar_url || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300&q=80',
        banner_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80',
        is_verified: true,
        is_vishwakarma_verified: true,
        is_gi_tagged: true,
        rating: 5.0,
        review_count: 0,
        sales_count: 0,
        payout_account_id: 'acct_direct_upi',
        payout_status: 'ready',
        heritage_story: 'Generational master craftsperson dedicated to authentic slow fashion and zero synthetic dyes.',
        craft_origin_history: 'Centuries of Indian indigenous handloom and craft cluster heritage.',
        created_at: new Date().toISOString(),
      };
      saveDemoStalls([...stalls, currentStall]);
    }

    if (!currentStall) {
      currentStall = stalls[0];
    }
    setStall(currentStall);

    const products = getDemoProducts();
    let matching = products.filter(
      (p) =>
        p.stall_id === effectiveStallId ||
        (currentStall && p.stall_id === currentStall.id) ||
        (currentStall && p.stall_slug === currentStall.slug) ||
        (currSession?.sellerStallSlug && p.stall_slug === currSession.sellerStallSlug)
    );

    if (matching.length === 0 && (effectiveStallId === 'stall_1' || currentStall.id === 'stall_1')) {
      matching = INITIAL_PRODUCTS.filter((p) => p.stall_id === 'stall_1');
    }
    setStallProducts(matching);

    setNotifications(getNotifications('seller'));
    setSellerCollabs(getCollabProposalsForSeller(effectiveStallId));
  };

  useEffect(() => {
    setMounted(true);
    const currSession = getUserSession();
    setSession(currSession);

    if (!currSession || currSession.role !== 'seller') {
      return;
    }

    loadData();

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'collabs') setActiveTab('collabs');
      else if (tab === 'b2b_hub') setActiveTab('b2b_hub');
    }

    const handleNotifUpdate = () => {
      setNotifications(getNotifications('seller'));
    };
    const handleOrdersUpdate = () => {
      setAllOrders(getDemoOrders());
    };
    const handleB2bUpdate = () => {
      setB2bOrders(getB2BOrders());
    };
    const handleCollabsUpdate = () => {
      const collabs = getCollabProposalsForSeller(stallId);
      setSellerCollabs(collabs);
      if (activeSellerCollabChat) {
        const found = collabs.find((c) => c.id === activeSellerCollabChat.id);
        if (found) setActiveSellerCollabChat(found);
      }
    };

    window.addEventListener('tote_notifications_updated', handleNotifUpdate);
    window.addEventListener('tote_orders_updated', handleOrdersUpdate);
    window.addEventListener('tote_b2b_orders_updated', handleB2bUpdate);
    window.addEventListener('tote_collabs_updated', handleCollabsUpdate);
    window.addEventListener('tote_clicks_updated', handleCollabsUpdate);

    const handleProductsUpdate = () => {
      setStallProducts(getDemoProducts().filter((p) => p.stall_id === stallId));
    };
    window.addEventListener('tote_products_changed', handleProductsUpdate);

    return () => {
      window.removeEventListener('tote_notifications_updated', handleNotifUpdate);
      window.removeEventListener('tote_orders_updated', handleOrdersUpdate);
      window.removeEventListener('tote_b2b_orders_updated', handleB2bUpdate);
      window.removeEventListener('tote_collabs_updated', handleCollabsUpdate);
      window.removeEventListener('tote_clicks_updated', handleCollabsUpdate);
      window.removeEventListener('tote_products_changed', handleProductsUpdate);
    };
  }, [stallId, activeSellerCollabChat]);

  // Extract all OrderItems relevant to THIS stall
  const stallOrderItems: { order: Order; item: OrderItem }[] = [];
  for (const order of allOrders) {
    for (const item of order.items) {
      if (item.stall_id === stallId) {
        stallOrderItems.push({ order, item });
      }
    }
  }

  // Pipeline counts
  const pendingItems = stallOrderItems.filter((x) => x.item.status === 'pending');
  const readyItems = stallOrderItems.filter((x) => x.item.status === 'ready_to_pack');
  const inTransitItems = stallOrderItems.filter(
    (x) => x.item.status === 'shipped' || x.item.status === 'out_for_delivery'
  );
  const completedItems = stallOrderItems.filter((x) => x.item.status === 'delivered');

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const handleDirectMarkOutForDelivery = (order: Order, item: OrderItem) => {
    const tracking = `IND-${Math.floor(100000000 + Math.random() * 900000000)}`;
    const carrierName = 'BlueDart Express Handloom Wing';

    const updatedOrders = allOrders.map((o) =>
      o.id === order.id
        ? {
            ...o,
            items: o.items.map((it) =>
              it.id === item.id
                ? {
                    ...it,
                    status: 'out_for_delivery' as OrderItemStatus,
                    tracking_number: tracking,
                    carrier: carrierName,
                    shipped_at: new Date().toISOString(),
                  }
                : it
            ),
          }
        : o
    );

    saveDemoOrders(updatedOrders);
    setAllOrders(updatedOrders);

    // Send system message to conversation
    sendOrderMessage(
      order.id,
      'Tote Dispatch Bot',
      'system',
      `🚚 Status Update: Artisan has marked "${item.title}" as OUT FOR DELIVERY via ${carrierName} (Waybill: ${tracking}).`
    );

    // Notify buyer
    addNotification({
      target_role: 'buyer',
      order_id: order.id,
      product_id: item.product_id,
      title: 'Item is Out for Delivery! 🚚',
      message: `Your tote "${item.title}" has been marked Out for Delivery. Mark as received once it arrives!`,
    });

    addToast({
      title: 'Marked Out for Delivery!',
      message: `Order #${order.id} marked Out for Delivery. Buyer notified.`,
      type: 'success',
    });
  };

  // Financial Calculations
  const grossSales = stallOrderItems
    .filter((x) => x.item.status !== 'cancelled')
    .reduce((acc, x) => acc + x.item.price_at_purchase * x.item.quantity, 0);
  const platformCommission = Math.round(grossSales * 0.05); // 5% fair maintenance fee
  const netEarnings = grossSales - platformCommission;

  // Pipeline Actions
  const handleAcceptOrder = (orderId: string, itemId: string) => {
    const updatedOrders = allOrders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          items: o.items.map((it) => (it.id === itemId ? { ...it, status: 'ready_to_pack' as const } : it)),
        };
      }
      return o;
    });
    saveDemoOrders(updatedOrders);
    setAllOrders(updatedOrders);
    addToast({
      title: 'Order Accepted',
      message: 'Moved to Ready to Pack.',
      type: 'success',
    });
  };

  const handleConfirmUpiPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationModalOrder) return;
    const cleanEntered = enteredVerificationDigits.trim();
    const expected = verificationModalOrder.buyer_transaction_last5?.trim();

    if (cleanEntered.length !== 5) {
      addToast({
        title: '5 Digits Required',
        message: 'Please enter the exact 5-digit UTR from your bank/UPI transaction history.',
        type: 'error',
      });
      return;
    }

    if (expected && cleanEntered !== expected) {
      addToast({
        title: 'UTR Mismatch!',
        message: `Entered digits (${cleanEntered}) do not match buyer claim (...${expected}). Please check your bank SMS.`,
        type: 'error',
      });
      return;
    }

    const matched = confirmOrderPayment(verificationModalOrder.id, cleanEntered);
    if (matched) {
      sendOrderMessage(
        verificationModalOrder.id,
        stall?.artisan_name || 'Mira Shenoy (EarthStitch)',
        'seller',
        `✅ Namaste ${verificationModalOrder.buyer_name}! I have verified your UPI payment receipt in my bank account (UTR ending in ...${cleanEntered}). Payment is confirmed! We are preparing your bag now.`
      );

      addNotification({
        target_role: 'buyer',
        order_id: verificationModalOrder.id,
        title: 'Payment Confirmed by Artisan! ✅',
        message: `${stall?.name || 'Artisan Workshop'} matched your UTR and confirmed payment. Crafting is underway.`,
      });

      addToast({
        title: 'Payment Confirmed! 🎉',
        message: `Order #${verificationModalOrder.id} verified with UTR ...${cleanEntered}.`,
        type: 'success',
      });

      setVerificationModalOrder(null);
      setEnteredVerificationDigits('');
      loadData();
    }
  };

  const handleConfirmFulfillment = () => {
    if (!fulfillmentModalItem || !trackingNumber.trim()) return;

    const { orderId, item } = fulfillmentModalItem;
    scheduleOrderDelivery(orderId, carrier, trackingNumber.trim(), deliveryDateEstimate);
    setFulfillmentModalItem(null);
    setTrackingNumber('');
    loadData();

    sendOrderMessage(
      orderId,
      'Tote Dispatch Bot',
      'system',
      `🚚 Status Update: Artisan has scheduled delivery and marked "${item.title}" as OUT FOR DELIVERY via ${carrier} (Waybill: ${trackingNumber.trim()}). Estimated Arrival: ${deliveryDateEstimate}.`
    );

    addNotification({
      target_role: 'buyer',
      order_id: orderId,
      product_id: item.product_id,
      title: 'Item Out for Delivery! 🚚',
      message: `Your tote "${item.title}" is out for delivery via ${carrier}. Estimated arrival: ${deliveryDateEstimate}.`,
    });

    addToast({
      title: 'Delivery Scheduled & Shipped!',
      message: `Waybill #${trackingNumber.trim()} assigned. Arrival expected: ${deliveryDateEstimate}.`,
      type: 'success',
    });
  };

  // Product CRUD
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const all = getDemoProducts();

    if (editingProduct) {
      const updated = all.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              title: productForm.title,
              description: productForm.description,
              price: Number(productForm.price),
              stock: Number(productForm.stock),
              material: productForm.material,
              dimensions: productForm.dimensions,
              capacity_liters: Number(productForm.capacity_liters),
              strap_drop: productForm.strap_drop,
              category: productForm.category as any,
              images: [productForm.imageUrl],
              original_image_url: productForm.originalImageUrl || p.original_image_url || productForm.imageUrl,
              enhanced_image_url: productForm.enhancedImageUrl || p.enhanced_image_url || productForm.imageUrl,
              cloudinary_public_id: productForm.cloudinaryPublicId || p.cloudinary_public_id || '',
              selected_image_url: productForm.imageUrl,
              audio_story_url: productForm.audioUrl || p.audio_story_url || '',
              audio_story_title: productForm.audioLang || p.audio_story_title || '',
              is_active: Number(productForm.stock) > 0,
            }
          : p
      );
      saveDemoProducts(updated);
      setStallProducts(
        updated.filter(
          (p) =>
            p.stall_id === stallId ||
            (stall && p.stall_id === stall.id) ||
            (stall && p.stall_slug === stall.slug)
        )
      );
      addToast({ title: 'Product updated', message: productForm.title, type: 'success' });
    } else {
      const targetStallId = stall?.id || stallId;
      const targetStallSlug = stall?.slug || 'earthstitch-studio';
      const targetStallName = stall?.name || 'EarthStitch Studio';

      const newProd: Product = {
        id: `prod_${Date.now()}`,
        stall_id: targetStallId,
        stall_name: targetStallName,
        stall_slug: targetStallSlug,
        title: productForm.title,
        slug: productForm.title.toLowerCase().replace(/\s+/g, '-'),
        description: productForm.description,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
        material: productForm.material,
        dimensions: productForm.dimensions,
        capacity_liters: Number(productForm.capacity_liters),
        strap_drop: productForm.strap_drop,
        category: productForm.category as any,
        colors: ['Natural', 'Dyed Charcoal'],
        images: [productForm.imageUrl],
        original_image_url: productForm.originalImageUrl || productForm.imageUrl,
        enhanced_image_url: productForm.enhancedImageUrl || productForm.imageUrl,
        cloudinary_public_id: productForm.cloudinaryPublicId || '',
        selected_image_url: productForm.imageUrl,
        audio_story_url: productForm.audioUrl || undefined,
        audio_story_title: productForm.audioLang || undefined,
        is_active: Number(productForm.stock) > 0,
        rating: 5.0,
        reviews_count: 0,
        created_at: new Date().toISOString(),
      };
      const updated = [newProd, ...all];
      saveDemoProducts(updated);
      setStallProducts(
        updated.filter(
          (p) =>
            p.stall_id === stallId ||
            p.stall_id === targetStallId ||
            p.stall_slug === targetStallSlug
        )
      );
      addToast({ title: 'New craft listed', message: productForm.title, type: 'success' });
    }

    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleAnalyzeImageWithVision = async () => {
    if (!productForm.imageUrl) return;
    setIsAnalyzingImage(true);
    try {
      const res = await fetch('/api/ai/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: productForm.imageUrl }),
      });
      const data = await res.json();
      if (data.success && data.catalog) {
        const cat = data.catalog;
        setProductForm((prev) => ({
          ...prev,
          title: cat.title || prev.title,
          description: cat.description || prev.description,
          category: cat.category || prev.category,
          price: cat.price || prev.price,
          material: cat.material || prev.material,
          dimensions: cat.dimensions || prev.dimensions,
          capacity_liters: cat.capacity_liters || prev.capacity_liters,
          strap_drop: cat.strap_drop || prev.strap_drop,
        }));
        addToast({
          title: '✨ AI Vision Auto-Cataloged!',
          message: `Identified "${cat.title}" with fair-trade price of ${formatINR(cat.price)}.`,
          type: 'success',
        });
      } else {
        addToast({
          title: 'Image Analysis Notice',
          message: data.error || 'Could not analyze craft photo.',
          type: 'info',
        });
      }
    } catch (err: any) {
      addToast({
        title: 'Analysis Error',
        message: err.message || 'Failed to connect to Vision AI.',
        type: 'error',
      });
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      title: prod.title,
      description: prod.description,
      price: prod.price,
      stock: prod.stock,
      material: prod.material,
      dimensions: prod.dimensions,
      capacity_liters: prod.capacity_liters,
      strap_drop: prod.strap_drop,
      category: prod.category,
      imageUrl: prod.images[0] || '',
      originalImageUrl: prod.original_image_url || prod.images[0] || '',
      enhancedImageUrl: prod.enhanced_image_url || prod.images[0] || '',
      cloudinaryPublicId: prod.cloudinary_public_id || '',
      audioUrl: prod.audio_story_url || '',
      audioLang: prod.audio_story_title || '',
    });
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = (prodId: string) => {
    const all = getDemoProducts();
    const updated = all.filter((p) => p.id !== prodId);
    saveDemoProducts(updated);
    setStallProducts(updated.filter((p) => p.stall_id === stallId));
    addToast({ title: 'Product removed', message: 'Bag removed from catalog', type: 'info' });
  };

  if (mounted && (!session || session.role !== 'seller')) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4 font-mono">
        <div className="max-w-md w-full border-2 border-[#18181B] bg-white p-6 sm:p-8 shadow-[6px_6px_0px_0px_#18181B] text-center space-y-4">
          <div className="w-12 h-12 rounded-none bg-amber-100 border-2 border-[#18181B] flex items-center justify-center mx-auto">
            <Store className="w-6 h-6 text-amber-700" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base sm:text-lg font-black uppercase text-[#18181B]">
              Artisan Workbench Gated
            </h2>
            <p className="text-xs text-[#71717A]">
              To access live artisan manufacturing pipelines, GeM dispatch orders, and creator collaborations, please sign in or register as an <strong>Artisan Maker</strong>.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/login?role=seller&redirect=/dashboard"
              className="py-2.5 px-4 bg-[#18181B] hover:bg-zinc-800 text-white text-xs font-bold uppercase border-2 border-[#18181B] shadow-[3px_3px_0px_0px_#71717A] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <span>Sign In as Artisan Maker</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="py-2 px-4 bg-white hover:bg-zinc-50 text-[#18181B] text-xs font-bold uppercase border border-[#18181B] transition-colors"
            >
              Return to Buyer Market
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-8 pb-28 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Stall Banner & Status */}
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#E5E5E0] p-6 sm:p-8 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-[#F2F0EB] border border-[#E5E5E0] shrink-0">
              <Image
                src={stall?.logo_url || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=150&q=80'}
                alt="Stall avatar"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[#18181B]">
                  {stall?.name || 'Artisan Workshop'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Creator Verified
                </span>
              </div>
              <p className="text-xs text-[#71717A] mt-0.5">
                Stall Slug: <span className="font-mono text-[#18181B]">tote.app/@{stall?.slug}</span> • Location: {stall?.location}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            {/* Notification Center */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2.5 rounded-full border border-[#E5E5E0] bg-[#FFFFFF] hover:bg-[#F2F0EB] text-[#18181B] transition-colors"
                aria-label="Order Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#FFFFFF] border border-[#E5E5E0] shadow-elevated p-3 z-50 animate-fade-in space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E0]">
                    <span className="font-bold text-xs text-[#18181B] flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-amber-600" />
                      Artisan Studio Alerts
                    </span>
                    {unreadNotifCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          markAllNotificationsAsRead('seller');
                          setNotifications(getNotifications('seller'));
                        }}
                        className="text-[10px] text-amber-800 font-bold hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2 divide-y divide-[#E5E5E0]/50 pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-center py-4 text-xs text-[#71717A]">No new alerts</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationAsRead(n.id);
                            setNotifications(getNotifications('seller'));
                            const ord = allOrders.find((o) => o.id === n.order_id);
                            if (ord) setChatOrder(ord);
                            setIsNotifOpen(false);
                          }}
                          className={`pt-2 text-xs cursor-pointer hover:bg-[#FAFAF8] p-1.5 rounded-lg transition-colors ${
                            !n.read ? 'bg-amber-50/70 font-semibold' : 'text-[#71717A]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[11px] text-[#18181B]">{n.title}</span>
                            <span className="text-[9px] text-[#71717A]">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#18181B] mt-0.5 line-clamp-2">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              href={`/stall/${stall?.slug || 'earthstitch-studio'}`}
              target="_blank"
              className="flex-1 md:flex-none py-2 px-4 rounded-full border border-[#E5E5E0] text-xs font-semibold text-[#18181B] hover:bg-[#F2F0EB] flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Public Stallfront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setProductForm({
                  title: '',
                  description: '',
                  price: 1500,
                  stock: 10,
                  material: '16oz Organic Cotton Canvas',
                  dimensions: '38cm x 40cm x 10cm',
                  capacity_liters: 16,
                  strap_drop: '26cm',
                  category: 'Canvas',
                  imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
                  originalImageUrl: '',
                  enhancedImageUrl: '',
                  cloudinaryPublicId: '',
                  audioUrl: '',
                  audioLang: '',
                });
                setIsProductModalOpen(true);
              }}
              className="flex-1 md:flex-none py-2 px-4 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-subtle transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>List New Bag</span>
            </button>
          </div>
        </div>

        {/* Real-time Order Notification Alert Banner */}
        {notifications.some((n) => !n.read && n.title.includes('Order')) && (
          <div className="rounded-2xl bg-amber-50 border border-amber-300 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-subtle animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <p className="font-bold text-xs sm:text-sm text-amber-950">
                  New Customer Order Alert!
                </p>
                <p className="text-xs text-amber-800">
                  {notifications.find((n) => !n.read && n.title.includes('Order'))?.message ||
                    'Someone bought your handcrafted tote! Ready for fulfillment.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const firstNewNotif = notifications.find((n) => !n.read && n.title.includes('Order'));
                  if (firstNewNotif) {
                    const ord = allOrders.find((o) => o.id === firstNewNotif.order_id);
                    if (ord) setChatOrder(ord);
                  }
                }}
                className="py-1.5 px-3 rounded-full border border-amber-400 bg-white text-amber-900 text-xs font-semibold hover:bg-amber-100 flex items-center gap-1"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                <span>Open Buyer Chat</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('pipeline');
                  setPipelineSubTab('pending');
                  markAllNotificationsAsRead('seller');
                  setNotifications(getNotifications('seller'));
                }}
                className="py-1.5 px-4 rounded-full bg-[#18181B] text-white text-xs font-semibold hover:bg-[#27272A] whitespace-nowrap"
              >
                Review in Pipeline →
              </button>
            </div>
          </div>
        )}

        {/* FINANCIAL SUMMARY CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5E0] p-4 sm:p-5 shadow-subtle space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A]">
              Gross Sales
            </span>
            <p className="text-xl sm:text-2xl font-black text-[#18181B]">
              {formatINR(grossSales)}
            </p>
            <p className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              All-time artisan revenue
            </p>
          </div>

          <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5E0] p-4 sm:p-5 shadow-subtle space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A]">
              Platform Fee (5%)
            </span>
            <p className="text-xl sm:text-2xl font-black text-[#71717A]">
              {formatINR(platformCommission)}
            </p>
            <p className="text-[10px] text-[#71717A]">
              Fair server & card maintenance
            </p>
          </div>

          <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5E0] p-4 sm:p-5 shadow-subtle space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Net Payout Due
            </span>
            <p className="text-xl sm:text-2xl font-black text-emerald-700">
              {formatINR(netEarnings)}
            </p>
            <p className="text-[10px] text-emerald-700 font-medium">
              Direct settlement to bank
            </p>
          </div>

          <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5E0] p-4 sm:p-5 shadow-subtle space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Action Required
            </span>
            <p className="text-xl sm:text-2xl font-black text-[#18181B]">
              {pendingItems.length + readyItems.length}
            </p>
            <p className="text-[10px] text-amber-700 font-medium">
              Orders awaiting dispatch
            </p>
          </div>
        </div>

        {/* CORE PRODUCT FEATURES: ARTISAN INNOVATION TOOLKIT */}
        <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-sky-500/10 rounded-3xl border border-amber-300/40 p-5 sm:p-6 shadow-subtle space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-white">
                  SIH 2024 Innovations
                </span>
                <h3 className="font-bold text-sm sm:text-base text-[#18181B]">
                  Artisan Studio &amp; Inclusive Tech Toolkit
                </h3>
              </div>
              <p className="text-xs text-[#71717A] mt-0.5">
                Government &amp; vernacular-first tools engineered for traditional handloom artisans.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setIsVoiceAssistantOpen(true)}
              className="p-3 rounded-2xl bg-white hover:bg-amber-50/80 border border-[#E5E5E0] hover:border-amber-300 text-left transition-all shadow-xs flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                  <Mic className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  മലയാളം / हिंदी
                </span>
              </div>
              <div className="mt-2">
                <h4 className="font-bold text-xs text-[#18181B] group-hover:text-amber-900">
                  Voice Onboarding
                </h4>
                <p className="text-[10px] text-[#71717A] mt-0.5 line-clamp-1">
                  Speak in native tongue
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsAiStudioOpen(true)}
              className="p-3 rounded-2xl bg-white hover:bg-emerald-50/80 border border-[#E5E5E0] hover:border-emerald-300 text-left transition-all shadow-xs flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  AI Clean &amp; Price
                </span>
              </div>
              <div className="mt-2">
                <h4 className="font-bold text-xs text-[#18181B] group-hover:text-emerald-900">
                  AI Catalog Studio
                </h4>
                <p className="text-[10px] text-[#71717A] mt-0.5 line-clamp-1">
                  Declutter photo &amp; fair price
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsAffiliateEngineOpen(true)}
              className="p-3 rounded-2xl bg-white hover:bg-purple-50/80 border border-[#E5E5E0] hover:border-purple-300 text-left transition-all shadow-xs flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                  10% Split
                </span>
              </div>
              <div className="mt-2">
                <h4 className="font-bold text-xs text-[#18181B] group-hover:text-purple-900">
                  Tote Match
                </h4>
                <p className="text-[10px] text-[#71717A] mt-0.5 line-clamp-1">
                  Influencer affiliate engine
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsWhatsAppPreviewOpen(true)}
              className="p-3 rounded-2xl bg-white hover:bg-green-50/80 border border-[#E5E5E0] hover:border-green-300 text-left transition-all shadow-xs flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-green-100 text-green-900 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-50 text-green-800 border border-green-200">
                  WhatsApp Bot
                </span>
              </div>
              <div className="mt-2">
                <h4 className="font-bold text-xs text-[#18181B] group-hover:text-green-900">
                  SMS &amp; WhatsApp
                </h4>
                <p className="text-[10px] text-[#71717A] mt-0.5 line-clamp-1">
                  Instant phone alerts
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsWaybillModalOpen(true)}
              className="p-3 rounded-2xl bg-white hover:bg-sky-50/80 border border-[#E5E5E0] hover:border-sky-300 text-left transition-all shadow-xs flex flex-col justify-between group col-span-2 sm:col-span-1"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-900 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
                  SpeedPost
                </span>
              </div>
              <div className="mt-2">
                <h4 className="font-bold text-xs text-[#18181B] group-hover:text-sky-900">
                  Micro-Logistics
                </h4>
                <p className="text-[10px] text-[#71717A] mt-0.5 line-clamp-1">
                  Waybill &amp; IMPS split ledger
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* STUDIO SUB-MODULE NAVIGATION */}
        <div className="flex border-b border-[#E5E5E0] gap-4 sm:gap-8 text-xs font-semibold text-[#71717A] overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('pipeline')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'pipeline'
                ? 'border-[#18181B] text-[#18181B]'
                : 'border-transparent hover:text-[#18181B]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Order Fulfillment Pipeline ({stallOrderItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('b2b_hub')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'b2b_hub'
                ? 'border-[#18181B] text-[#18181B]'
                : 'border-transparent hover:text-[#18181B]'
            }`}
          >
            <Building2 className="w-4 h-4 text-amber-700" />
            <span>GeM &amp; B2B Procurement ({b2bOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('collabs')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'collabs'
                ? 'border-orange-600 text-orange-950 font-bold'
                : 'border-transparent hover:text-[#18181B]'
            }`}
          >
            <Share2 className="w-4 h-4 text-orange-600" />
            <span>Influencer Collabs &amp; Reels ({sellerCollabs.length})</span>
            {sellerCollabs.some((c) => c.status === 'pending') && (
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'catalog'
                ? 'border-[#18181B] text-[#18181B]'
                : 'border-transparent hover:text-[#18181B]'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Tote Catalog Manager ({stallProducts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payouts')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'payouts'
                ? 'border-[#18181B] text-[#18181B]'
                : 'border-transparent hover:text-[#18181B]'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Payout Account & KYC</span>
          </button>
        </div>

        {/* TAB 1: ORDER FULFILLMENT PIPELINE */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6 animate-fade-in">
            {/* Pipeline Stage Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setPipelineSubTab('pending')}
                className={`py-2 px-4 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  pipelineSubTab === 'pending'
                    ? 'bg-[#18181B] text-white shadow-subtle'
                    : 'bg-[#FFFFFF] border border-[#E5E5E0] text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                <span>1. Pending Confirmation</span>
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center">
                  {pendingItems.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPipelineSubTab('ready_to_pack')}
                className={`py-2 px-4 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  pipelineSubTab === 'ready_to_pack'
                    ? 'bg-[#18181B] text-white shadow-subtle'
                    : 'bg-[#FFFFFF] border border-[#E5E5E0] text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                <span>2. Ready to Pack</span>
                <span className="w-4 h-4 rounded-full bg-sky-500 text-white text-[10px] flex items-center justify-center">
                  {readyItems.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPipelineSubTab('shipped')}
                className={`py-2 px-4 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  pipelineSubTab === 'shipped'
                    ? 'bg-[#18181B] text-white shadow-subtle'
                    : 'bg-[#FFFFFF] border border-[#E5E5E0] text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                <span>3. Out for Delivery</span>
                <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center">
                  {inTransitItems.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPipelineSubTab('delivered')}
                className={`py-2 px-4 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  pipelineSubTab === 'delivered'
                    ? 'bg-[#18181B] text-white shadow-subtle'
                    : 'bg-[#FFFFFF] border border-[#E5E5E0] text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                <span>4. Completed &amp; Received ({completedItems.length})</span>
              </button>
            </div>

            {/* List of Orders in Current Stage */}
            {(() => {
              const currentList =
                pipelineSubTab === 'shipped'
                  ? stallOrderItems.filter(
                      (x) => x.item.status === 'shipped' || x.item.status === 'out_for_delivery'
                    )
                  : stallOrderItems.filter((x) => x.item.status === pipelineSubTab);

              if (currentList.length === 0) {
                return (
                  <div className="bg-[#FFFFFF] rounded-3xl border border-[#E5E5E0] p-12 text-center text-xs text-[#71717A] shadow-subtle space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <p className="font-bold text-sm text-[#18181B]">No orders in this stage</p>
                    <p>All items in this pipeline bucket have been cleared.</p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {currentList.map(({ order, item }) => (
                    <div
                      key={`${order.id}-${item.id}`}
                      className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5E0] p-5 shadow-subtle space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E0]/60 text-xs">
                          <span className="font-mono font-bold text-[#18181B]">
                            #{order.id}
                          </span>
                          <span className="text-[11px] text-[#71717A]">
                            {new Date(order.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>

                        {/* Product Detail */}
                        <div className="flex items-center gap-3">
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-[#F2F0EB] shrink-0 border border-[#E5E5E0]">
                            <Image
                              src={item.image_url}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-[#18181B] truncate">
                              {item.title}
                            </h4>
                            <p className="text-[11px] text-[#71717A]">
                              Qty {item.quantity} • {formatINR(item.price_at_purchase * item.quantity)}
                            </p>
                          </div>
                        </div>

                        {/* Buyer & Destination */}
                        <div className="p-3 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0] text-[11px] space-y-0.5">
                          <p className="font-bold text-[#18181B]">
                            Deliver to: {order.shipping_address.name} ({order.shipping_address.city})
                          </p>
                          <p className="text-[#71717A] truncate">
                            {order.shipping_address.street}
                          </p>
                          <p className="text-[#71717A]">
                            Phone: {order.shipping_address.phone}
                          </p>
                        </div>

                        {/* Tracking Details if Shipped */}
                        {item.tracking_number && (
                          <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-blue-950 flex items-center gap-1.5">
                                <Truck className="w-3.5 h-3.5 text-blue-600" />
                                {item.carrier || 'BlueDart Express'}
                              </p>
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                                In Transit
                              </span>
                            </div>
                            <p className="font-mono text-[11px] text-blue-800">
                              AWB: {item.tracking_number}
                            </p>
                            {order.delivery_scheduled_date && (
                              <p className="text-[10px] text-blue-900 font-semibold flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-blue-600" />
                                Expected: {order.delivery_scheduled_date}
                              </p>
                            )}
                          </div>
                        )}

                        {/* UPI Payment Status / Verification Prompt */}
                        {order.payment_status === 'pending_verification' ? (
                          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 space-y-1.5 animate-pulse">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-amber-950 text-xs flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                UPI Verification Required
                              </span>
                              <span className="font-mono font-bold text-xs bg-amber-200 px-1.5 py-0.5 rounded text-amber-950">
                                ...{order.buyer_transaction_last5 || '84920'}
                              </span>
                            </div>
                            <p className="text-[11px] text-amber-900 leading-tight">
                              Buyer reported payment of {formatINR(order.total_amount)}. Please check your UPI statement for the matching 5 digits.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setVerificationModalOrder(order);
                                setEnteredVerificationDigits('');
                              }}
                              className="w-full py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Verify &amp; Confirm UTR (5 Digits)</span>
                            </button>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
                            <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              UPI Confirmed (UTR: ...{order.seller_confirmed_last5 || order.buyer_transaction_last5 || '84920'})
                            </span>
                            <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-100 px-1.5 py-0.5 rounded">
                              Verified
                            </span>
                          </div>
                        )}

                        {/* Buyer Dispute Alert if Reported */}
                        {order.dispute_status === 'reported' && (
                          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-rose-950 flex items-center gap-1">
                                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                                Buyer Reported an Issue
                              </span>
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                                Dispute Open
                              </span>
                            </div>
                            <p className="text-[11px] text-rose-800">
                              &ldquo;{order.dispute_issue}&rdquo;
                            </p>
                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setChatOrder(order)}
                                className="flex-1 py-1.5 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center justify-center gap-1"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>Chat &amp; Resolve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  resolveOrderDispute(order.id);
                                  loadData();
                                  addToast({ title: 'Dispute Resolved', message: `Order #${order.id} dispute marked resolved.`, type: 'success' });
                                }}
                                className="py-1.5 px-3 rounded-lg border border-rose-300 text-rose-800 font-semibold text-[11px] hover:bg-rose-100"
                              >
                                Mark Resolved
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons for this Stage */}
                      <div className="pt-3 border-t border-[#E5E5E0]/60 flex flex-wrap gap-2 items-center">
                        <button
                          type="button"
                          onClick={() => setChatOrder(order)}
                          className="py-2 px-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                          <span>Chat with Buyer</span>
                        </button>

                        {pipelineSubTab === 'pending' && (
                          <>
                            {order.payment_status === 'pending_verification' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setVerificationModalOrder(order);
                                  setEnteredVerificationDigits('');
                                }}
                                className="flex-1 py-2 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Verify Payment First</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setFulfillmentModalItem({ orderId: order.id, item });
                                  setTrackingNumber(`BLUEDART-${Math.floor(100000000 + Math.random() * 900000000)}`);
                                }}
                                className="flex-1 py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 whitespace-nowrap"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                <span>Schedule &amp; Dispatch</span>
                              </button>
                            )}
                          </>
                        )}

                        {pipelineSubTab === 'ready_to_pack' && (
                          <>
                            <button
                              type="button"
                              onClick={() => setPackingSlipOrder({ order, item })}
                              className="py-2 px-3 rounded-xl border border-[#E5E5E0] text-xs font-semibold text-[#18181B] hover:bg-[#F2F0EB] flex items-center gap-1"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Slip
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setFulfillmentModalItem({ orderId: order.id, item });
                                setTrackingNumber(`BLUEDART-${Math.floor(100000000 + Math.random() * 900000000)}`);
                              }}
                              className="flex-1 py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 whitespace-nowrap"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Schedule &amp; Dispatch</span>
                            </button>
                          </>
                        )}

                        {pipelineSubTab === 'shipped' && (
                          <div className="flex-1 py-2 px-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold flex items-center justify-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-blue-600" />
                            <span>Out for Delivery • Waiting for Buyer to Confirm Receipt</span>
                          </div>
                        )}

                        {pipelineSubTab === 'delivered' && (
                          <div className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Received by Buyer • Archived from Marketplace</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB: B2B & GOVERNMENT (GeM / ONDC) PROCUREMENT HUB */}
        {activeTab === 'b2b_hub' && (
          <div className="space-y-6 animate-fade-in font-mono">
            {/* Top Integration Status Cards */}
            <div className="border-2 border-[#18181B] bg-white p-5 shadow-[4px_4px_0px_0px_#18181B] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#18181B] pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-100 border border-[#18181B] text-amber-900">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base uppercase text-[#18181B]">
                      Government e-Marketplace (GeM) &amp; B2B Wholesale Hub
                    </h3>
                    <p className="text-[11px] text-[#52525B]">
                      Institutional procurement pipeline for CPSEs, Ministries, and Corporate batches.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const json = exportGemCatalogJson(stallProducts);
                      const blob = new Blob([json], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `GeM_Catalog_HSN42021290_${stallId}.json`;
                      a.click();
                      addToast({
                        title: 'GeM Catalog Exported',
                        message: 'JSON file compliant with Government e-Marketplace schema downloaded.',
                        type: 'success',
                      });
                    }}
                    className="py-2 px-3.5 bg-[#18181B] text-white hover:bg-zinc-800 text-xs font-bold uppercase border-2 border-[#18181B] shadow-[2px_2px_0px_0px_#71717A] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export GeM Schema (JSON)</span>
                  </button>
                </div>
              </div>

              {/* Status Pills Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="border border-[#18181B] bg-[#FAFAF8] p-3 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-[#71717A] uppercase">
                    <span>GeM / UDYAM Registry</span>
                    <span className="text-emerald-700 font-bold">VERIFIED</span>
                  </div>
                  <p className="font-bold text-xs text-[#18181B]">
                    {session?.gemUdyamId || 'UDYAM-KL-07-0049120'}
                  </p>
                  <p className="text-[10px] text-[#52525B]">Eligible for direct government supply</p>
                </div>

                <div className="border border-[#18181B] bg-[#FAFAF8] p-3 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-[#71717A] uppercase">
                    <span>ONDC Network Status</span>
                    <span className="text-blue-700 font-bold">LIVE &amp; SYNCED</span>
                  </div>
                  <p className="font-bold text-xs text-[#18181B]">Protocol Node: IN-ONDC-BAGS-01</p>
                  <p className="text-[10px] text-[#52525B]">Broadcasting 2 bags on open commerce</p>
                </div>

                <div className="border border-[#18181B] bg-[#FAFAF8] p-3 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-[#71717A] uppercase">
                    <span>HSN &amp; Tax Code</span>
                    <span className="text-amber-800 font-bold">QCI ALIGNED</span>
                  </div>
                  <p className="font-bold text-xs text-[#18181B]">HSN: 42021290 (Tote Luggage)</p>
                  <p className="text-[10px] text-[#52525B]">GST Rate: 12% (CGST 6% + SGST 6%)</p>
                </div>
              </div>
            </div>

            {/* Active B2B Purchase Orders Table Block */}
            <div className="border-2 border-[#18181B] bg-white p-5 shadow-[4px_4px_0px_0px_#18181B] space-y-4">
              <div className="flex items-center justify-between border-b-2 border-[#18181B] pb-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-[#18181B]" />
                  <h4 className="font-bold text-sm uppercase text-[#18181B]">
                    Official Purchase Orders &amp; Sanctions ({b2bOrders.length})
                  </h4>
                </div>
                <span className="text-[11px] text-[#71717A]">
                  Total Active Value: {formatINR(b2bOrders.reduce((acc, o) => acc + o.total_value, 0))}
                </span>
              </div>

              {b2bOrders.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#71717A]">
                  No B2B purchase orders found.
                </div>
              ) : (
                <div className="space-y-4">
                  {b2bOrders.map((po) => (
                    <div
                      key={po.id}
                      className="border-2 border-[#18181B] bg-[#FAFAF8] p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#18181B] pb-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase border ${
                              po.order_type === 'gem_government'
                                ? 'bg-amber-100 text-amber-950 border-amber-800'
                                : 'bg-blue-100 text-blue-950 border-blue-800'
                            }`}
                          >
                            {po.order_type === 'gem_government' ? 'GeM Ministry Order' : 'Corporate B2B Order'}
                          </span>
                          <span className="font-bold text-[#18181B]">PO #{po.po_number}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-[#71717A]">
                            Status:
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase border ${
                              po.status === 'payment_settled'
                                ? 'bg-emerald-100 text-emerald-950 border-emerald-800'
                                : po.status === 'bulk_dispatched'
                                ? 'bg-sky-100 text-sky-950 border-sky-800'
                                : 'bg-amber-200 text-amber-950 border-amber-800'
                            }`}
                          >
                            {po.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] text-[#71717A] uppercase block">
                            Procurement Entity
                          </span>
                          <p className="font-bold text-[#18181B]">{po.buyer_entity}</p>
                          <p className="text-[10px] text-[#52525B]">GSTIN: {po.buyer_gstin}</p>
                        </div>

                        <div>
                          <span className="text-[10px] text-[#71717A] uppercase block">
                            Batch Specifications
                          </span>
                          <p className="font-bold text-[#18181B]">{po.product_title}</p>
                          <p className="text-[10px] text-[#52525B]">
                            {po.quantity} units @ {formatINR(po.unit_price)}/unit
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] text-[#71717A] uppercase block">
                            Sanction Order &amp; Total
                          </span>
                          <p className="font-black text-sm text-[#18181B]">
                            {formatINR(po.total_value)}
                          </p>
                          <p className="text-[10px] text-amber-900 font-semibold">
                            Ref: {po.sanction_order_ref}
                          </p>
                        </div>
                      </div>

                      {po.consignment_tracking && (
                        <div className="border border-dashed border-[#18181B] bg-white p-2 text-xs flex items-center justify-between">
                          <span className="text-[11px] text-[#52525B]">
                            Consignment Waybill: <strong className="text-[#18181B]">{po.consignment_tracking}</strong>
                          </span>
                          <span className="text-[10px] font-bold text-emerald-800 uppercase">
                            Dispatched via SpeedPost Bulk Cargo
                          </span>
                        </div>
                      )}

                      {/* PO Action Buttons */}
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#18181B]">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoicePO(po)}
                          className="py-1.5 px-3 bg-white hover:bg-amber-50 text-xs font-bold uppercase border-2 border-[#18181B] shadow-[2px_2px_0px_0px_#18181B] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1.5 transition-all"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-700" />
                          <span>Generate GST E-Invoice</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsConsignmentModalOpen(po);
                            setConsignmentInput(po.consignment_tracking || `SPEEDPOST-BULK-${Math.floor(100000 + Math.random() * 900000)}`);
                          }}
                          className="py-1.5 px-3 bg-[#18181B] text-white hover:bg-zinc-800 text-xs font-bold uppercase border-2 border-[#18181B] shadow-[2px_2px_0px_0px_#71717A] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1.5 transition-all"
                        >
                          <Truck className="w-3.5 h-3.5 text-amber-400" />
                          <span>Update Bulk Dispatch</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Wholesale MOQ Tier Matrix Overview */}
            <div className="border-2 border-[#18181B] bg-white p-5 shadow-[4px_4px_0px_0px_#18181B] space-y-3">
              <h4 className="font-bold text-sm uppercase text-[#18181B] flex items-center gap-1.5 border-b-2 border-[#18181B] pb-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Active Wholesale MOQ Tier Matrix (Direct to Buyer &amp; GeM)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {stallProducts.map((p) => (
                  <div key={p.id} className="border border-[#18181B] p-3 bg-[#FAFAF8] space-y-2">
                    <p className="font-bold text-[#18181B] truncate">{p.title}</p>
                    <div className="text-[11px] text-[#52525B]">
                      <span>Retail Price: <strong>{formatINR(p.price)}</strong></span> &middot;{' '}
                      <span>HSN: <strong>{p.gem_specs?.hsn_code || '42021290'}</strong></span>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-zinc-300">
                      {p.b2b_moq_tiers?.map((tier, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px]">
                          <span>Batch MOQ {tier.min_qty}+ units:</span>
                          <span className="font-bold text-emerald-800">
                            {formatINR(tier.price_per_unit)}/unit ({tier.discount_label})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: INFLUENCER COLLABS & REEL PARTNERS */}
        {activeTab === 'collabs' && (
          <div className="space-y-6 animate-fade-in font-mono">
            {/* Header */}
            <div className="border-2 border-[#18181B] bg-white p-6 shadow-[6px_6px_0px_0px_#18181B] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#18181B] pb-3">
                <div>
                  <span className="text-xs font-bold uppercase text-orange-600 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5" />
                    Vocal for Local Creator Network
                  </span>
                  <h3 className="text-lg sm:text-xl font-black uppercase text-[#18181B] mt-0.5">
                    Influencer Collaborations &amp; Reel Traffic Hub
                  </h3>
                </div>
                <div className="text-xs font-bold text-zinc-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Real-Time Visitor Sync Active</span>
                </div>
              </div>

              <p className="text-xs text-zinc-600 leading-relaxed">
                Connect directly with cultural lifestyle influencers and digital creators. When an influencer posts your handcrafted tote in their Instagram reels or YouTube shorts, track how many visitors click their link and buy in real time. Discuss custom batches, send samples, and build long-term partnerships.
              </p>
            </div>

            {/* Metric Tiles for Seller */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border-2 border-[#18181B] bg-white p-4 shadow-[4px_4px_0px_0px_#18181B]">
                <span className="text-[11px] font-bold text-zinc-500 uppercase block">
                  Reel Visitors (Clicks)
                </span>
                <p className="text-2xl sm:text-3xl font-black text-orange-600 mt-2">
                  {sellerCollabs.reduce((acc, c) => acc + (c.clicks || 0), 0).toLocaleString()}
                </p>
                <p className="text-[10px] text-zinc-500 mt-1">Traffic routed to your stall</p>
              </div>

              <div className="border-2 border-[#18181B] bg-white p-4 shadow-[4px_4px_0px_0px_#18181B]">
                <span className="text-[11px] font-bold text-zinc-500 uppercase block">
                  Reel Purchases
                </span>
                <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">
                  {sellerCollabs.reduce((acc, c) => acc + (c.orders_count || 0), 0)}
                </p>
                <p className="text-[10px] text-zinc-500 mt-1">Orders attributed to creator links</p>
              </div>

              <div className="border-2 border-[#18181B] bg-white p-4 shadow-[4px_4px_0px_0px_#18181B]">
                <span className="text-[11px] font-bold text-zinc-500 uppercase block">
                  Reel Sales GMV
                </span>
                <p className="text-2xl sm:text-3xl font-black text-[#18181B] mt-2">
                  {formatINR(sellerCollabs.reduce((acc, c) => acc + (c.revenue_generated || 0), 0))}
                </p>
                <p className="text-[10px] text-zinc-500 mt-1">Gross sales generated</p>
              </div>

              <div className="border-2 border-[#18181B] bg-gradient-to-br from-amber-50 to-orange-100 p-4 shadow-[4px_4px_0px_0px_#EA580C]">
                <span className="text-[11px] font-black text-orange-950 uppercase block">
                  Connected Creators
                </span>
                <p className="text-2xl sm:text-3xl font-black text-orange-900 mt-2">
                  {sellerCollabs.length}
                </p>
                <p className="text-[10px] text-orange-800 font-bold mt-1">
                  {sellerCollabs.filter((c) => c.status === 'accepted').length} Active partnerships
                </p>
              </div>
            </div>

            {/* Collabs List Cards */}
            <div className="space-y-4">
              <h4 className="text-sm font-black uppercase text-[#18181B] border-b-2 border-[#18181B] pb-2">
                Creator Partnerships &amp; Reel Traffic Breakdown ({sellerCollabs.length})
              </h4>

              {sellerCollabs.length === 0 ? (
                <div className="border-2 border-[#18181B] bg-white p-12 text-center text-zinc-500 text-xs shadow-[4px_4px_0px_0px_#18181B]">
                  <Share2 className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
                  <p>No creator collaboration proposals yet. When influencers pitch your products, they will appear here!</p>
                </div>
              ) : (
                sellerCollabs.map((collab) => (
                  <div
                    key={collab.id}
                    className="border-2 border-[#18181B] bg-white p-5 shadow-[4px_4px_0px_0px_#18181B] space-y-4"
                  >
                    {/* Top Row: Influencer Profile & Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-full border-2 border-[#18181B] overflow-hidden bg-amber-50 shrink-0">
                          <Image
                            src={collab.influencer_avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'}
                            alt={collab.influencer_name}
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-[#18181B]">
                              {collab.influencer_name}
                            </span>
                            <span className="text-xs text-orange-700 bg-orange-50 px-1.5 py-0.5 border border-orange-300 font-bold">
                              {collab.influencer_handle}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-bold">
                              &bull; {collab.influencer_followers} followers
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-500 block">
                            {collab.influencer_niche}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {collab.status === 'accepted' ? (
                          <span className="px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Active Partner &bull; Reel Live
                          </span>
                        ) : collab.status === 'in_discussion' ? (
                          <span className="px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            In Discussion
                          </span>
                        ) : collab.status === 'declined' ? (
                          <span className="px-2.5 py-1 text-xs font-bold bg-red-100 text-red-900 border border-red-400">
                            Declined
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-bold bg-orange-100 text-orange-950 border border-orange-400 animate-pulse">
                            New Proposal Awaiting Review
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Product & Pitch Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start text-xs">
                      {/* Product Preview */}
                      <div className="lg:col-span-4 flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-300">
                        <div className="relative w-12 h-12 border border-[#18181B] overflow-hidden shrink-0">
                          <Image
                            src={collab.product_image || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=150&q=80'}
                            alt={collab.product_title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-[#18181B] truncate max-w-[180px]">
                            {collab.product_title}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            Retail: {formatINR(collab.product_price)} &bull; Format: <strong>{collab.promo_format}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Pitch Message Quote */}
                      <div className="lg:col-span-8 p-3 bg-[#FAFAF8] border-l-4 border-orange-500 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-zinc-500">
                          Creator Pitch &amp; Reel Proposal:
                        </span>
                        <p className="text-zinc-800 italic leading-relaxed">
                          &ldquo;{collab.pitch_message}&rdquo;
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-zinc-500 pt-1 font-bold">
                          <span>Requested Commission: <strong className="text-orange-900">{collab.commission_pct}%</strong></span>
                          <span>&bull;</span>
                          <span>Sample Requested: <strong>{collab.sample_requested ? 'Yes (Tote Sample)' : 'No'}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* REAL-TIME REFERRAL PERFORMANCE CARD (CORE USER REQUIREMENT) */}
                    <div className="p-4 bg-orange-50/70 border-2 border-orange-300 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-200 pb-2">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-orange-600" />
                          <span className="text-xs font-black uppercase text-orange-950">
                            Real-Time Traffic &amp; Sales Driven by {collab.influencer_handle}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-600">
                          Unique Tracking Link: <code className="font-bold text-orange-900">{collab.tracking_url}</code>
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center pt-1">
                        <div className="p-2 bg-white border border-orange-300">
                          <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                            Reel Clicks Recorded
                          </span>
                          <span className="text-xl font-black text-orange-600">
                            {collab.clicks || 0}
                          </span>
                          <span className="text-[9px] text-zinc-400 block mt-0.5">Visitors from reels</span>
                        </div>

                        <div className="p-2 bg-white border border-orange-300">
                          <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                            Direct Purchases
                          </span>
                          <span className="text-xl font-black text-emerald-800">
                            {collab.orders_count || 0}
                          </span>
                          <span className="text-[9px] text-zinc-400 block mt-0.5">Completed orders</span>
                        </div>

                        <div className="p-2 bg-white border border-orange-300">
                          <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                            Artisan Revenue (GMV)
                          </span>
                          <span className="text-xl font-black text-[#18181B]">
                            {formatINR(collab.revenue_generated || 0)}
                          </span>
                          <span className="text-[9px] text-zinc-400 block mt-0.5">Attributed sales</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        {collab.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                updateCollabStatus(collab.id, 'accepted');
                                setSellerCollabs(getCollabProposalsForSeller(stallId));
                                addToast({
                                  title: 'Collab Accepted!',
                                  message: `You accepted ${collab.influencer_name}'s partnership on ${collab.product_title}.`,
                                  type: 'success',
                                });
                              }}
                              className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-xs border border-[#18181B] shadow-[2px_2px_0px_0px_#18181B]"
                            >
                              Accept Collab
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                updateCollabStatus(collab.id, 'declined');
                                setSellerCollabs(getCollabProposalsForSeller(stallId));
                                addToast({
                                  title: 'Collab Declined',
                                  message: 'Proposal closed.',
                                  type: 'info',
                                });
                              }}
                              className="py-1.5 px-3 bg-white hover:bg-zinc-100 text-zinc-700 font-bold uppercase text-xs border border-[#18181B]"
                            >
                              Decline
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            addToast({
                              title: 'Sample Dispatched Alert',
                              message: `Sample tote dispatched to ${collab.influencer_name}. Tracking waybill recorded.`,
                              type: 'success',
                            });
                          }}
                          className="py-1.5 px-3 bg-zinc-100 hover:bg-zinc-200 text-[#18181B] font-bold uppercase text-xs border border-[#18181B]"
                        >
                          Dispatch Sample Kit
                        </button>
                      </div>

                      {/* Chat / Discuss Button */}
                      <button
                        type="button"
                        onClick={() => setActiveSellerCollabChat(collab)}
                        className="py-1.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold uppercase text-xs border-2 border-[#18181B] shadow-[2px_2px_0px_0px_#18181B] flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Discuss Partnerships ({collab.messages?.length || 0})</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* SELLER COLLAB DISCUSSION DRAWER */}
            {activeSellerCollabChat && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
                <div className="bg-white border-l-2 border-[#18181B] w-full max-w-md h-full shadow-[-8px_0px_0px_0px_#18181B] p-5 font-mono flex flex-col justify-between animate-fade-in">
                  <div>
                    <div className="flex items-center justify-between border-b-2 border-[#18181B] pb-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-orange-600">
                          Creator Partnership Discussion
                        </span>
                        <h3 className="text-base font-black uppercase text-[#18181B]">
                          Chat with {activeSellerCollabChat.influencer_name}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveSellerCollabChat(null)}
                        className="p-1 border border-[#18181B] hover:bg-zinc-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-3 p-3 bg-amber-50 border border-amber-300 space-y-1 text-xs">
                      <div className="flex items-center justify-between font-bold">
                        <span>{activeSellerCollabChat.influencer_handle}</span>
                        <span className="text-orange-700">{activeSellerCollabChat.clicks || 0} Reel Clicks</span>
                      </div>
                      <p className="text-[11px] text-zinc-600">
                        Product: {activeSellerCollabChat.product_title} &bull; Format: {activeSellerCollabChat.promo_format}
                      </p>
                    </div>
                  </div>

                  {/* Messages Thread */}
                  <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-1 text-xs">
                    {activeSellerCollabChat.messages?.map((msg) => {
                      const isMe = msg.sender_role === 'seller';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div className="text-[10px] text-zinc-500 mb-0.5">
                            {msg.sender_name} &bull; {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div
                            className={`p-3 max-w-[85%] border-2 ${
                              isMe
                                ? 'bg-[#18181B] text-white border-[#18181B] shadow-[2px_2px_0px_0px_#71717A]'
                                : 'bg-orange-50 text-[#18181B] border-orange-300 shadow-[2px_2px_0px_0px_#EA580C]'
                            }`}
                          >
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reply Input Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!sellerCollabChatInput.trim() || !activeSellerCollabChat) return;
                      sendCollabMessage(
                        activeSellerCollabChat.id,
                        'seller',
                        session?.name || stall?.artisan_name || 'Artisan Maker',
                        sellerCollabChatInput.trim()
                      );
                      setSellerCollabChatInput('');
                    }}
                    className="pt-2 border-t-2 border-[#18181B] flex gap-2"
                  >
                    <input
                      type="text"
                      value={sellerCollabChatInput}
                      onChange={(e) => setSellerCollabChatInput(e.target.value)}
                      placeholder="Message creator to coordinate reels or samples..."
                      className="flex-1 p-2 border-2 border-[#18181B] bg-[#FAFAF8] text-xs outline-none focus:bg-white"
                    />
                    <button
                      type="submit"
                      className="py-2 px-4 bg-[#18181B] hover:bg-zinc-800 text-white font-bold uppercase text-xs border-2 border-[#18181B] shadow-[2px_2px_0px_0px_#71717A]"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === 'catalog' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#18181B]">Bags in Your Workshop</h3>
                <p className="text-xs text-[#71717A]">
                  Manage stock quantities, descriptions, and pricing for your public stall.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setProductForm({
                    title: '',
                    description: '',
                    price: 1500,
                    stock: 10,
                    material: '16oz Organic Cotton Canvas',
                    dimensions: '38cm x 40cm x 10cm',
                    capacity_liters: 16,
                    strap_drop: '26cm',
                    category: 'Canvas',
                    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
                    originalImageUrl: '',
                    enhancedImageUrl: '',
                    cloudinaryPublicId: '',
                    audioUrl: '',
                    audioLang: '',
                  });
                  setIsProductModalOpen(true);
                }}
                className="py-2 px-4 rounded-full bg-[#18181B] text-white text-xs font-semibold flex items-center gap-1.5 shadow-subtle hover:bg-[#27272A]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>List New Tote</span>
              </button>
            </div>

            <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5E0] overflow-hidden shadow-subtle divide-y divide-[#E5E5E0]">
              {stallProducts.map((product) => (
                <div key={product.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#F2F0EB] shrink-0 border border-[#E5E5E0]">
                      <Image
                        src={product.images[0]}
                        alt={product.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs sm:text-sm text-[#18181B] truncate">
                          {product.title}
                        </h4>
                        {product.is_active === false ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Archived • Received & Sold Out
                          </span>
                        ) : product.stock <= 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Sold Out
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {product.stock} in stock
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#71717A] mt-0.5">
                        {product.material} • {product.capacity_liters}L
                      </p>
                      <p className="text-xs font-black text-[#18181B] mt-1">
                        {formatINR(product.price)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleOpenEditProduct(product)}
                      className="py-1.5 px-3 rounded-lg border border-[#E5E5E0] text-xs font-semibold text-[#18181B] hover:bg-[#F2F0EB] flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(product.id)}
                      className="py-1.5 px-3 rounded-lg border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PAYOUTS & BANK KYC */}
        {activeTab === 'payouts' && (
          <div className="max-w-2xl bg-[#FFFFFF] rounded-3xl border border-[#E5E5E0] p-6 sm:p-8 shadow-subtle space-y-6 animate-fade-in">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider font-bold text-emerald-800">
                Direct Merchant Settlement
              </span>
              <h3 className="text-lg font-bold text-[#18181B]">
                Stripe Express & Bank Payout Setup
              </h3>
              <p className="text-xs text-[#71717A]">
                Tote settles earnings directly into your bank account with zero nodal holding fees.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-emerald-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Bank Account Verified & Active</span>
              </div>
              <p className="text-emerald-800">
                Account: HDFC Bank •••••• 8821 (Mira Shenoy / EarthStitch Studio)
              </p>
              <p className="text-emerald-800">
                Payout frequency: Automatic daily rolling settlement (T+1).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAFAF8] border border-[#E5E5E0] text-xs space-y-3">
              <h4 className="font-bold text-[#18181B]">Next Scheduled Payout</h4>
              <div className="flex justify-between items-baseline">
                <span className="text-[#71717A]">Amount Scheduled:</span>
                <span className="text-base font-black text-[#18181B]">{formatINR(netEarnings)}</span>
              </div>
              <div className="flex justify-between text-[#71717A]">
                <span>Transfer Type:</span>
                <span>NEFT / Direct UPI IMPS</span>
              </div>
              <div className="flex justify-between text-[#71717A]">
                <span>Scheduled Date:</span>
                <span>Tomorrow at 09:00 AM IST</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: DISPATCH / FULFILLMENT MODAL */}
      {fulfillmentModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18181B]/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5E0] max-w-md w-full p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E0]">
              <h3 className="font-bold text-base text-[#18181B]">
                Fulfill Bag Dispatch
              </h3>
              <button
                type="button"
                onClick={() => setFulfillmentModalItem(null)}
                className="p-1 text-[#71717A] hover:text-[#18181B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-1">
              <p className="font-semibold text-[#18181B]">
                {fulfillmentModalItem.item.title}
              </p>
              <p className="text-[#71717A]">
                Order #{fulfillmentModalItem.orderId} • Qty {fulfillmentModalItem.item.quantity}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#18181B] block mb-1">
                  Courier / Logistics Partner
                </label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0] focus:ring-1 focus:ring-[#18181B] outline-none"
                >
                  <option value="BlueDart Express">BlueDart Express</option>
                  <option value="Delhivery Surface">Delhivery Surface</option>
                  <option value="India Post SpeedPost">India Post SpeedPost</option>
                  <option value="FedEx India">FedEx India</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#18181B] block mb-1">
                  Estimated Buyer Receiving Date &amp; Time
                </label>
                <input
                  type="text"
                  value={deliveryDateEstimate}
                  onChange={(e) => setDeliveryDateEstimate(e.target.value)}
                  placeholder="e.g. Sep 18, 2026, 3:00 PM IST"
                  className="w-full p-2.5 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0] focus:ring-1 focus:ring-[#18181B] outline-none"
                />
                <p className="text-[10px] text-[#71717A] mt-1">
                  The buyer will see this delivery arrival window in their tracking dashboard.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFulfillmentModalItem(null)}
                className="py-2.5 px-4 rounded-xl border border-[#E5E5E0] text-xs font-semibold text-[#18181B] hover:bg-[#F2F0EB]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!trackingNumber.trim() || !deliveryDateEstimate.trim()}
                onClick={handleConfirmFulfillment}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#18181B] text-white text-xs font-semibold hover:bg-[#27272A] disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Schedule &amp; Notify Buyer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: REAL UPI 5-DIGIT VERIFICATION MODAL */}
      {verificationModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18181B]/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5E0] max-w-md w-full p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E0]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-[#18181B]">
                  Verify UPI Payment Receipt
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setVerificationModalOrder(null)}
                className="p-1 text-[#71717A] hover:text-[#18181B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1.5">
              <div className="flex justify-between font-bold text-amber-950">
                <span>Order #{verificationModalOrder.id}</span>
                <span>Amount: {formatINR(verificationModalOrder.total_amount)}</span>
              </div>
              <p className="text-amber-900">
                Buyer: <span className="font-semibold">{verificationModalOrder.buyer_name}</span> ({verificationModalOrder.buyer_phone})
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-amber-200">
                <span className="text-amber-800">Buyer Reported UTR:</span>
                <span className="font-mono font-black text-amber-950 bg-amber-200 px-2 py-0.5 rounded">
                  ...{verificationModalOrder.buyer_transaction_last5 || '84920'}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmUpiPayment} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#18181B] block mb-1">
                  Enter Last 5 Digits of UTR Received in Your UPI / Bank App
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={enteredVerificationDigits}
                    onChange={(e) => setEnteredVerificationDigits(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
                    placeholder="e.g. 84920"
                    className="flex-1 p-3 text-center font-mono font-bold text-lg rounded-xl bg-[#FAFAF8] border border-[#E5E5E0] focus:ring-2 focus:ring-amber-500 outline-none tracking-widest text-[#18181B]"
                  />
                  <button
                    type="button"
                    onClick={() => setEnteredVerificationDigits(verificationModalOrder.buyer_transaction_last5 || '84920')}
                    className="py-3 px-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold whitespace-nowrap"
                  >
                    Match Buyer UTR
                  </button>
                </div>
                <p className="text-[11px] text-[#71717A] mt-1.5">
                  Check your HDFC / PhonePe statement for the transaction from {verificationModalOrder.buyer_name}. If the 5 digits match, payment is confirmed!
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVerificationModalOrder(null)}
                  className="py-2.5 px-4 rounded-xl border border-[#E5E5E0] text-xs font-semibold text-[#18181B] hover:bg-[#F2F0EB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enteredVerificationDigits.length !== 5}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-40"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Payment Received ✅</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VOICE-FIRST MULTILINGUAL ONBOARDING */}
      {isVoiceAssistantOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18181B]/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#FFFFFF] rounded-3xl border border-[#E5E5E0] max-w-lg w-full p-6 shadow-elevated space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#18181B]">
                    Voice-First Artisan Assistant
                  </h3>
                  <p className="text-[10px] text-[#71717A]">
                    Zero-literacy voice cataloging in Indian regional languages
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsVoiceAssistantOpen(false)}
                className="p-1 text-[#71717A] hover:text-[#18181B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Language Selection */}
            <div className="flex gap-2">
              {[
                { id: 'ml', label: 'മലയാളം (Malayalam)' },
                { id: 'hi', label: 'हिन्दी (Hindi)' },
                { id: 'ta', label: 'தமிழ் (Tamil)' },
                { id: 'en', label: 'English' },
              ].map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setSelectedVoiceLang(lang.id as any)}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                    selectedVoiceLang === lang.id
                      ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-xs'
                      : 'border-[#E5E5E0] text-[#71717A] hover:bg-[#FAFAF8]'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Interactive Microphone Pulse Zone */}
            <div className="p-6 rounded-2xl bg-[#FAFAF8] border border-[#E5E5E0] flex flex-col items-center text-center space-y-3">
              <button
                type="button"
                onClick={() => {
                  setIsRecordingVoice(!isRecordingVoice);
                  if (!isRecordingVoice) {
                    setTimeout(() => {
                      if (selectedVoiceLang === 'ml') {
                        setVoiceTranscript(
                          'നമസ്കാരം, ഞാൻ ഫോർട്ട് കൊച്ചിയിലെ മീര ഷെനോയ്. എന്റെ പുതിയ 16oz ഇൻഡിഗോ ടോട്ട് ബാഗ് 1850 രൂപയ്ക്ക് ലിസ്റ്റ് ചെയ്യണം.'
                        );
                      } else if (selectedVoiceLang === 'hi') {
                        setVoiceTranscript(
                          'नमस्ते, मैं जयपुर से ब्लॉक प्रिंटेड कॉटन टोट बैग ₹1600 में 10 पीस लिस्ट करना चाहती हूँ।'
                        );
                      } else {
                        setVoiceTranscript(
                          'List my new organic heavy-duty linen tote bag for ₹1,950 with 15 pieces in stock.'
                        );
                      }
                      setIsRecordingVoice(false);
                    }, 1800);
                  }
                }}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  isRecordingVoice
                    ? 'bg-rose-500 text-white animate-pulse ring-8 ring-rose-100'
                    : 'bg-[#18181B] text-white hover:scale-105 shadow-elevated'
                }`}
              >
                <Mic className="w-8 h-8" />
              </button>

              <div>
                <p className="font-bold text-xs text-[#18181B]">
                  {isRecordingVoice ? 'Listening in regional tongue...' : 'Tap Mic & Speak Naturally'}
                </p>
                <p className="text-[11px] text-[#71717A] mt-0.5">
                  Describe your bag, materials, and selling price.
                </p>
              </div>

              {/* Waveform Visualization Simulation */}
              {isRecordingVoice && (
                <div className="flex items-center gap-1 h-6">
                  {[40, 70, 25, 90, 50, 80, 30, 95, 60, 45].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}%` }}
                      className="w-1 bg-amber-500 rounded-full animate-bounce"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Recognized Speech Transcript */}
            {voiceTranscript && (
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs space-y-2">
                <span className="font-bold text-amber-950 block text-[11px]">
                  Recognized Speech Transcript:
                </span>
                <p className="text-amber-900 font-medium italic">
                  &ldquo;{voiceTranscript}&rdquo;
                </p>
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setProductForm({
                        title: 'Voice-Created Fort Kochi French Indigo Tote',
                        description: 'Created via vernacular voice assistant. 100% natural organic cotton handloom.',
                        price: 1850,
                        stock: 12,
                        material: '16oz Organic Duck Canvas & Leather Handle',
                        dimensions: '38cm x 40cm x 12cm',
                        capacity_liters: 16,
                        strap_drop: '26cm',
                        category: 'Canvas',
                        imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
                        originalImageUrl: '',
                        enhancedImageUrl: '',
                        cloudinaryPublicId: '',
                        audioUrl: '',
                        audioLang: '',
                      });
                      setIsVoiceAssistantOpen(false);
                      setIsProductModalOpen(true);
                      addToast({
                        title: 'Voice Details Transferred!',
                        message: 'Populated catalog listing fields from your voice input.',
                        type: 'success',
                      });
                    }}
                    className="py-1.5 px-3 rounded-lg bg-amber-800 text-white font-bold text-[11px] hover:bg-amber-900 flex items-center gap-1"
                  >
                    <span>Auto-fill Bag Spec Form &rarr;</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: AI SMART CATALOGING STUDIO */}
      {isAiStudioOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18181B]/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#FFFFFF] rounded-3xl border border-[#E5E5E0] max-w-lg w-full p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#18181B]">
                    AI Smart Cataloging Studio
                  </h3>
                  <p className="text-[10px] text-[#71717A]">
                    Automated background decluttering &amp; fair-trade price calculation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiStudioOpen(false)}
                className="p-1 text-[#71717A] hover:text-[#18181B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Before / After AI Enhancement Preview */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#71717A]">
                  Raw Workshop Snapshot
                </span>
                <div className="relative h-36 rounded-xl overflow-hidden bg-zinc-200 border border-zinc-300">
                  <Image
                    src="https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80"
                    alt="Raw photo"
                    fill
                    className="object-cover filter contrast-75 brightness-90"
                  />
                  <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">
                    Raw Clutter
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-emerald-800">
                  AI Enhanced &amp; Isolated
                </span>
                <div className="relative h-36 rounded-xl overflow-hidden bg-[#FAFAF8] border-2 border-emerald-400 shadow-sm">
                  <Image
                    src="https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=400&q=80"
                    alt="Enhanced photo"
                    fill
                    className="object-cover"
                  />
                  <span className="absolute bottom-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    Studio Lighted
                  </span>
                </div>
              </div>
            </div>

            {/* Fair Trade Price Calculator Breakdown */}
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
              <span className="font-bold text-[#18181B] block">
                AI Fair-Trade Pricing Formula (Cost-Plus Method):
              </span>
              <div className="space-y-1 text-[#71717A] text-[11px]">
                <div className="flex justify-between">
                  <span>Raw Rain-fed Cotton &amp; Flax Inputs:</span>
                  <span className="font-semibold text-[#18181B]">₹480</span>
                </div>
                <div className="flex justify-between">
                  <span>Natural Indigo Plant Vat Dye:</span>
                  <span className="font-semibold text-[#18181B]">₹240</span>
                </div>
                <div className="flex justify-between">
                  <span>6 Hours Master Weaver Labor (@₹180/hr):</span>
                  <span className="font-semibold text-[#18181B]">₹1,080</span>
                </div>
                <div className="flex justify-between">
                  <span>GI Tagged Authenticity Premium:</span>
                  <span className="font-semibold text-emerald-700 font-bold">+₹150</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-zinc-200 font-bold text-xs text-[#18181B]">
                  <span>Suggested Fair Retail Price:</span>
                  <span className="text-emerald-700 text-sm font-black">₹1,950</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAiStudioOpen(false)}
                className="py-2.5 px-4 rounded-xl border border-[#E5E5E0] text-xs font-semibold text-[#18181B] hover:bg-[#F2F0EB]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setProductForm({
                    title: 'The AI Studio Indigo Heritage Tote',
                    description: 'Optimized via Tote AI Cataloging Studio. Calculated fair-trade artisan living wage.',
                    price: 1950,
                    stock: 15,
                    material: '16oz Organic Duck Canvas & Vegetable Leather',
                    dimensions: '40cm x 38cm x 12cm',
                    capacity_liters: 18,
                    strap_drop: '27cm',
                    category: 'Canvas',
                    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80',
                    originalImageUrl: '',
                    enhancedImageUrl: '',
                    cloudinaryPublicId: '',
                    audioUrl: '',
                    audioLang: '',
                  });
                  setIsAiStudioOpen(false);
                  setIsProductModalOpen(true);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#18181B] text-white text-xs font-semibold hover:bg-[#27272A] flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Apply AI Spec to New Bag</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: INFLUENCER AFFILIATE ENGINE ("TOTE MATCH") */}
      {isAffiliateEngineOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18181B]/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#FFFFFF] rounded-3xl border border-[#E5E5E0] max-w-lg w-full p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#18181B]">
                    Tote Match • Influencer Affiliate Engine
                  </h3>
                  <p className="text-[10px] text-[#71717A]">
                    Direct creator commissions without marketing middlemen
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAffiliateEngineOpen(false)}
                className="p-1 text-[#71717A] hover:text-[#18181B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Generated Creator Link */}
            <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 text-xs space-y-1.5">
              <span className="font-bold text-purple-950 block text-[11px]">
                Your Artisan Stall Affiliate Link (10% Creator Commission):
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`https://tote.in/ref/@ananya_lifestyle?stall=${stall?.slug}`}
                  className="flex-1 p-2 rounded-lg bg-white border border-purple-300 font-mono text-[11px] text-purple-900 outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(`https://tote.in/ref/@ananya_lifestyle?stall=${stall?.slug}`);
                    addToast({ title: 'Link Copied', message: 'Affiliate tracking URL copied.', type: 'success' });
                  }}
                  className="py-2 px-3 rounded-lg bg-purple-700 text-white font-bold text-[11px] hover:bg-purple-800 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {/* Live Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0]">
                <span className="text-[10px] text-[#71717A] block">Clicks</span>
                <span className="font-black text-sm text-[#18181B]">1,420</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0]">
                <span className="text-[10px] text-[#71717A] block">Orders</span>
                <span className="font-black text-sm text-emerald-700">34</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0]">
                <span className="text-[10px] text-[#71717A] block">Paid Influencer</span>
                <span className="font-black text-sm text-purple-700">{formatINR(6460)}</span>
              </div>
            </div>

            {/* Creator Match Directory */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#18181B] block">
                Verified Creators Promoting Your Workshop:
              </span>
              <div className="space-y-1.5 text-xs">
                {[
                  { name: 'Ananya Deshmukh', followers: '124K (Sustainable Fashion)', sales: 18 },
                  { name: 'Kochi Heritage Vlogs', followers: '68K (Kerala Travel & Craft)', sales: 16 },
                ].map((c, i) => (
                  <div key={i} className="p-2.5 rounded-xl border border-[#E5E5E0] flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#18181B]">{c.name}</p>
                      <p className="text-[10px] text-[#71717A]">{c.followers}</p>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700">
                      {c.sales} sales driven
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: WHATSAPP & SMS INTEGRATION PREVIEW */}
      {isWhatsAppPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18181B]/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#FFFFFF] rounded-3xl border border-[#E5E5E0] max-w-md w-full p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-green-100 text-green-800 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#18181B]">
                    WhatsApp &amp; SMS Layer
                  </h3>
                  <p className="text-[10px] text-[#71717A]">
                    Live phone notifications without desktop dashboard login
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWhatsAppPreviewOpen(false)}
                className="p-1 text-[#71717A] hover:text-[#18181B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Chat Bubble Simulation */}
            <div className="p-4 rounded-2xl bg-[#EFEAE2] border border-[#E5E5E0] space-y-3">
              <div className="text-center">
                <span className="text-[10px] bg-white/80 px-2 py-0.5 rounded-full text-[#71717A]">
                  WhatsApp Verified Enterprise Bot • +91 98401 23094
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white shadow-xs text-xs space-y-1.5 max-w-[90%]">
                <p className="font-bold text-[#18181B]">
                  🔔 New Tote Sale &amp; UPI Verification Alert!
                </p>
                <p className="text-[#71717A]">
                  Buyer <span className="font-semibold text-[#18181B]">Tara Mukherjee</span> paid <span className="font-bold text-emerald-700">₹3,400</span> for Order #TOT-84920.
                </p>
                <p className="font-mono text-[11px] text-amber-900 bg-amber-50 p-1 rounded border border-amber-200">
                  Buyer claims UTR last 5: 84920
                </p>
                <p className="text-[10px] text-[#71717A]">
                  Reply &ldquo;CONFIRM&rdquo; or click below to schedule delivery directly.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
              <span className="font-bold text-emerald-950">SMS &amp; WhatsApp Webhook Status:</span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                Active • +91 98765 43210
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: MICRO-LOGISTICS WAYBILL GENERATOR */}
      {isWaybillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18181B]/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#FFFFFF] rounded-3xl border border-[#E5E5E0] max-w-lg w-full p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#18181B]">
                    Micro-Logistics &amp; Waybill Generator
                  </h3>
                  <p className="text-[10px] text-[#71717A]">
                    Automated pickup waybill and transparent instant split payout
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWaybillModalOpen(false)}
                className="p-1 text-[#71717A] hover:text-[#18181B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Waybill Card */}
            <div className="p-4 rounded-2xl bg-[#FAFAF8] border border-[#E5E5E0] space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold">INDIA POST SPEEDPOST / BLUEDART</span>
                <span>AWB: SP-882194301-IN</span>
              </div>
              <div className="space-y-1">
                <p><span className="font-bold">FROM:</span> {stall?.name}, {stall?.location}</p>
                <p><span className="font-bold">TO:</span> Tara Mukherjee, Indiranagar, Bangalore - 560038</p>
                <p><span className="font-bold">CONTENTS:</span> 1x Organic 16oz Indigo Canvas Tote (GI Tagged)</p>
              </div>

              {/* Barcode Simulation */}
              <div className="p-3 bg-white rounded-lg border border-[#E5E5E0] text-center space-y-1">
                <div className="h-10 w-4/5 mx-auto bg-repeat-x flex items-center justify-center font-bold tracking-widest text-xs border border-zinc-300">
                  ||| | |||| || | ||||| ||| |||| | ||
                </div>
                <p className="text-[10px] text-[#71717A]">SP882194301IN</p>
              </div>
            </div>

            {/* Split Settlement Breakdown */}
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
              <span className="font-bold text-emerald-950 block">
                Instant UPI IMPS Settlement Ledger:
              </span>
              <div className="flex justify-between text-[#71717A]">
                <span>Artisan Direct Take-Home (95%):</span>
                <span className="font-bold text-emerald-800">₹1,757.50</span>
              </div>
              <div className="flex justify-between text-[#71717A]">
                <span>Logistics &amp; Infrastructure Fee (5%):</span>
                <span className="font-semibold text-[#18181B]">₹92.50</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 px-4 rounded-xl bg-[#18181B] text-white text-xs font-semibold hover:bg-[#27272A] flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Waybill Label</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PACKING SLIP PRINTABLE MODAL */}
      {packingSlipOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18181B]/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5E0] max-w-lg w-full p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E0]">
              <h3 className="font-bold text-base text-[#18181B]">
                Packing Slip: #{packingSlipOrder.order.id}
              </h3>
              <button
                type="button"
                onClick={() => setPackingSlipOrder(null)}
                className="p-1 text-[#71717A] hover:text-[#18181B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0] space-y-3 text-xs font-mono">
              <div className="flex justify-between border-b pb-2">
                <span>ARTISAN: {stall?.name}</span>
                <span>DATE: {new Date().toLocaleDateString()}</span>
              </div>
              <div>
                <p className="font-bold">SHIP TO:</p>
                <p>{packingSlipOrder.order.shipping_address.name}</p>
                <p>{packingSlipOrder.order.shipping_address.street}</p>
                <p>{packingSlipOrder.order.shipping_address.city} - {packingSlipOrder.order.shipping_address.postalCode}</p>
                <p>Phone: {packingSlipOrder.order.shipping_address.phone}</p>
              </div>
              <div className="border-t pt-2 space-y-1">
                <p className="font-bold">ITEM:</p>
                <p>{packingSlipOrder.item.quantity}x {packingSlipOrder.item.title}</p>
                <p>Handmade natural fiber bag. Inspect seams before final packing.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2 px-4 rounded-xl bg-[#18181B] text-white text-xs font-semibold hover:bg-[#27272A] flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Slip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PRODUCT */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18181B]/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5E0] max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E0]">
              <h3 className="font-bold text-base text-[#18181B]">
                {editingProduct ? 'Edit Bag Specifications' : 'List New Artisan Bag'}
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 text-[#71717A] hover:text-[#18181B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#18181B] block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  placeholder="e.g. The Kyoto Indigo French Linen Tote"
                  className="w-full p-2.5 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0] outline-none focus:ring-1 focus:ring-[#18181B]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#18181B] block">
                  Craftsmanship Description
                </label>

                {/* Real Voice Input & Vernacular Speech-to-Text Component */}
                <VoiceInputButton
                  currentValue={productForm.description}
                  initialAudioUrl={productForm.audioUrl}
                  onAudioReady={(audioUrl, lang) => {
                    setProductForm((prev) => ({
                      ...prev,
                      audioUrl: audioUrl || '',
                      audioLang: lang || '',
                    }));
                  }}
                  onTranscription={(text) => {
                    setProductForm((prev) => ({
                      ...prev,
                      description: text,
                    }));
                    addToast({
                      title: 'Voice Transcribed! 🎙️',
                      message: 'Spoken craft details added to description. You can edit or auto-fill listing fields.',
                      type: 'success',
                    });
                  }}
                  onProductGenerated={(aiProduct) => {
                    setProductForm((prev) => ({
                      ...prev,
                      title: aiProduct.title || prev.title,
                      description: aiProduct.description || prev.description,
                      category: aiProduct.category || prev.category,
                      price: Number(aiProduct.price) || prev.price,
                      material: aiProduct.material || prev.material,
                      dimensions: aiProduct.dimensions || prev.dimensions,
                      capacity_liters: Number(aiProduct.capacity_liters) || prev.capacity_liters,
                      strap_drop: aiProduct.strap_drop || prev.strap_drop,
                    }));
                    addToast({
                      title: 'Listing Details Auto-Filled! ✨',
                      message: 'AI analyzed your voice recording to set title, category, material, and fair price.',
                      type: 'success',
                    });
                  }}
                />

                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Describe your weaving, natural mordant dyeing, loom setup, and authentic materials..."
                  className="w-full p-2.5 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0] outline-none focus:ring-1 focus:ring-[#18181B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#18181B] block mb-1">Base Price (INR)</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0] outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#18181B] block mb-1">Stock Units</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#18181B] block mb-1">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0] outline-none"
                  >
                    <option value="Canvas">Heavy-Duty Canvas</option>
                    <option value="Crochet">Artisan Crochet</option>
                    <option value="Everyday">Everyday</option>
                    <option value="Work & Laptop">Work & Laptop</option>
                    <option value="Eco Linen">Eco Linen</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-[#18181B] block mb-1">Capacity (Liters)</label>
                  <input
                    type="number"
                    value={productForm.capacity_liters}
                    onChange={(e) => setProductForm({ ...productForm, capacity_liters: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#18181B] block mb-1">Material Specs</label>
                <input
                  type="text"
                  value={productForm.material}
                  onChange={(e) => setProductForm({ ...productForm, material: e.target.value })}
                  placeholder="e.g. 16oz Organic Duck Canvas & Full-Grain Leather"
                  className="w-full p-2.5 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0] outline-none"
                />
              </div>

              {/* Real Camera & Cloudinary Product Photo Uploader */}
              <div className="space-y-1.5">
                <label className="font-semibold text-[#18181B] block">
                  Product Photography (Cloudinary + AI Enhancement)
                </label>
                <ProductPhotoUploader
                  initialImageUrl={productForm.imageUrl}
                  onImageChange={({ selectedUrl, originalUrl, enhancedUrl, cloudinaryPublicId }) => {
                    setProductForm((prev) => ({
                      ...prev,
                      imageUrl: selectedUrl,
                      originalImageUrl: originalUrl,
                      enhancedImageUrl: enhancedUrl,
                      cloudinaryPublicId: cloudinaryPublicId,
                    }));
                  }}
                />

                {/* AI Vision Auto-Catalog Button */}
                {productForm.imageUrl && (
                  <div className="pt-1 font-mono">
                    <button
                      type="button"
                      disabled={isAnalyzingImage}
                      onClick={handleAnalyzeImageWithVision}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700 hover:from-amber-800 hover:to-orange-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-2 border-[#18181B] shadow-[2px_2px_0px_0px_#18181B] active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-50"
                    >
                      {isAnalyzingImage ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
                          <span>Gemini Vision inspecting craft weave &amp; dyes...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-200" />
                          <span>✨ AI Vision: Auto-Fill Catalog from Photo</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-[#71717A] mt-1.5 text-center">
                      AI analyzes fabric weave, natural dyes &amp; computes fair-trade living wage automatically.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-[#E5E5E0] text-xs font-semibold text-[#18181B] hover:bg-[#F2F0EB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#18181B] text-white text-xs font-semibold hover:bg-[#27272A]"
                >
                  {editingProduct ? 'Save Changes' : 'Publish to Stall'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORMAL GST E-INVOICE MODAL FOR B2B & GOVERNMENT (GeM) */}
      {selectedInvoicePO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 font-mono">
          <div className="bg-white border-2 border-[#18181B] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-[8px_8px_0px_0px_#18181B] space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b-2 border-[#18181B] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 bg-[#18181B] text-white">
                    TAX E-INVOICE
                  </span>
                  <span className="text-xs text-[#71717A]">
                    GeM &middot; CPSE COMPLIANT
                  </span>
                </div>
                <h3 className="font-black text-lg text-[#18181B] mt-1">
                  INVOICE #{selectedInvoicePO.id.replace('B2B-', 'INV-2026-')}
                </h3>
                <p className="text-[11px] text-[#71717A]">
                  Sanction Order: {selectedInvoicePO.sanction_order_ref} &middot; PO: {selectedInvoicePO.po_number}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedInvoicePO(null)}
                className="p-1 border border-[#18181B] hover:bg-[#FAFAF8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Supplier & Recipient Addresses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border border-[#18181B] p-3 bg-[#FAFAF8]">
              <div>
                <span className="text-[10px] text-[#71717A] uppercase font-bold block">
                  Supplier / Registered Artisan
                </span>
                <p className="font-bold text-[#18181B]">{stall?.name || 'EarthStitch Studio'}</p>
                <p className="text-[11px] text-[#52525B]">Ernakulam Handloom Cluster, Kochi, Kerala</p>
                <p className="text-[11px] text-[#52525B]">GSTIN: 32AAECE1234F1Z5</p>
                <p className="text-[11px] text-[#52525B]">UDYAM: {session?.gemUdyamId || 'UDYAM-KL-07-0049120'}</p>
              </div>

              <div>
                <span className="text-[10px] text-[#71717A] uppercase font-bold block">
                  Billed To / Procuring Entity
                </span>
                <p className="font-bold text-[#18181B]">{selectedInvoicePO.buyer_entity}</p>
                <p className="text-[11px] text-[#52525B]">GSTIN: {selectedInvoicePO.buyer_gstin}</p>
                <p className="text-[11px] text-[#52525B]">Place of Supply: Inter-State / Intra-State</p>
                <p className="text-[11px] text-[#52525B]">Due Date: {selectedInvoicePO.delivery_deadline}</p>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="border-2 border-[#18181B] text-xs">
              <div className="grid grid-cols-12 bg-[#18181B] text-white p-2 font-bold text-[11px] uppercase">
                <span className="col-span-6">Description of Handicraft Goods</span>
                <span className="col-span-2 text-center">HSN Code</span>
                <span className="col-span-1 text-center">Qty</span>
                <span className="col-span-3 text-right">Amount (INR)</span>
              </div>

              <div className="grid grid-cols-12 p-2.5 border-b border-zinc-300 items-center">
                <div className="col-span-6">
                  <p className="font-bold text-[#18181B]">{selectedInvoicePO.product_title}</p>
                  <p className="text-[10px] text-[#71717A]">
                    QCI Handloom Certified &middot; 100% Organic Canvas &amp; Heritage Weave
                  </p>
                </div>
                <span className="col-span-2 text-center text-[#52525B]">42021290</span>
                <span className="col-span-1 text-center font-bold">{selectedInvoicePO.quantity}</span>
                <span className="col-span-3 text-right font-bold">
                  {formatINR(selectedInvoicePO.quantity * selectedInvoicePO.unit_price)}
                </span>
              </div>

              {/* Tax Calculations (12% GST = 6% CGST + 6% SGST) */}
              <div className="p-3 bg-[#FAFAF8] space-y-1 text-xs">
                <div className="flex justify-between text-[#52525B]">
                  <span>Taxable Value (Before Tax):</span>
                  <span>{formatINR(selectedInvoicePO.total_value * 0.88)}</span>
                </div>
                <div className="flex justify-between text-[#52525B]">
                  <span>CGST (6%):</span>
                  <span>{formatINR(selectedInvoicePO.total_value * 0.06)}</span>
                </div>
                <div className="flex justify-between text-[#52525B]">
                  <span>SGST (6%):</span>
                  <span>{formatINR(selectedInvoicePO.total_value * 0.06)}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-[#18181B] pt-2 border-t-2 border-[#18181B]">
                  <span>TOTAL INVOICED AMOUNT (INR):</span>
                  <span>{formatINR(selectedInvoicePO.total_value)}</span>
                </div>
              </div>
            </div>

            {/* Bank Payout Account & Signatory */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div className="border border-[#18181B] p-2.5 bg-[#FAFAF8]">
                <span className="text-[10px] text-[#71717A] uppercase font-bold block">
                  Artisan Direct Settlement Account
                </span>
                <p className="font-bold text-[#18181B]">Bank: HDFC Bank Ltd</p>
                <p className="text-[11px] text-[#52525B]">A/C: 50200088219412 (Mira Shenoy)</p>
                <p className="text-[11px] text-[#52525B]">IFSC: HDFC0001234 &middot; UPI: mira@okhdfc</p>
              </div>

              <div className="border border-[#18181B] p-2.5 bg-white text-center flex flex-col justify-between">
                <span className="text-[10px] text-[#71717A] uppercase font-bold">
                  Authorized Signatory &amp; Seal
                </span>
                <div className="py-2 text-xs font-bold text-[#18181B] uppercase tracking-widest text-emerald-800">
                  [DIGITALLY SIGNED VIA GeM API]
                </div>
                <p className="text-[10px] text-[#71717A]">For EarthStitch Handloom Studio</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t-2 border-[#18181B]">
              <button
                type="button"
                onClick={() => setSelectedInvoicePO(null)}
                className="py-2 px-4 border-2 border-[#18181B] text-xs font-bold uppercase hover:bg-zinc-100"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2 px-5 bg-[#18181B] text-white text-xs font-bold uppercase border-2 border-[#18181B] shadow-[2px_2px_0px_0px_#71717A] flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Formal GST Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONSIGNMENT & BULK DISPATCH TRACKING MODAL */}
      {isConsignmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 font-mono">
          <div className="bg-white border-2 border-[#18181B] max-w-md w-full p-6 shadow-[8px_8px_0px_0px_#18181B] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#18181B] pb-2">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-700" />
                <h3 className="font-bold text-sm uppercase text-[#18181B]">
                  Update Bulk Consignment Dispatch
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConsignmentModalOpen(null)}
                className="p-1 border border-[#18181B] hover:bg-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-1 bg-[#FAFAF8] p-3 border border-[#18181B]">
              <p className="font-bold text-[#18181B]">{isConsignmentModalOpen.buyer_entity}</p>
              <p className="text-[11px] text-[#52525B]">
                PO #{isConsignmentModalOpen.po_number} &middot; {isConsignmentModalOpen.quantity} units
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-[#18181B] block uppercase">
                Consignment Waybill / SpeedPost Bulk Docket #
              </label>
              <input
                type="text"
                required
                value={consignmentInput}
                onChange={(e) => setConsignmentInput(e.target.value)}
                placeholder="e.g. SPEEDPOST-BULK-99104"
                className="w-full p-2.5 border-2 border-[#18181B] bg-[#FAFAF8] text-xs font-mono outline-none focus:bg-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConsignmentModalOpen(null)}
                className="py-2 px-4 border-2 border-[#18181B] text-xs font-bold uppercase hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  updateB2BOrderStatus(
                    isConsignmentModalOpen.id,
                    'bulk_dispatched',
                    consignmentInput.trim()
                  );
                  setIsConsignmentModalOpen(null);
                  loadData();
                  addToast({
                    title: 'Consignment Dispatched!',
                    message: `Bulk tracking ${consignmentInput.trim()} synchronized with GeM / CPSE portal.`,
                    type: 'success',
                  });
                }}
                className="flex-1 py-2 px-4 bg-[#18181B] text-white text-xs font-bold uppercase border-2 border-[#18181B] shadow-[2px_2px_0px_0px_#71717A] flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm Bulk Dispatch</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REAL-TIME BUYER-SELLER CONVERSATION MODAL */}
      {chatOrder && (
        <OrderChatModal
          order={chatOrder}
          currentRole="seller"
          onClose={() => setChatOrder(null)}
          onOrderUpdated={() => loadData()}
        />
      )}
    </div>
  );
}
