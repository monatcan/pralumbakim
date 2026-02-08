"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

import { getStatusLabel, getStatusColor } from "@/lib/constants";

interface MaintenanceLog {
  id: string;
  date: string;
  status: string;
  branch: {
    name: string;
    address: string | null;
    client: { name: string };
  };
  _count: {
      checklistItems: number;
      photos: number;
  };
}

export default function MaintenanceDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
    if (status === "authenticated") {
        fetchMyLogs();
    }
  }, [status, router]);

  const fetchMyLogs = async () => {
    try {
        const res = await fetch("/api/maintenance/technician");
        if (res.ok) {
            setLogs(await res.json());
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bakım İşlemleri</h1>
           <p className="text-gray-500 dark:text-gray-400">Merhaba, {session?.user?.name}</p>
        </div>
        
        {/* Only show Scan QR button if user is on mobile or capable device */}
        {/* But actually just linking to a scan page or start page is fine */}
        {/* Assuming maintenance/start is the QR handler or entry */}
      </div>
      
      {/* Big Action Button */}
       <div className="mb-8">
            <Link 
                href="/maintenance/start?manual=true" // Or handle QR scanning logic there
                // Actually maybe just a placeholder for QR Scan if on desktop, or direct link
                // Ideally this opens a QR scanner. The user says "direk bakım başlat değil".
                // So let's provide a visible button for "New Maintenance"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
            >
                📷 Yeni Bakım Başlat (QR Tara)
            </Link>
       </div>

      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 border-b dark:border-gray-700 pb-2">Devam Eden İşlerim</h2>
      
      {logs.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-500">
              Aktif bakım kaydınız bulunmuyor.
          </div>
      ) : (
          <div className="space-y-4">
              {logs.map(log => (
                  <div 
                    key={log.id}
                    onClick={() => router.push(`/maintenance/process/${log.id}`)}
                    className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md cursor-pointer transition-all active:scale-[0.99]"
                  >
                      <div className="flex justify-between items-start mb-3">
                          <span className={`px-3 py-1 rounded text-xs font-bold ${getStatusColor(log.status)}`}>
                              {getStatusLabel(log.status)}
                          </span>
                          <span className="text-xs text-gray-400">
                                {new Date(log.date).toLocaleString("tr-TR", { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">{log.branch.client.name}</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-1">{log.branch.name}</p>
                      <p className="text-gray-400 text-xs mb-3">{log.branch.address}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-50 dark:border-gray-700 pt-3">
                        <span className="flex items-center"><span className="mr-1">📋</span> {log._count.checklistItems} İşlem</span>
                        <span className="flex items-center"><span className="mr-1">📷</span> {log._count.photos} Fotoğraf</span>
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
}
