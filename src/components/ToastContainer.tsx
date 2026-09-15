'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  X,
} from 'lucide-react';
import { useToastStore } from '../hooks/useToastStore';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 max-w-sm w-full px-4 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        let icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
        let borderColor = 'border-emerald-500/30';
        let bgGradient = 'from-emerald-950/40 to-slate-900/95';

        if (toast.type === 'error') {
          icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
          borderColor = 'border-rose-500/30';
          bgGradient = 'from-rose-950/40 to-slate-900/95';
        } else if (toast.type === 'warning') {
          icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
          borderColor = 'border-amber-500/30';
          bgGradient = 'from-amber-950/40 to-slate-900/95';
        } else if (toast.type === 'info') {
          icon = <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />;
          borderColor = 'border-cyan-500/30';
          bgGradient = 'from-cyan-950/40 to-slate-900/95';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r ${bgGradient} backdrop-blur-xl border ${borderColor} shadow-2xl text-slate-100 animate-in fade-in slide-in-from-bottom-5 duration-300`}
          >
            <div className="flex items-start gap-3">
              {icon}
              <div className="space-y-0.5">
                <h4 className="font-bold text-sm text-white leading-tight">
                  {toast.title}
                </h4>
                {toast.description && (
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {toast.description}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors shrink-0"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
