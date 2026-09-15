'use client';

import { create } from 'zustand';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

export type ToastOptions = {
  title: string;
  message?: string;
  description?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
};

interface ToastStore {
  toasts: ToastMessage[];
  addToast: (
    optsOrTitle: string | ToastOptions,
    description?: string,
    type?: 'success' | 'info' | 'warning' | 'error'
  ) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (optsOrTitle, description, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);

    let finalTitle = '';
    let finalDesc: string | undefined = undefined;
    let finalType: 'success' | 'info' | 'warning' | 'error' = type;

    if (typeof optsOrTitle === 'object') {
      finalTitle = optsOrTitle.title;
      finalDesc = optsOrTitle.message || optsOrTitle.description;
      finalType = optsOrTitle.type || 'success';
    } else {
      finalTitle = optsOrTitle;
      finalDesc = description;
      finalType = type;
    }

    set((state) => ({
      toasts: [...state.toasts, { id, title: finalTitle, description: finalDesc, type: finalType }],
    }));

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4500);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
