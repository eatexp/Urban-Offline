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
    </nav>
  );
};

export default Navbar;
