'use client';

import { create } from 'zustand';
import { Product } from '../lib/types';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface StallCartGroup {
  stallId: string;
  stallName: string;
  stallSlug?: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
}

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
  isQuickViewOpen: boolean;
  selectedProductForQuickView: Product | null;

  // Actions
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setCartOpen: (open: boolean) => void;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;

  // Computed calculations
  getTotalItems: () => number;
  getSubtotal: () => number;
  getShippingTotal: () => number;
  getGrandTotal: () => number;
  getGroupedByStall: () => StallCartGroup[];
}

const CART_STORAGE_KEY = 'tote_cart_items_v2';

function loadInitialCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistCart(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export const useCartStore = create<CartState>((set, get) => ({
  items: loadInitialCart(),
  isCartOpen: false,
  isQuickViewOpen: false,
  selectedProductForQuickView: null,

  addItem: (product: Product, quantity = 1) => {
    set((state) => {
      const existingIndex = state.items.findIndex(
        (item) => item.product.id === product.id
      );

      let newItems: CartItem[];
      if (existingIndex > -1) {
        newItems = [...state.items];
        const newQty = Math.min(
          product.stock,
          newItems[existingIndex].quantity + quantity
        );
        newItems[existingIndex].quantity = newQty;
      } else {
        newItems = [
          ...state.items,
          { product, quantity: Math.min(product.stock, quantity) },
        ];
      }
      persistCart(newItems);
      return { items: newItems, isCartOpen: true };
    });
  },

  removeItem: (productId: string) => {
    set((state) => {
      const updated = state.items.filter((i) => i.product.id !== productId);
      persistCart(updated);
      return { items: updated };
    });
  },

  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set((state) => {
      const updated = state.items.map((item) => {
        if (item.product.id === productId) {
          return {
            ...item,
            quantity: Math.min(item.product.stock, quantity),
          };
        }
        return item;
      });
      persistCart(updated);
      return { items: updated };
    });
  },

  clearCart: () => {
    persistCart([]);
    set({ items: [], isCartOpen: false });
  },

  setCartOpen: (open: boolean) => {
    set({ isCartOpen: open });
  },

  openQuickView: (product: Product) => {
    set({ selectedProductForQuickView: product, isQuickViewOpen: true });
  },

  closeQuickView: () => {
    set({ selectedProductForQuickView: null, isQuickViewOpen: false });
  },

  getTotalItems: () => {
    return get().items.reduce((acc, item) => acc + item.quantity, 0);
  },

  getSubtotal: () => {
    return get().items.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0
    );
  },

  getGroupedByStall: () => {
    const items = get().items;
    const stallMap = new Map<string, StallCartGroup>();

    for (const cartItem of items) {
      const stallId = cartItem.product.stall_id;
      const stallName = cartItem.product.stall_name || 'Independent Artisan';
      const stallSlug = cartItem.product.stall_slug || '';

      if (!stallMap.has(stallId)) {
        stallMap.set(stallId, {
          stallId,
          stallName,
          stallSlug,
          items: [],
          subtotal: 0,
          shipping: 0,
        });
      }

      const group = stallMap.get(stallId)!;
      group.items.push(cartItem);
      group.subtotal += cartItem.product.price * cartItem.quantity;
    }

    // Compute shipping per stall: Free above ₹1500, else flat ₹75
    const groups = Array.from(stallMap.values());
    for (const group of groups) {
      group.shipping = group.subtotal >= 1500 || group.subtotal === 0 ? 0 : 75;
    }

    return groups;
  },

  getShippingTotal: () => {
    const groups = get().getGroupedByStall();
    return groups.reduce((acc, g) => acc + g.shipping, 0);
  },

  getGrandTotal: () => {
    return get().getSubtotal() + get().getShippingTotal();
  },
}));
