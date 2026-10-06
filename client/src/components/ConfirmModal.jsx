import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X, AlertCircle } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'Xác Nhận Hành Động',
  message = 'Bạn có chắc chắn muốn thực hiện thao tác này không?',
  confirmText = 'Xác Nhận',
  cancelText = 'Hủy Bỏ',
  confirmType = 'danger', // 'danger' | 'warning' | 'primary'
  loading = false,
  onConfirm,
  onCancel
}) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div className="bg-[#161922] border border-amber-500/30 text-white rounded-3xl p-6 sm:p-7 w-full max-w-sm shadow-2xl text-center space-y-4 animate-scale-up relative">
        {/* Close X */}
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div
          className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-lg ${
            confirmType === 'danger'
              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-rose-500/20'
              : confirmType === 'warning'
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-amber-500/20'
              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-emerald-500/20'
          }`}
        >
          {confirmType === 'danger' ? (
            <Trash2 className="w-7 h-7" />
          ) : confirmType === 'warning' ? (
            <AlertTriangle className="w-7 h-7" />
          ) : (
            <AlertCircle className="w-7 h-7" />
          )}
        </div>

        {/* Text */}
        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition border border-slate-700 disabled:opacity-50 active:scale-95"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-3 rounded-2xl text-xs font-black transition active:scale-95 shadow-lg disabled:opacity-50 flex items-center justify-center gap-1.5 ${
              confirmType === 'danger'
                ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/30'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 shadow-amber-500/30'
            }`}
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
