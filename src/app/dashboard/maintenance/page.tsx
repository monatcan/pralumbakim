"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStatusLabel, getStatusColor, MAINTENANCE_STATUS_LABELS } from "@/lib/constants";

interface MaintenanceLog {
  id: string;
  date: string;
  completedAt?: string;
  status: string;
  isArchived: boolean;
  staff: { fullName: string };
  branch: { 
      name: string; 
      client: { name: string } 
  };
}

export default function AllMaintenancePage() {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [selectedClient, setSelectedClient] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedStaff, setSelectedStaff] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"active" | "archived" | "all">("active");
  const [searchText, setSearchText] = useState("");

  const router = useRouter();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const res = await fetch("/api/maintenance/all"); 
    if (res.ok) setLogs(await res.json());
    setLoading(false);
  };

  // Get Unique Values for Filters
  const clients = Array.from(new Set(logs.map(log => log.branch.client.name)));
  const branches = Array.from(new Set(logs.map(log => log.branch.name)));
  const staffs = Array.from(new Set(logs.map(log => log.staff.fullName)));

  // Filter Logic
  const filteredLogs = logs.filter(log => {
      // View Mode Filter
      if (viewMode === "active" && log.isArchived) return false;
      if (viewMode === "archived" && !log.isArchived) return false;

      const matchesClient = selectedClient === "all" || log.branch.client.name === selectedClient;
      const matchesBranch = selectedBranch === "all" || log.branch.name === selectedBranch;
      const matchesStaff = selectedStaff === "all" || log.staff.fullName === selectedStaff;
      const matchesStatus = selectedStatus === "all" || log.status === selectedStatus;
      const matchesSearch = searchText === "" || 
                            log.branch.name.toLowerCase().includes(searchText.toLowerCase()) ||
                            log.branch.client.name.toLowerCase().includes(searchText.toLowerCase()) ||
                            log.staff.fullName.toLowerCase().includes(searchText.toLowerCase());
      
      return matchesClient && matchesBranch && matchesStaff && matchesStatus && matchesSearch;
  });

  if (loading) return <div className="p-8">Yükleniyor...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tüm Bakım Geçmişi</h1>
        <div className="flex space-x-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button 
                onClick={() => setViewMode("active")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'active' ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
            >
                Aktif
            </button>
            <button 
                onClick={() => setViewMode("archived")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'archived' ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
            >
                Arşivlenmiş
            </button>
            <button 
                onClick={() => setViewMode("all")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'all' ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
            >
                Tümü
            </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <input 
             type="text" 
             placeholder="Ara (Firma, Şube, Personel)..." 
             value={searchText}
             onChange={(e) => setSearchText(e.target.value)}
             className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />

          <select 
             value={selectedStatus} 
             onChange={(e) => setSelectedStatus(e.target.value)}
             className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
             <option value="all">Tüm Durumlar</option>
             {Object.entries(MAINTENANCE_STATUS_LABELS).map(([key, label]) => (
                 <option key={key} value={key}>{label}</option>
             ))}
          </select>

          <select 
             value={selectedClient} 
             onChange={(e) => setSelectedClient(e.target.value)}
             className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
             <option value="all">Tüm Firmalar</option>
             {clients.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select 
             value={selectedBranch} 
             onChange={(e) => setSelectedBranch(e.target.value)}
             className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
             <option value="all">Tüm Şubeler</option>
             {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          <select 
             value={selectedStaff} 
             onChange={(e) => setSelectedStaff(e.target.value)}
             className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
             <option value="all">Tüm Personeller</option>
             {staffs.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Başlangıç</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Bitiş</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Firma / Şube</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Personel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Durum</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">İşlem</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                <tr key={log.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${log.isArchived ? 'opacity-60 bg-gray-50 dark:bg-gray-900' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(log.date).toLocaleString("tr-TR")}
                        {log.isArchived && <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-600 text-white">Arşivli</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {log.completedAt ? new Date(log.completedAt).toLocaleString("tr-TR") : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                    <div className="font-bold">{log.branch.client.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{log.branch.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {log.staff.fullName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(log.status)}`}>
                        {getStatusLabel(log.status)}
                    </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                    <button 
                        onClick={() => router.push(`/maintenance/process/${log.id}?readonly=true`)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-medium"
                    >
                        Detay
                    </button>
                    </td>
                </tr>
                ))
            ) : (
                <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                        Arama kriterlerine uygun kayıt bulunamadı.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
