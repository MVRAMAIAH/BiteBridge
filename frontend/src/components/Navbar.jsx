import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import { Soup, Home, Bell, Users, User, LogOut, Menu, X, PlusCircle } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { unreadCount } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 glass-nav shadow-sm px-4 sm:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 text-spice-600 dark:text-spice-400 font-extrabold text-xl tracking-tight">
          <Soup className="w-8 h-8 text-spice-500 animate-bounce" />
          <span>Bite<span className="text-slate-800 dark:text-white">Bridge</span></span>
        </Link>

        {/* Desktop Navigation */}
        {user && (
          <div className="hidden md:flex items-center gap-6">
            <Link to="/dashboard" className={`flex items-center gap-1.5 font-medium text-sm transition-colors ${isActive('/dashboard') ? 'text-spice-500' : 'text-slate-600 dark:text-slate-300 hover:text-spice-500'}`}>
              <Home className="w-4 h-4" />
              <span>{t('dashboard')}</span>
            </Link>
            <Link to="/rooms" className={`flex items-center gap-1.5 font-medium text-sm transition-colors ${isActive('/rooms') ? 'text-spice-500' : 'text-slate-600 dark:text-slate-300 hover:text-spice-500'}`}>
              <Users className="w-4 h-4" />
              <span>{t('rooms')}</span>
            </Link>
            <Link to="/create-post" className={`flex items-center gap-1.5 font-medium text-sm transition-colors ${isActive('/create-post') ? 'text-spice-500' : 'text-slate-600 dark:text-slate-300 hover:text-spice-500'}`}>
              <PlusCircle className="w-4 h-4" />
              <span>{t('createPost')}</span>
            </Link>
            <Link to="/notifications" className={`flex items-center gap-1.5 font-medium text-sm relative transition-colors ${isActive('/notifications') ? 'text-spice-500' : 'text-slate-600 dark:text-slate-300 hover:text-spice-500'}`}>
              <Bell className="w-4 h-4" />
              <span>{t('notifications')}</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white rounded-full text-[10px] w-4 h-4 flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link to="/my-shares" className={`flex items-center gap-1.5 font-medium text-sm transition-colors ${isActive('/my-shares') ? 'text-spice-500' : 'text-slate-600 dark:text-slate-300 hover:text-spice-500'}`}>
              <Soup className="w-4 h-4" />
              <span>Shared Food</span>
            </Link>
            <Link to="/profile" className={`flex items-center gap-1.5 font-medium text-sm transition-colors ${isActive('/profile') ? 'text-spice-500' : 'text-slate-600 dark:text-slate-300 hover:text-spice-500'}`}>
              <User className="w-4 h-4" />
              <span>{t('profile')}</span>
            </Link>
          </div>
        )}

        {/* Global Toolbar Options */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />

          {user && (
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-red-500 hover:text-white dark:hover:bg-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('logout')}</span>
            </button>
          )}

          {/* Mobile Menu Button */}
          {user && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {user && mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
          <Link
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 p-2.5 rounded-lg font-medium text-sm ${isActive('/dashboard') ? 'bg-spice-50 dark:bg-spice-950/20 text-spice-600' : 'text-slate-600 dark:text-slate-300'}`}
          >
            <Home className="w-4 h-4" />
            <span>{t('dashboard')}</span>
          </Link>
          <Link
            to="/rooms"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 p-2.5 rounded-lg font-medium text-sm ${isActive('/rooms') ? 'bg-spice-50 dark:bg-spice-950/20 text-spice-600' : 'text-slate-600 dark:text-slate-300'}`}
          >
            <Users className="w-4 h-4" />
            <span>{t('rooms')}</span>
          </Link>
          <Link
            to="/create-post"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 p-2.5 rounded-lg font-medium text-sm ${isActive('/create-post') ? 'bg-spice-50 dark:bg-spice-950/20 text-spice-600' : 'text-slate-600 dark:text-slate-300'}`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('createPost')}</span>
          </Link>
          <Link
            to="/notifications"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 p-2.5 rounded-lg font-medium text-sm relative ${isActive('/notifications') ? 'bg-spice-50 dark:bg-spice-950/20 text-spice-600' : 'text-slate-600 dark:text-slate-300'}`}
          >
            <Bell className="w-4 h-4" />
            <span>{t('notifications')}</span>
            {unreadCount > 0 && (
              <span className="ml-auto bg-red-500 text-white rounded-full text-[10px] w-4.5 h-4.5 flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </Link>
          <Link
            to="/my-shares"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 p-2.5 rounded-lg font-medium text-sm ${isActive('/my-shares') ? 'bg-spice-50 dark:bg-spice-950/20 text-spice-600' : 'text-slate-600 dark:text-slate-300'}`}
          >
            <Soup className="w-4 h-4" />
            <span>Shared Food</span>
          </Link>
          <Link
            to="/profile"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 p-2.5 rounded-lg font-medium text-sm ${isActive('/profile') ? 'bg-spice-50 dark:bg-spice-950/20 text-spice-600' : 'text-slate-600 dark:text-slate-300'}`}
          >
            <User className="w-4 h-4" />
            <span>{t('profile')}</span>
          </Link>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            className="flex items-center gap-2 p-2.5 rounded-lg font-medium text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/10"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('logout')}</span>
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
