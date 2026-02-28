import { NavLink } from 'react-router-dom';
import { Home, AlertTriangle, Map, Library, Brain } from 'lucide-react';
import { HapticsService } from '../../services/HapticsService';

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
        HapticsService.impact('light');
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <NavLink
                    to="/"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    onClick={handleNavClick}
                >
                    <Home size={28} />
                    <span className="nav-label">Home</span>
                </NavLink>
                <NavLink
                    to="/survival"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    onClick={handleNavClick}
                >
                    <AlertTriangle size={28} />
                    <span className="nav-label">Survival</span>
                </NavLink>
                <NavLink
                    to="/map"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    onClick={handleNavClick}
                >
                    <Map size={28} />
                    <span className="nav-label">Map</span>
                </NavLink>
                <NavLink
                    to="/library"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    onClick={handleNavClick}
                >
                    <Library size={28} />
                    <span className="nav-label">Library</span>
                </NavLink>
                <NavLink
                    to="/ai-models"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    onClick={handleNavClick}
                >
                    <Brain size={28} />
                    <span className="nav-label">AI</span>
                </NavLink>
            </div>
        </nav>
    );
};

export default Navbar;
