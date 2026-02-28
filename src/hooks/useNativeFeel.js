/**
 * useNativeFeel - Premium native iOS/Android feel optimizations
 * 
 * Applies platform-specific tweaks for:
 * - iOS: Rubber-band scrolling, spring animations, status bar integration
 * - Android: Material elevation, ripple effects, edge-to-edge
 * 
 * Compliance: .clinerules §3 - iOS/Android feature parity
 *             .clinerules §6 - Native haptics
 */

import { useEffect, useCallback } from 'react';
import { isIOSNative, isAndroidNative, isNativeMobile } from '../utils/platform';
import { HapticsService } from '../services/HapticsService';

/**
 * Hook for applying native platform feel
 */
export const useNativeFeel = () => {
    // Define functions first (before useEffect)
    const applyIOSFeel = useCallback(() => {
        // Enable rubber-band scrolling (iOS signature feel)
        document.body.style.overscrollBehavior = 'auto';
        document.documentElement.style.overscrollBehavior = 'auto';

        // Disable callout menus (prevents long-press menu, feels more native)
        document.documentElement.style.webkitTouchCallout = 'none';
        document.documentElement.style.webkitUserSelect = 'none';

        // Enable momentum scrolling
        document.body.style.webkitOverflowScrolling = 'touch';

        // iOS-safe area insets for edge-to-edge
        document.documentElement.style.setProperty(
            '--sat', 
            'env(safe-area-inset-top)'
        );
        document.documentElement.style.setProperty(
            '--sar', 
            'env(safe-area-inset-right)'
        );
        document.documentElement.style.setProperty(
            '--sab', 
            'env(safe-area-inset-bottom)'
        );
        document.documentElement.style.setProperty(
            '--sal', 
            'env(safe-area-inset-left)'
        );

        // Disable text size adjustment
        document.documentElement.style.webkitTextSizeAdjust = '100%';

        // iOS-style tap highlight (subtle)
        document.documentElement.style.webkitTapHighlightColor = 'rgba(255,255,255,0.05)';
    }, []);

    const applyAndroidFeel = useCallback(() => {
        // Enable edge-to-edge on Android
        document.body.style.margin = '0';
        document.body.style.padding = '0';

        // Android overscroll glow color (subtle blue)
        document.documentElement.style.setProperty(
            '--android-overscroll',
            'rgba(59, 130, 246, 0.3)'
        );

        // Material ripple effect base
        document.documentElement.style.setProperty(
            '--ripple-color',
            'rgba(255, 255, 255, 0.1)'
        );

        // Enable momentum scrolling
        document.body.style.overscrollBehavior = 'auto';
    }, []);

    const applyCommonNativeFeel = useCallback(() => {
        // Prevent zoom on double-tap (300ms delay elimination)
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
            viewportMeta.setAttribute(
                'content',
                'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
            );
        }

        // Disable pull-to-refresh on Chrome Android
        document.body.style.overscrollBehaviorY = 'none';

        // Prevent elastic scrolling on root (keep it on containers)
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';

        // High-DPI optimization
        document.documentElement.style.setProperty(
            '--device-pixel-ratio',
            window.devicePixelRatio.toString()
        );

        // Add platform class for CSS targeting
        if (isIOSNative()) {
            document.documentElement.classList.add('ios-native');
        } else if (isAndroidNative()) {
            document.documentElement.classList.add('android-native');
        }
    }, []);

    useEffect(() => {
        if (!isNativeMobile()) return;

        // Apply platform-specific optimizations
        if (isIOSNative()) {
            applyIOSFeel();
        } else if (isAndroidNative()) {
            applyAndroidFeel();
        }

        // Common native optimizations
        applyCommonNativeFeel();
    }, [applyIOSFeel, applyAndroidFeel, applyCommonNativeFeel]);
};

/**
 * Hook for native haptic feedback on interactions
 */
