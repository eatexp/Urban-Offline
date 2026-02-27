/**
 * Framer Motion animation presets
 * Matches DESIGN_SYSTEM.md §6 Animation standards:
 * - 0.15–0.35s durations
 * - iOS spring physics / Material easing
 * - Purpose-driven motion (not decorative)
 */

// ─── Entry Animations ─────────────────────────────────────────────

/** Fade in — content appearance (250ms, ease-smooth) */
export const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
};

/** Slide up — cards, sheets, page sections (350ms, spring) */
export const slideUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.35, ease: [0.175, 0.885, 0.32, 1.275] },
};

/** Scale in — buttons, badges, modals (200ms, spring) */
export const scaleIn = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.2, ease: [0.175, 0.885, 0.32, 1.275] },
};

/** Slide from right — navigation transitions */
export const slideRight = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
};

// ─── Stagger Containers ───────────────────────────────────────────

/** Parent container for staggering child animations */
export const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1,
        },
    },
};

/** Child items within a stagger container */
export const staggerItem = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] },
};

// ─── Interactive States ───────────────────────────────────────────

/** Button press haptic — scale down slightly */
export const tapScale = {
    whileTap: { scale: 0.96 },
    transition: { duration: 0.08 },
};

/** Hover lift — cards, interactive surfaces */
export const hoverLift = {
    whileHover: { y: -4 },
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
};

// ─── Page Transition Variants ─────────────────────────────────────

/** For use with AnimatePresence on route changes */
export const pageTransition = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.02 },
    transition: {
        enter: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
        exit: { duration: 0.15, ease: [0.4, 0, 1, 1] },
    },
};

// ─── Utility ──────────────────────────────────────────────────────

/**
 * Respects user's prefers-reduced-motion preference.
 * Use as: transition={reducedMotion() ? { duration: 0 } : slideUp.transition}
 */
export function prefersReducedMotion() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
