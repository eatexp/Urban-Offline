/**
 * HighStakesDeleteModal - High Friction Deletion Confirmation
 * 
 * For large assets (>500MB) and pro-tier models to prevent accidental deletion.
 * Requires typing "DELETE" or long-press (3 seconds) to confirm.
 * 
 * Compliance: .clinerules §1 - Model deletion safety
 *             .clinerules §6 - Haptics feedback
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { HapticsService, ImpactStyle, NotificationType } from '../services/HapticsService';
import { createLogger } from '../utils/logger';

const log = createLogger('HighStakesDeleteModal');

// Size threshold for high-stakes deletion (500MB)
const HIGH_STAKES_SIZE_THRESHOLD = 500 * 1024 * 1024;

  // Long press duration in milliseconds
const LONG_PRESS_DURATION = 3000;

/**
 * Check if an item requires high-stakes deletion
 * @param {Object} item - Item to check (model or content pack)
 * @returns {boolean}
 */
const requiresHighStakesDelete = (item) => {
  if (!item) return false;
  
  // Pro tier always requires high stakes
  if (item.tier === 'pro') return true;
  
  // Large size requires high stakes
  if (item.size && item.size > HIGH_STAKES_SIZE_THRESHOLD) return true;
  
  return false;
};

/**
 * Format bytes to human-readable string
 */
const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

/**
 * High Stakes Delete Modal Component
 */
const HighStakesDeleteModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  item,
  itemType = 'model' // 'model' or 'contentPack'
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [longPressProgress, setLongPressProgress] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const longPressTimerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const inputRef = useRef(null);

  // Trigger haptic warning on open
  useEffect(() => {
    if (isOpen) {
      HapticsService.notification(NotificationType.Warning);
      // Focus input after animation
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  const clearTimers = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    clearTimers();
    setConfirmText('');
    setIsLongPressing(false);
    setLongPressProgress(0);
    onClose();
  };

  const handleConfirm = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    
    try {
      // Heavy haptic feedback on successful deletion
      await HapticsService.impact(ImpactStyle.Heavy);
      await onConfirm();
    } catch (error) {
      log.error('Deletion failed', error);
    } finally {
      setIsDeleting(false);
      handleClose();
    }
  };

  const isConfirmTextValid = confirmText.trim().toUpperCase() === 'DELETE';

  const startLongPress = useCallback(() => {
    if (isDeleting || isLongPressing) return;
    
    setIsLongPressing(true);
    setLongPressProgress(0);
    
    // Update progress every 50ms for smooth animation
    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / LONG_PRESS_DURATION) * 100, 100);
      setLongPressProgress(progress);
      
      if (progress >= 100) {
        clearTimers();
        // Use a ref to avoid dependency issues
        handleConfirmRef.current();
      }
    }, 50);

    // Safety timeout
    longPressTimerRef.current = setTimeout(() => {
      clearTimers();
    }, LONG_PRESS_DURATION + 100);
  }, [isDeleting, isLongPressing]);

  // Use ref to avoid circular dependency
  const handleConfirmRef = useRef(handleConfirm);
  useEffect(() => {
    handleConfirmRef.current = handleConfirm;
  }, [handleConfirm]);

  const endLongPress = useCallback(() => {
    clearTimers();
    setIsLongPressing(false);
    setLongPressProgress(0);
  }, []);

  if (!isOpen || !item) return null;

  const sizeDisplay = formatSize(item.size);
  const isPro = item.tier === 'pro';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="glass-card max-w-md w-full p-6 space-y-5"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center border border-red-500/30"
              >
                <AlertTriangle size={24} className="text-red-400" />
              </motion.div>
              <div>
                <h3 className="text-lg font-bold text-white">High Stakes Deletion</h3>
                <p className="text-sm text-slate-400">
                  This {itemType === 'model' ? 'AI model' : 'content pack'} cannot be easily recovered
                </p>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-2">
              <p className="text-sm text-red-200 font-medium">
                You are about to delete:
              </p>
              <p className="text-lg font-bold text-white">
                {item.name}
              </p>
              <div className="flex items-center gap-4 text-sm text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  {sizeDisplay}
                </span>
                {isPro && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Pro Tier
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                This will remove {sizeDisplay} of data. You will need to re-download it to use this {itemType === 'model' ? 'model' : 'content'} again.
              </p>
            </div>

            {/* Method 1: Type DELETE */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Method 1: Type "DELETE"
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  disabled={isDeleting || isLongPressing}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all disabled:opacity-50"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
                {isConfirmTextValid && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-slate-500">OR</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Method 2: Long Press */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Method 2: Press and Hold (3 seconds)
              </label>
              <button
                onMouseDown={startLongPress}
                onMouseUp={endLongPress}
                onMouseLeave={endLongPress}
                onTouchStart={startLongPress}
                onTouchEnd={endLongPress}
                disabled={isDeleting || isConfirmTextValid}
                className="relative w-full py-4 px-4 rounded-xl bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 text-red-300 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] overflow-hidden"
              >
                {/* Progress bar */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-red-500/30 to-orange-500/30"
                  initial={{ width: '0%' }}
                  animate={{ width: `${longPressProgress}%` }}
                  transition={{ duration: 0.05 }}
                />
                
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLongPressing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Holding... {Math.round(longPressProgress)}%
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Press and Hold to Delete
                    </>
                  )}
                </span>
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleClose}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 rounded-xl bg-white/5 text-slate-300 font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isConfirmTextValid || isDeleting}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-medium hover:from-red-500 hover:to-rose-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Re-export for external use
export { requiresHighStakesDelete };

export default HighStakesDeleteModal;
