import { Home, AlertTriangle, Map, HardDrive } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="navbar-container">
                <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Home size={28} />
                    <span className="nav-label">Home</span>
                </NavLink>
                <NavLink to="/survival" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <AlertTriangle size={28} />
                    <span className="nav-label">Survival</span>
                </NavLink>
                <NavLink to="/map" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Map size={28} />
                    <span className="nav-label">Map</span>
                </NavLink>
                <NavLink to="/resources" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <HardDrive size={28} />
                    <span className="nav-label">Resources</span>
                </NavLink>
            </div>
        </nav>
    );
};

export default Navbar;
