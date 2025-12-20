// ============================================================================
// AMBIENT BACKGROUND
// Living, breathing background that creates the ecological atmosphere
// Renders theme-aware gradients, particles, and vignette effects
// ============================================================================

import React, { memo } from 'react';

interface AmbientBackgroundProps {
  /** Show floating particle effects */
  showParticles?: boolean;
  /** Show vignette edge darkening */
  showVignette?: boolean;
  /** Intensity of effects (0-1) */
  intensity?: number;
}

/**
 * AmbientBackground creates an immersive, living atmosphere for the app.
 *
 * Features:
 * - Theme-aware gradient backgrounds that slowly animate
 * - Subtle floating "spore" particles
 * - Vignette effect for depth
 * - Performance-optimized (CSS-only animations)
 * - Mobile-friendly (reduced effects on small screens)
 * - Respects prefers-reduced-motion
 *
 * Usage:
 * ```tsx
 * // In your main layout
 * <AmbientBackground />
 * <main className="relative z-10">
 *   {children}
 * </main>
 * ```
 */
export const AmbientBackground: React.FC<AmbientBackgroundProps> = memo(({
  showParticles = true,
  showVignette = true,
  intensity = 1,
}) => {
  return (
    <>
      {/* Main ambient gradient - slowly breathing colors */}
      <div
        className="ambient-bg"
        style={{ opacity: intensity }}
        aria-hidden="true"
      />

      {/* Floating particles - like spores in the air */}
      {showParticles && (
        <div
          className="ambient-particles"
          aria-hidden="true"
        />
      )}

      {/* Vignette - subtle edge darkening for depth */}
      {showVignette && (
        <div
          className="vignette"
          aria-hidden="true"
        />
      )}
    </>
  );
});

AmbientBackground.displayName = 'AmbientBackground';

export default AmbientBackground;
