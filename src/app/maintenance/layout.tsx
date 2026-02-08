"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col text-gray-900 dark:text-gray-100 transition-colors">
      <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex items-center justify-center space-x-2 dark:border-b dark:border-gray-700 transition-colors">
        {mounted ? (
            <img 
                src={resolvedTheme === 'dark' ? "/dikey-beyaz-yatay.png" : "/renkli-yatay.png"} 
                alt="Pralum Logo" 
                className="h-8 w-auto object-contain"
                onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML += '<span class="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-600">Pralum Bakım Yönetimi</span>';
                }}
            />
        ) : (
             <span className="text-lg font-bold">Pralum Bakım Yönetimi</span>
        )}
      </header>
      <main className="flex-grow p-4">
        {children}
      </main>
    </div>
  )
}
