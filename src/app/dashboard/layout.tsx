"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { BeakerIcon } from '@heroicons/react/24/solid'; // Placeholder / Logo

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const menuItems = [
    { name: "Genel Bakış", href: "/dashboard", icon: "📊" },
    { name: "Müşteriler (Firmalar)", href: "/dashboard/clients", icon: "🏢", roles: ["SUPER_ADMIN", "PROJECT_MANAGER"] },
    { name: "Bakım Geçmişi", href: "/dashboard/maintenance", icon: "📋", roles: ["SUPER_ADMIN", "PROJECT_MANAGER", "BRANCH_MANAGER", "FIELD_STAFF"] },
    { name: "Kullanıcılar", href: "/dashboard/users", icon: "👥", roles: ["SUPER_ADMIN"] },
    { name: "Ayarlar", href: "/dashboard/settings", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors duration-200">
      {/* Sidebar */}
      <aside
        className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed inset-y-0 left-0 z-20 w-64 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
             {mounted ? (
                <img 
                  src={resolvedTheme === 'dark' ? "/dikey-beyaz-yatay.png" : "/renkli-yatay.png"} 
                  alt="Pralum Logo" 
                  className="h-10 w-auto object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML += '<span class="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-600">Pralum Bakım</span>';
                  }}
                />
             ) : (
                <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
             )}
          </div>

          {/* Menu */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {menuItems.map((item) => {
              if (item.roles && !item.roles.includes(session?.user?.role || "")) return null;
              
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
                 <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Tema</span>
                 {mounted && (
                    <button 
                        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                        className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        aria-label="Toggle Dark Mode"
                    >
                        {resolvedTheme === 'dark' ? '🌞' : '🌙'}
                    </button>
                 )}
            </div>

            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xs">
                {session?.user?.name?.charAt(0)}
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {session?.user?.role}
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors">
        {/* Mobile Header */}
        <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
            <span className="font-bold text-gray-900 dark:text-white">BakımSistemi</span>
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
                🍔
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {children}
        </div>
      </main>
    </div>
  );
}
