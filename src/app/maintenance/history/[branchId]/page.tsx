"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getStatusLabel, getStatusColor } from "@/lib/constants";

interface MaintenanceLog {
  id: string;
  date: string;
  status: string;
  notes: string;
  staff: { fullName: string };
  _count: { checklistItems: number; photos: number };
}

export default function MaintenanceHistoryPage() {
  const { branchId } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (branchId) fetchLogs();
  }, [branchId]);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/branches/${branchId}/logs`);
      if (res.ok) {
        setLogs(await res.json());
      } else {
        setError("Kayıtlar yüklenemedi veya yetkiniz yok.");
      }
    } catch (err) {
      setError("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  };

  if(!session) return null;

  return (
    <div className="max-w-2xl mx-auto p-4 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Bakım Geçmişi</h1>
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">← Geri</button>
      </div>

      {loading && <div className="text-center py-10 text-gray-500 dark:text-gray-400">Yükleniyor...</div>}
      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-4 border border-red-100 dark:border-red-800">{error}</div>}

      <div className="space-y-4">
        {logs.length === 0 && !loading && !error && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-10 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                Kayıt bulunamadı.
            </div>
        )}

        {logs.map((log) => (
          <div key={log.id} 
               onClick={() => router.push(`/maintenance/process/${log.id}?readonly=true`)}
               className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
          >
             <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(log.status)}`}>
                    {getStatusLabel(log.status)}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(log.date).toLocaleString("tr-TR", { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
             </div>
             
             <div className="mb-2">
                 <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Teknisyen: <span className="font-normal text-gray-600 dark:text-gray-400">{log.staff.fullName}</span></p>
             </div>

             {log.notes && (
                 <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 italic">"{log.notes}"</p>
             )}

             <div className="flex items-center space-x-4 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
                <span className="flex items-center"><span className="mr-1">📋</span> {log._count.checklistItems} İşlem</span>
                <span className="flex items-center"><span className="mr-1">📷</span> {log._count.photos} Fotoğraf</span>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
