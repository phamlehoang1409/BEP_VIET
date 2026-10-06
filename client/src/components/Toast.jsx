import React, { createContext, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Sparkles } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const currentToast = toasts[toasts.length - 1]; // display top modal

  return (
    <ToastContext.Provider value={{ showToast: addToast }}>
      {children}

      {/* CENTER SCREEN MODAL NOTIFICATIONS */}
      {currentToast && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in"
          onClick={() => removeToast(currentToast.id)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#121622] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative overflow-hidden animate-scale-up"
          >
            {/* Top Close Button */}
            <button
              onClick={() => removeToast(currentToast.id)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon Header */}
            <div className="flex justify-center mb-3.5">
              {currentToast.type === 'success' && (
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-md shadow-emerald-500/10">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              )}
              {currentToast.type === 'error' && (
                <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-md shadow-rose-500/10">
                  <AlertCircle className="w-8 h-8" />
                </div>
              )}
              {currentToast.type === 'info' && (
                <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-md shadow-amber-500/10">
                  <Info className="w-8 h-8" />
                </div>
              )}
            </div>

            {/* Title */}
            <h3 className="text-base sm:text-lg font-black tracking-tight">
              {currentToast.type === 'success' ? 'Thông Báo Thành Công' : currentToast.type === 'error' ? 'Lưu Ý / Thông Báo' : 'Thông Báo'}
            </h3>

            {/* Message Body */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium my-3 leading-relaxed">
              {currentToast.message}
            </p>

            {/* Dismiss Button */}
            <div className="mt-4 pt-2">
              <button
                type="button"
                onClick={() => removeToast(currentToast.id)}
                className={`w-full py-2.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition active:scale-95 shadow-md ${
                  currentToast.type === 'success'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/20'
                    : currentToast.type === 'error'
                    ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white hover:from-rose-600 hover:to-red-700 shadow-rose-500/20'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:from-amber-600 hover:to-orange-600 shadow-orange-500/20'
                }`}
              >
                Đã Hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
