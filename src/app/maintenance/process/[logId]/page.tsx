"use client";

import { useRef, useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getStatusLabel, getStatusColor } from "@/lib/constants";

interface ChecklistItem {
  id: string;
  question: string;
  isChecked: boolean;
  note: string | null;
}

interface LogDetail {
  id: string;
  status: string;
  notes: string | null;
  instructions: string | null; // NEW
  staffId: string;
  isArchived?: boolean;
  branch: { name: string; address: string };
  checklistItems: ChecklistItem[];
  photos: { id: string; url: string }[];
}

function MaintenanceProcessPageContent() {
  const { logId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  
  const isReadOnly = searchParams.get("readonly") === "true";
  
  const [log, setLog] = useState<LogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form States
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [notes, setNotes] = useState("");
  // New photos waiting to be saved to Log (already uploaded to temp storage)
  const [newPhotos, setNewPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (logId) loadLog();
  }, [logId]);

  const loadLog = async () => {
    try {
      const res = await fetch(`/api/maintenance/logs/${logId}`);
      if (res.ok) {
        const data = await res.json();
        setLog(data);
        // Natural Sort (1, 2, 10 instead of 1, 10, 2)
        const sortedItems = data.checklistItems.sort((a: ChecklistItem, b: ChecklistItem) => 
            a.question.localeCompare(b.question, undefined, { numeric: true, sensitivity: 'base' })
        );
        setItems(sortedItems);
        setNotes(data.notes || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (id: string) => {
    if (isReadOnly) return;
    setItems(items.map(item => 
        item.id === id ? { ...item, isChecked: !item.isChecked } : item
    ));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    setUploading(true);
    const files = Array.from(e.target.files);
    
    try {
        const uploads = await Promise.all(
            files.map(async (file) => {
                const formData = new FormData();
                formData.append("file", file);
                
                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData
                });
                
                if(res.ok) {
                    const data = await res.json();
                    return data.url;
                }
                return null;
            })
        );

        const successfulUploads = uploads.filter(url => url !== null) as string[];
        setNewPhotos(prev => [...prev, ...successfulUploads]);
        
    } catch (error) {
        alert("Fotoğraf yükleme hatası");
    } finally {
        setUploading(false);
        // Reset input
        if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async (status: string, archive?: boolean) => {
    setSaving(true);
    try {
        const payload: any = {
            status,
            notes,
            checklistItems: items,
            newPhotoUrls: newPhotos 
        };
        
        if (archive) payload.isArchived = true;

        const res = await fetch(`/api/maintenance/logs/${logId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            setNewPhotos([]); 
            if (archive) {
                router.push('/dashboard/maintenance'); // Archived items go to history or disappear
                alert("Bakım arşivlendi.");
            } else if (status === 'COMPLETED') {
                loadLog();
                alert("Bakım tamamlandı!");
            } else if (status === 'APPROVED') {
                loadLog();
                alert("Bakım onaylandı.");
            } else if (status === 'REJECTED') {
                loadLog();
                alert("Bakım reddedildi.");
            } else if (status === 'CANCELLED') {
                alert("Bakım iptal edildi ve arşivlendi.");
                router.push('/maintenance/start'); // Go back to start or home
            } else {
                loadLog();
            }
        } else {
            alert("Kaydedilirken hata oluştu");
        }
    } catch (e) {
        console.error(e);
        alert("Bağlantı hatası");
    } finally {
        setSaving(false);
    }
  };

  // Check if current user is the staff assigned (Simple check)
  const canEdit = !isReadOnly && session?.user.role !== 'PROJECT_MANAGER' && session?.user.role !== 'BRANCH_MANAGER';

  if (loading) return <div className="p-10 text-center">Yükleniyor...</div>;
  if (!log) return <div className="p-10 text-center">Kayıt bulunamadı.</div>;

  const isSuperAdmin = session?.user.role === 'SUPER_ADMIN';
  const isApprover = isSuperAdmin || session?.user.role === 'PROJECT_MANAGER' || session?.user.role === 'BRANCH_MANAGER';

  // Visibility Logic for Sticky Footer
  const showTechActions = canEdit;
  const showApproverActions = (log.status === 'PENDING_APPROVAL' || log.status === 'COMPLETED') && isApprover;
  const showArchiveActions = isSuperAdmin && (log.status === 'APPROVED' || log.status === 'COMPLETED') && !log.isArchived;
  const showFooter = showTechActions || showApproverActions || showArchiveActions;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className={`max-w-xl mx-auto pt-6 px-4 ${showFooter ? 'pb-64' : 'pb-6'}`}>
        
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-6">
           <button onClick={() => router.back()} className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
               <span className="mr-1">←</span> Geri
           </button>
           <h2 className="font-bold text-gray-800 dark:text-gray-100">Bakım Detayı</h2>
           <div className="w-10"></div> {/* Spacer */}
        </div>

        <div className="mb-6 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
           <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{log.branch.name}</h1>
           <p className="text-sm text-gray-500 dark:text-gray-400">{log.branch.address}</p>
           <div className="mt-3 flex space-x-2">
            <span className={`text-xs px-2 py-1 rounded-full font-bold ${getStatusColor(log.status)}`}>{getStatusLabel(log.status)}</span>
         </div>
         {log.status === 'REJECTED' && canEdit && (
             <div className="mt-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm">
                 Bu bakım reddedildi/geri gönderildi. Lütfen eksikleri tamamlayıp tekrar gönderin.
             </div>
         )}
      </div>

      {/* Instructions (If Any) */}
      {log.instructions && (
        <div className="mb-6">
             <details className="group bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl overflow-hidden transition-all duration-300">
                <summary className="flex items-center justify-between p-4 cursor-pointer list-none text-amber-800 dark:text-amber-200 font-bold select-none">
                    <span className="flex items-center">
                        <span className="mr-2">📋</span> Bakım Talimatları & Yönergeler
                    </span>
                    <span className="transform group-open:rotate-180 transition-transform duration-300 text-xs">▼</span>
                </summary>
                <div className="px-4 pb-4 text-sm text-amber-900 dark:text-amber-100 whitespace-pre-wrap leading-relaxed border-t border-amber-100 dark:border-amber-800/50 pt-2">
                    {log.instructions}
                </div>
             </details>
        </div>
      )}

      {/* Checklist */}
      <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-3 px-1">Kontrol Listesi</h3>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 mb-6 overflow-hidden">
        {items.map((item) => (
            <div 
                key={item.id} 
                onClick={() => toggleItem(item.id)}
                className={`p-4 flex items-start space-x-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!canEdit ? 'cursor-default' : ''}`}
            >
                <div className={`w-6 h-6 flex-shrink-0 mt-0.5 rounded-full border-2 flex items-center justify-center transition-colors ${item.isChecked ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600'}`}>
                    {item.isChecked && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <span className={`text-sm leading-relaxed ${item.isChecked ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>{item.question}</span>
            </div>
        ))}
        {items.length === 0 && <div className="p-4 text-center text-gray-400">Liste boş.</div>}
      </div>

      {/* Notes */}
      <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-3 px-1">Notlar</h3>
      <textarea
        disabled={!canEdit}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Bakım ile ilgili notlar..."
        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-500 dark:disabled:text-gray-400 dark:text-gray-100"
        rows={4}
      />

      {/* Photos */}
      <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-3 px-1">Fotoğraflar</h3>
      <div className="grid grid-cols-3 gap-3 mb-6">
         {log.photos.map(photo => (
             <div 
                key={photo.id} 
                onClick={() => setSelectedPhoto(photo.url)}
                className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-90 transition-opacity"
             >
                 <img src={photo.url} alt="Bakım" className="w-full h-full object-cover" />
             </div>
         ))}
         
         {/* Pending Photos */}
         {newPhotos.map((url, idx) => (
             <div key={`new-${idx}`} className="aspect-square bg-blue-50 dark:bg-blue-900/30 rounded-lg overflow-hidden border-2 border-blue-200 dark:border-blue-700 relative">
                 <img src={url} alt="Yeni" className="w-full h-full object-cover opacity-80" />
                 <div className="absolute inset-0 flex items-center justify-center">
                     <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full shadow">Yeni</span>
                 </div>
             </div>
         ))}

         {canEdit && (
             <div className="aspect-square bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
             >
                 {uploading ? (
                     <span className="animate-spin h-6 w-6 border-2 border-gray-400 border-t-transparent rounded-full"></span>
                 ) : (
                     <>
                        <span className="text-2xl mb-1">+</span>
                        <span className="text-xs">Ekle</span>
                     </>
                 )}
                 <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*"
                    multiple
                 />
             </div>
         )}
      </div>

       {/* Super Admin Status Override */}
       {isSuperAdmin && (
        <div className={`${showFooter ? 'mb-24' : 'mb-6'} p-5 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800`}>
            <h3 className="font-bold text-purple-900 dark:text-purple-100 mb-3 text-sm flex items-center">
                <span className="mr-2">⚡</span> Yönetici İşlemleri
            </h3>
            <div className="flex flex-col space-y-2">
                <label className="text-xs text-purple-700 dark:text-purple-300 font-semibold">Durumu Zorla Değiştir:</label>
                <select 
                    value={log.status}
                    onChange={(e) => {
                        if(confirm('Bakım durumunu manuel olarak değiştirmek istediğinize emin misiniz? Bu işlem iş akışını atlayabilir.')) {
                            handleSave(e.target.value);
                        }
                    }}
                    disabled={saving}
                    className="w-full p-3 rounded-lg border border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-purple-100 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
                >
                     <option value="PENDING">Bekliyor (PENDING)</option>
                     <option value="IN_PROGRESS">İşlemde (IN_PROGRESS)</option>
                     <option value="NEEDS_VISIT">Tekrar Ziyaret (NEEDS_VISIT)</option>
                     <option value="INCOMPLETE">Eksik / Malzeme (INCOMPLETE)</option>
                     <option value="PENDING_APPROVAL">Onay Bekliyor (PENDING_APPROVAL)</option>
                     <option value="APPROVED">Onaylandı (APPROVED)</option>
                     <option value="COMPLETED">Tamamlandı (COMPLETED)</option>
                     <option value="REJECTED">Reddedildi (REJECTED)</option>
                     <option value="CANCELLED">İptal Edildi (CANCELLED)</option>
                     <option value="ARCHIVED">Arşivlenmiş (ARCHIVED)</option>
                </select>
                <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-1">
                    Bu alan sadece Süper Admin yetkisine sahip kullanıcılar tarafından görülebilir.
                </p>
            </div>
        </div>
      )}

      {showFooter && (
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex flex-col space-y-3 max-w-xl mx-auto z-40">
          
          {/* Technician Actions */}
          {showTechActions && (
              <div className="grid grid-cols-2 gap-2">
                <button 
                    onClick={() => handleSave('IN_PROGRESS')}
                    disabled={saving}
                    className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-3 rounded-xl font-bold transition-colors text-sm"
                >
                    💾 Kaydet (Sürdür)
                </button>
                <button 
                    onClick={() => {
                        if(confirm("Bu bakımı 'Tekrar Ziyaret Gerekli' olarak işaretlemek üzeresiniz.\n\nEmin misiniz?")) {
                            handleSave('NEEDS_VISIT');
                        }
                    }}
                    disabled={saving}
                    className="bg-orange-100 dark:bg-orange-900/40 hover:bg-orange-200 text-orange-800 dark:text-orange-200 py-3 rounded-xl font-bold transition-colors text-sm"
                >
                    📅 Tekrar Ziyaret
                </button>
                <button 
                    onClick={() => {
                        if(confirm("Bu bakımı 'Eksik / Malzeme' olarak işaretlemek üzeresiniz.\n\nEmin misiniz?")) {
                            handleSave('INCOMPLETE');
                        }
                    }}
                    disabled={saving}
                    className="bg-yellow-100 dark:bg-yellow-900/40 hover:bg-yellow-200 text-yellow-800 dark:text-yellow-200 py-3 rounded-xl font-bold transition-colors text-sm"
                >
                    ⚠️ Eksik / Malzeme
                </button>
                <button 
                    onClick={() => {
                        const allChecked = items.every(i => i.isChecked);
                        if(!allChecked && !confirm("Tüm maddeler işaretlenmemiş. Yine de onaya göndermek istiyor musunuz?")) return;
                        handleSave('PENDING_APPROVAL');
                    }}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-colors shadow-lg shadow-green-200 dark:shadow-none text-sm"
                >
                    ✅ Onaya Gönder
                </button>
                
                <div className="col-span-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button 
                        onClick={() => {
                            if(confirm("Bakımı İPTAL etmek istediğinize emin misiniz? Bu işlem geri alınamaz ve bakım arşive kaldırılır.")) {
                                handleSave('CANCELLED');
                            }
                        }}
                        disabled={saving}
                        className="w-full bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 py-3 rounded-xl font-bold transition-colors text-sm"
                    >
                        🚫 Bakımı İptal Et
                    </button>
                </div>
              </div>
          )}

          {/* Approver Actions (If Pending Approval) */}
          {showApproverActions && (
               <div className="flex space-x-2">
                <button 
                    onClick={() => handleSave('REJECTED')}
                    disabled={saving}
                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-200 py-3 rounded-xl font-bold transition-colors"
                >
                    Reddet
                </button>
                <button 
                    onClick={() => handleSave('APPROVED')} 
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-colors shadow-lg shadow-blue-200 dark:shadow-none"
                >
                    Onayla & Tamamla
                </button>
               </div>
          )}

           {/* Super Admin Archive Action */}
           {showArchiveActions && (
                <button 
                    onClick={() => handleSave('ARCHIVED', true)} 
                    className="w-full bg-gray-800 dark:bg-gray-700 text-white py-3 rounded-xl font-bold"
                >
                    📂 Arşivle
                </button>
           )}
      </div>
      )}

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedPhoto(null)}>
            <div className="relative w-full max-w-4xl h-full flex items-center justify-center">
                <button 
                    onClick={() => setSelectedPhoto(null)}
                    className="absolute top-4 right-4 z-50 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <img 
                    src={selectedPhoto} 
                    alt="Tam Ekran" 
                    className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                    onClick={(e) => e.stopPropagation()} 
                />
            </div>
        </div>
      )}
    </div>
    </div>
  );
}

export default function MaintenanceProcessPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Yükleniyor...</div>}>
      <MaintenanceProcessPageContent />
    </Suspense>
  );
}