export const useNativeHaptics = () => {
    const hapticLight = useCallback(() => {
        HapticsService.impact('light');
    }, []);

    const hapticMedium = useCallback(() => {
        HapticsService.impact('medium');
    }, []);

    const hapticHeavy = useCallback(() => {
        HapticsService.impact('heavy');
    }, []);

    const hapticSelection = useCallback(() => {
        HapticsService.selection();
    }, []);

    const hapticSuccess = useCallback(() => {
        HapticsService.notification('success');
    }, []);

    const hapticError = useCallback(() => {
        HapticsService.notification('error');
    }, []);

    const hapticWarning = useCallback(() => {
        HapticsService.notification('warning');
    }, []);

    return {
        hapticLight,
        hapticMedium,
        hapticHeavy,
        hapticSelection,
        hapticSuccess,
        hapticError,
        hapticWarning
    };
};

/**
 * Hook for spring animations (iOS-style)
 */
export const useSpringAnimation = () => {
    const springConfig = {
        type: 'spring',
        stiffness: 400,
        damping: 30,
        mass: 1
    };

    const iOSSpringConfig = {
        type: 'spring',
        stiffness: 500,
        damping: 25,
        mass: 1
    };

    const gentleSpringConfig = {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        mass: 1
    };

    return {
        springConfig,
        iOSSpringConfig,
        gentleSpringConfig
    };
};

/**
 * Hook for platform-specific touch feedback
 */
export const useTouchFeedback = () => {
    useEffect(() => {
        if (!isNativeMobile()) return;

        const handleTouchStart = (e) => {
            const target = e.target.closest('[data-haptic]');
            if (target) {
                const hapticType = target.dataset.haptic;
                switch (hapticType) {
                    case 'light':
                        HapticsService.impact('light');
                        break;
                    case 'medium':
                        HapticsService.impact('medium');
                        break;
                    case 'heavy':
                        HapticsService.impact('heavy');
                        break;
                    case 'selection':
                        HapticsService.selection();
                        break;
                }
            }
        };

        document.addEventListener('touchstart', handleTouchStart, { passive: true });

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
        };
    }, []);
};

/**
 * Hook for status bar management (iOS/Android)
 */
export const useStatusBar = () => {
    useEffect(() => {
        if (!isNativeMobile()) return;

        const configureStatusBar = async () => {
            try {
                const { StatusBar, Style } = await import('@capacitor/status-bar');

                // Edge-to-edge (content under status bar)
                await StatusBar.setOverlaysWebView({ overlay: true });

                // Dark content for light backgrounds or light for dark
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                await StatusBar.setStyle({
                    style: prefersDark ? Style.Dark : Style.Dark // Always dark for our dark theme
                });

                // Transparent background
                await StatusBar.setBackgroundColor({ color: '#00000000' });

            } catch (error) {
                console.warn('StatusBar configuration failed:', error);
            }
        };

        configureStatusBar();
    }, []);
};

/**
 * Hook for safe area insets
 */
export const useSafeArea = () => {
    useEffect(() => {
        // CSS environment variables are automatically handled by the browser
        // This hook can be extended for JS-based safe area calculations
        const updateSafeArea = () => {
            const style = getComputedStyle(document.documentElement);
            return {
                top: parseInt(style.getPropertyValue('--sat') || '0', 10),
                right: parseInt(style.getPropertyValue('--sar') || '0', 10),
                bottom: parseInt(style.getPropertyValue('--sab') || '0', 10),
                left: parseInt(style.getPropertyValue('--sal') || '0', 10)
            };
        };

        updateSafeArea();
        return () => {};
    }, []);
};

/**
 * Combined hook for all native feel optimizations
 */
export const usePremiumNativeFeel = () => {
    useNativeFeel();
    useTouchFeedback();
    useStatusBar();

    const haptics = useNativeHaptics();
    const springs = useSpringAnimation();
    const safeArea = useSafeArea();

    return {
        haptics,
        springs,
        safeArea,
        isNative: isNativeMobile(),
        isIOS: isIOSNative(),
        isAndroid: isAndroidNative()
    };
};

export default usePremiumNativeFeel;