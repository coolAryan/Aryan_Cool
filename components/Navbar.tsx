import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar: React.FC = () => {
  const activeLinkClass = "text-cyan-400 font-bold";
  const inactiveLinkClass = "text-slate-400 hover:text-white";
  const linkStyle = "text-lg transition-colors duration-300";

  return (
    <nav className="bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <NavLink to="/" className="text-2xl font-bold text-white">
              Aryan Jain
            </NavLink>
          </div>
          <div className="flex items-center space-x-6">
            <NavLink 
              to="/" 
              className={({ isActive }) => `${linkStyle} ${isActive ? activeLinkClass : inactiveLinkClass}`}
            >
              Portfolio
            </NavLink>
            <NavLink 
              to="/game" 
              className={({ isActive }) => `${linkStyle} ${isActive ? activeLinkClass : inactiveLinkClass}`}
            >
              DX Ball Game
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
