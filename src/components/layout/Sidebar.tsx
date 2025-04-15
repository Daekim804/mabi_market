'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/context/SidebarContext';
import { useEffect, useState } from 'react';

const sidebarNavigation = [
  { name: '물물교역', href: '/items/trade' },
  { name: '스킬별 보기', href: '/items/skills' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, toggle, setIsOpen } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      {/* 토글 버튼 */}
      <button
        onClick={toggle}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-amber-100 hover:bg-amber-200 transition-colors"
        aria-label="Toggle sidebar"
      >
        <svg
          className="w-6 h-6 text-amber-900"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* 사이드바 */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full z-40 bg-amber-50 p-6 border-r border-amber-200 w-64",
          "transform transition-transform duration-300 ease-in-out shadow-lg",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="pt-14">
          <nav className="space-y-1">
            {sidebarNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => isMobile && setIsOpen(false)}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  pathname === item.href
                    ? 'bg-amber-200 text-amber-900'
                    : 'text-amber-800 hover:bg-amber-100 hover:text-amber-900'
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* 오버레이 - 모바일에서만 표시 */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
} 