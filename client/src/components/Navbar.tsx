import React from 'react';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-64 h-16 bg-card/80 backdrop-blur-md border-b border-border z-30 flex items-center justify-between px-6">
      {/* Search */}
      <div className="relative hidden md:flex items-center">
        <Search className="absolute right-3 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="חפש..."
          className="bg-surface border border-border rounded-xl pr-10 pl-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary w-64 transition-all text-right"
        />
      </div>

      {/* Left side */}
      <div className="flex items-center gap-3 mr-auto">
        {/* Notification bell */}
        <button className="relative w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-gray-400 hover:text-white hover:border-primary transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full" />
        </button>

        {/* Avatar */}
        <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-white font-bold text-sm cursor-pointer">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
