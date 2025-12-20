// ============================================================================
// PORTAL COMPONENT
// Renders children to document.body, bypassing CSS transform containment
// This fixes position:fixed issues when parent elements have transform
// ============================================================================

import { useEffect, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: ReactNode;
  /** Optional container to render into (defaults to document.body) */
  container?: Element | null;
}

/**
 * Portal renders children into a DOM node outside the parent component hierarchy.
 *
 * Use this to wrap modals and overlays that need position:fixed to work correctly
 * when rendered inside containers with CSS transform (which creates a new stacking context).
 *
 * @example
 * <Portal>
 *   <div className="fixed inset-0 bg-black/50">
 *     <ModalContent />
 *   </div>
 * </Portal>
 */
export const Portal: React.FC<PortalProps> = ({ children, container }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return null;
  }

  const targetContainer = container || document.body;

  return createPortal(children, targetContainer);
};

export default Portal;
