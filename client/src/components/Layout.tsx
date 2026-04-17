import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import NotificationManager from './NotificationManager';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <NotificationManager />
      <Sidebar />
      <div className="mr-64">
        <Navbar />
        <main className="pt-16 min-h-screen">
          <div className="p-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
