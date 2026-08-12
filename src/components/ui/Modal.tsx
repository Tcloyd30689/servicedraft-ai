'use client';

import {
  type ReactNode,
  useEffect,
  useCallback,
  useState,
  useId,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import {
  registerOverlay,
  unregisterOverlay,
  isTopOverlay,
  subscribeOverlays,
  getOverlayDepth,
} from '@/lib/overlayStack';

/**
 * Z-index for the first (bottom-most) open modal. Each additional stacked modal
 * is offset by Z_STEP, so a nested modal's backdrop sits ABOVE the modal it
 * covers and actually dims it. Depth 1 keeps the original 200 / 210 values, so
 * a single modal renders exactly as it always has.
 */
const BASE_BACKDROP_Z = 200;
const BASE_CONTAINER_Z = 210;
const Z_STEP = 20;

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  width = 'max-w-[850px]',
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const overlayId = useId();

  // 1-based stack depth, read straight from the external stack rather than
  // mirrored into state (a synchronous setState in an effect is a lint error).
  // Falls back to 1 while closing: the entry is already popped, so the exiting
  // layer fades out at the base z-index. It is still painted last in the portal
  // order, so it stays visually on top for the 200ms fade.
  const liveDepth = useSyncExternalStore(
    subscribeOverlays,
    () => getOverlayDepth(overlayId),
    () => 0,
  );
  const depth = liveDepth || 1;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Stack registration. Depends ONLY on isOpen/overlayId — if `onClose` were in
  // here, a parent re-render would pop and re-push this modal, floating it above
  // its own nested children and inverting the stack.
  useEffect(() => {
    if (!isOpen) return;
    registerOverlay(overlayId);
    return () => unregisterOverlay(overlayId);
  }, [isOpen, overlayId]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Only the frontmost modal closes. Without this guard every open modal's
      // onClose fired at once and one Escape collapsed the whole stack.
      if (e.key === 'Escape' && isTopOverlay(overlayId)) onClose();
    },
    [overlayId, onClose],
  );

  // Listener is a separate effect so it can re-attach freely as `onClose`
  // changes identity, without ever disturbing the stack above.
  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  // The frontmost backdrop covers everything beneath it, so a click already
  // lands on the top layer. Guarded anyway to make the invariant explicit.
  const handleBackdropClick = useCallback(() => {
    if (isTopOverlay(overlayId)) onClose();
  }, [overlayId, onClose]);

  if (!mounted) return null;

  const backdropZ = BASE_BACKDROP_Z + (depth - 1) * Z_STEP;
  const containerZ = BASE_CONTAINER_Z + (depth - 1) * Z_STEP;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/75 backdrop-blur-[10px]"
            style={{ zIndex: backdropZ }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
          />

          {/* Modal container — centers modal in viewport */}
          <div
            className="fixed inset-0 p-4 flex items-center justify-center pointer-events-none"
            style={{ zIndex: containerZ }}
          >
            <motion.div
              className={`w-[90vw] ${width} pointer-events-auto
                bg-[var(--bg-modal)] border-2 border-[var(--modal-border)] rounded-[23px]
                backdrop-blur-xl shadow-[var(--shadow-glow-lg)]`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <div className="p-6 md:p-8 max-h-[90vh] overflow-y-auto rounded-[23px]">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  {title && (
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">{title}</h2>
                  )}
                  <button
                    onClick={onClose}
                    className="ml-auto text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer p-1"
                    aria-label="Close modal"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Content */}
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
