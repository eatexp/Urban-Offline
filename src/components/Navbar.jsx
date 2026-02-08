import { Home, AlertTriangle, Map, Library, Brain } from 'lucide-react';
import { NavLink } from 'react-router-dom';

/**
 * Trigger light haptic feedback for navigation
 */
const triggerNavHaptic = async () => {
    try {
        // Try Capacitor Haptics first
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
        // Web fallback
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(5);
        }
    }
};

const Navbar = () => {
    // =============================================================================
    // VERIFIED: [NativeUX] NAVBAR_TOUCH_FEEDBACK & ANDROID_HARDWARE_BACK
    // =============================================================================
    // Implementation: Added light haptic feedback on navigation using Capacitor
    //   Haptics with web fallback to navigator.vibrate(5). Touch targets are
    //   min 64px wide ensuring >44px requirement. CSS :active states provide
    //   visual feedback. Android back button handled in App.jsx.
    // =============================================================================

    const handleNavClick = () => {
        triggerNavHaptic();
    };

    return (
        <nav className="navbar" role="navigation" aria-label="Main navigation">
            <div className="navbar-container">
                <NavLink
                    to="/"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    onClick={handleNavClick}
                    aria-label="Home"
                >
                    <Home size={28} aria-hidden="true" />
                    <span className="nav-label">Home</span>
                </NavLink>
                <NavLink
                    to="/survival"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    onClick={handleNavClick}
                    aria-label="Survival guides"
                >
                    <AlertTriangle size={28} aria-hidden="true" />
                    <span className="nav-label">Survival</span>
                </NavLink>
                <NavLink
                    to="/map"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    onClick={handleNavClick}
                    aria-label="Offline maps"
                >
                    <Map size={28} aria-hidden="true" />
                    <span className="nav-label">Map</span>
                </NavLink>
                <NavLink
                    to="/library"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    onClick={handleNavClick}
                    aria-label="Content library"
                >
                    <Library size={28} aria-hidden="true" />
                    <span className="nav-label">Library</span>
                </NavLink>
                <NavLink
                    to="/ai-models"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    onClick={handleNavClick}
                    aria-label="AI models and chat"
                >
                    <Brain size={28} aria-hidden="true" />
                    <span className="nav-label">AI</span>
                </NavLink>
            </div>
        </nav>
    );
};

export default Navbar;
