import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, Map, Settings } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="navbar">
      <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <Home size={24} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/guides" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <BookOpen size={24} />
        <span>Guides</span>
      </NavLink>
      <NavLink to="/map" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <Map size={24} />
        <span>Map</span>
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <Settings size={24} />
        <span>Settings</span>
      </NavLink>

      <style>{`
        .navbar {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          height: var(--navbar-height);
          background-color: var(--color-surface);
          border-top: 1px solid var(--color-border);
          display: flex;
          justify-content: space-around;
          align-items: center;
          z-index: 1000;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          color: var(--color-text-muted);
          font-size: 0.75rem;
          gap: 4px;
          flex: 1;
          height: 100%;
          justify-content: center;
        }

        .nav-item.active {
          color: var(--color-primary);
        }

        .nav-item:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
