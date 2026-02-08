"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({ clients: 0, branches: 0, users: 0, activeMaintenances: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
    if (status === "authenticated") {
        fetchStats();
    }
  }, [status, router]);

  const fetchStats = async () => {
      try {
          const res = await fetch('/api/dashboard/stats');
          if (res.ok) setStats(await res.json());
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  if (status === "loading" || (loading && status === "authenticated")) {
    return <div className="p-8">Yükleniyor...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Genel Bakış</h1>
        <p className="text-gray-500 dark:text-gray-400">Hoş geldiniz, {session?.user?.name}. Sistemin güncel durumu aşağıdadır.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
             <h3 className="font-semibold text-gray-500 dark:text-gray-400">Müşteriler</h3>
             <span className="text-2xl">🏢</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.clients}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
             <h3 className="font-semibold text-gray-500 dark:text-gray-400">Toplam Şube</h3>
             <span className="text-2xl">🏪</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.branches}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
             <h3 className="font-semibold text-gray-500 dark:text-gray-400">Kullanıcılar</h3>
             <span className="text-2xl">👥</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.users}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
             <h3 className="font-semibold text-gray-500 dark:text-gray-400">Aktif Bakımlar</h3>
             <span className="text-2xl">⚡</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white text-blue-600 dark:text-blue-400">{stats.activeMaintenances}</p>
          <p className="text-sm text-gray-400 mt-2">Şu an devam eden</p>
        </div>
      </div>
    </div>
  );
}
