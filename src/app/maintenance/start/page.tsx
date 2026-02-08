"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { getStatusLabel, getStatusColor } from "@/lib/constants";

interface BranchData {
  id: string;
  name: string;
  address: string;
  client: {
    name: string;
    logo: string | null;
  };
}

function MaintenanceStartPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const branchId = searchParams.get("branchId");
  const code = searchParams.get("code");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [branch, setBranch] = useState<BranchData | null>(null);
  // New: Templates
  const [templates, setTemplates] = useState<{id: string, name: string}[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  // New: Active Logs
  const [activeLogs, setActiveLogs] = useState<{id: string, date: string, status: string, staff: {fullName: string | null}}[]>([]);
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      // Redirect to login but keep the return url
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(window.location.href)}`);
      return;
    }

    if (status === "authenticated") {
        if (!branchId || !code) {
        setError("Geçersiz QR Kod: Parametreler eksik.");
        setLoading(false);
        return;
        }
        checkQR();
    }
  }, [branchId, code, status, router]);

  const checkQR = async () => {
    try {
      const res = await fetch("/api/maintenance/check-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId, code }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setBranch(data.branch);
        setTemplates(data.templates || []);
        setActiveLogs(data.activeLogs || []);
      } else {
        setError(data.error || "Geçersiz QR Kod veya Şube Bulunamadı.");
      }
    } catch (err) {
      setError("Sunucu hatası.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartMaintenance = async () => {
    if (templates.length > 0 && !selectedTemplateId) {
        alert("Lütfen bir bakım türü seçin.");
        return;
    }
    setSubmitting(true);
    try {
        const res = await fetch("/api/maintenance/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                branchId: branch?.id,
                templateId: selectedTemplateId
            }),
        });

        if (res.ok) {
            const log = await res.json();
            router.push(`/maintenance/process/${log.id}`); 
        } else {
            alert("Başlatılamadı.");
        }
    } catch (e) {
        console.error(e);
        alert("Hata oluştu.");
    } finally {
        setSubmitting(false);
    }
  };

  const handleViewHistory = () => {
    router.push(`/maintenance/history/${branch?.id}`);
  };

  // Role Checks
  const isTechnician = session?.user.role === 'SUPER_ADMIN' || session?.user.role === 'FIELD_STAFF';
  const isClient = session?.user.role === 'PROJECT_MANAGER' || session?.user.role === 'BRANCH_MANAGER';

  if (status === "loading" || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-500">Doğrulanıyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-center">
        <div className="text-red-500 text-5xl mb-4">✕</div>
        <h2 className="text-xl font-bold text-red-700 mb-2">Hata</h2>
        <p className="text-red-600">{error}</p>
        <button 
            onClick={() => router.push("/dashboard")}
            className="mt-6 w-full py-3 bg-white border border-gray-300 rounded-lg text-gray-700"
        >
            Panele Dön
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      {branch && (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-blue-600 p-6 text-white text-center">
                <div className="w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center text-blue-600 font-bold text-2xl mb-3 shadow-lg">
                    {branch.client.name.charAt(0)}
                </div>
                <h2 className="text-2xl font-bold">{branch.client.name}</h2>
                <p className="opacity-90">Bakım Başlatma</p>
            </div>
            
            <div className="p-6">
                <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Şube</label>
                    <p className="text-lg font-bold text-gray-900">{branch.name}</p>
                    
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3 block">Adres</label>
                    <p className="text-sm text-gray-600">{branch.address || "Adres bilgisi yok"}</p>
                </div>

                <div className="space-y-4">
                    {/* Active Logs Warning */}
                    {activeLogs.length > 0 && isTechnician && (
                        <div className="mb-4">
                            <h3 className="font-bold text-orange-600 mb-2 flex items-center text-sm">
                                <span className="mr-2">⚠️</span> Bu şubede devam eden işlemler var:
                            </h3>
                            <div className="space-y-2">
                                {activeLogs.map(log => (
                                    <div key={log.id} 
                                        onClick={() => router.push(`/maintenance/process/${log.id}`)}
                                        className="bg-orange-50 border border-orange-200 p-3 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors"
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-gray-800 text-sm">
                                                {new Date(log.date).toLocaleDateString('tr-TR')}
                                            </span>
                                            <span className={`text-xs px-2 py-1 rounded border font-bold ${getStatusColor(log.status)}`}>
                                                {getStatusLabel(log.status)}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Personel: {log.staff?.fullName || "Bilinmiyor"}
                                        </div>
                                        <div className="text-xs text-blue-600 mt-1 font-bold text-right">Düzenle / Devam Et →</div>
                                    </div>
                                ))}
                            </div>
                            <div className="relative flex py-4 items-center">
                                <div className="flex-grow border-t border-gray-300"></div>
                                <span className="flex-shrink mx-4 text-gray-400 text-xs font-semibold">VEYA YENİ BAŞLAT</span>
                                <div className="flex-grow border-t border-gray-300"></div>
                            </div>
                        </div>
                    )}

                    {/* Template Selection */}
                    {isTechnician && templates.length > 0 && (
                        <div className="text-left bg-gray-50 border border-gray-100 p-3 rounded-xl">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Bakım Türü Seçiniz</label>
                            <select 
                                className="w-full border border-gray-200 p-3 rounded-lg bg-white text-gray-800 outline-none focus:ring-2 focus:ring-green-500"
                                value={selectedTemplateId}
                                onChange={e => setSelectedTemplateId(e.target.value)}
                            >
                                <option value="">Seçiniz...</option>
                                {templates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {isTechnician && (
                        <button
                            onClick={handleStartMaintenance}
                            disabled={submitting}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-200 transition-all transform active:scale-95 flex items-center justify-center"
                        >
                            {submitting ? (
                                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                            ) : (
                                <span className="mr-2">⚡</span>
                            )}
                            {submitting ? "Başlatılıyor..." : "Bakımı Başlat"}
                        </button>
                    )}

                    {isClient && (
                         <button
                            onClick={handleViewHistory}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all transform active:scale-95 flex items-center justify-center"
                        >
                           🔍 Geçmiş Bakımları Gör
                        </button>
                    )}
                    
                    <button 
                        onClick={() => router.push("/dashboard")}
                        className="w-full py-3 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                        İptal
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

export default function MaintenanceStartPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Yükleniyor...</div>}>
      <MaintenanceStartPageContent />
    </Suspense>
  );
}
