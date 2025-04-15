'use client';

import Sidebar from '@/components/layout/Sidebar';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';

function ItemsLayoutContent({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar();
  
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <Sidebar />
      <main className={`transition-all duration-300 ${isOpen ? 'ml-64' : 'ml-0'} p-4`}>
        {children}
      </main>
    </div>
  );
}

export default function ItemsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ItemsLayoutContent>{children}</ItemsLayoutContent>
    </SidebarProvider>
  );
} 