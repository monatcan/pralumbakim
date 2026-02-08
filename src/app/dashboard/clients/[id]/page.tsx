"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { QRCodeSVG } from "qrcode.react";

interface Branch {
  id: string;
  name: string;
  qrCode: string;
  address: string | null;
  _count: {
    maintenanceLogs: number;
  };
}

interface Client {
  id: string;
  name: string;
  logo: string | null;
}

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const router = useRouter();
  const { data: session } = useSession();

  const [client, setClient] = useState<Client | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [selectedBranchForQR, setSelectedBranchForQR] = useState<Branch | null>(null);

  // Form State
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchAddress, setNewBranchAddress] = useState("");
  const [newUser, setNewUser] = useState({ fullName: "", email: "", password: "", role: "PROJECT_MANAGER" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  useEffect(() => {
    if (clientId) {
      fetchData();
    }
  }, [clientId]);

  const fetchData = async () => {
    try {
      const [clientRes, branchesRes] = await Promise.all([
        fetch(`/api/clients/${clientId}`),
        fetch(`/api/clients/${clientId}/branches`)
      ]);

      if (clientRes.ok) setClient(await clientRes.json());
      if (branchesRes.ok) setBranches(await branchesRes.json());
      
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        const res = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...newUser, clientId }),
        });

        if (res.ok) {
            setIsAddUserModalOpen(false);
            setNewUser({ fullName: "", email: "", password: "", role: "PROJECT_MANAGER" });
            alert("Kullanıcı eklendi");
        } else {
            const err = await res.json();
            alert(err.error || "Hata oluştu");
        }
    } catch(e) {
        alert("Bağlantı hatası");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!importFile) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("file", importFile);

    try {
        const res = await fetch(`/api/clients/${clientId}/branches/import`, {
            method: "POST",
            body: formData
        });
        
        const data = await res.json();
        
        if (res.ok) {
            alert(data.message + (data.details.errorCount > 0 ? ` (${data.details.errorCount} hata)` : ""));
            setIsImportModalOpen(false);
            setImportFile(null);
            fetchData();
        } else {
            alert(data.error || "Yükleme başarısız");
        }
    } catch(err) {
        alert("Yükleme sırasında hata oluştu");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/clients/${clientId}/branches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            name: newBranchName,
            address: newBranchAddress 
        }),
      });

      if (response.ok) {
        setNewBranchName("");
        setNewBranchAddress("");
        setIsAddBranchModalOpen(false);
        fetchData();
      } else {
        alert("Şube eklenirken hata oluştu.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShowQR = (branch: Branch) => {
    setSelectedBranchForQR(branch);
    setIsQRModalOpen(true);
  };

    const downloadQR = async () => {
    const svg = document.getElementById("qr-code-svg");
    if (svg && selectedBranchForQR && client) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        
        // Prepare User Logo if exists
        let userLogoImg: HTMLImageElement | null = null;
        if (client.logo) {
            const logo = new Image();
            logo.crossOrigin = "anonymous";
            logo.src = client.logo;
            await new Promise((resolve) => {
                logo.onload = () => {
                    userLogoImg = logo;
                    resolve(true);
                };
                logo.onerror = () => resolve(false);
            });
        }
        
        // Canvas Settings (High Resolution for Print)
        const qrSize = 600; 
        const padding = 100;
        const headerHeight = 140; 
        const footerHeight = 140; 
        const totalWidth = qrSize + (padding * 2);
        const totalHeight = headerHeight + qrSize + footerHeight;

        img.onload = () => {
            if(!ctx) return;
            canvas.width = totalWidth;
            canvas.height = totalHeight;
            
            // Background
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, totalWidth, totalHeight);
            
            // Text Styles
            ctx.textAlign = "center";
            
            // Header: Client Name (Top Center)
            ctx.fillStyle = "#000000";
            ctx.font = "bold 64px Arial, sans-serif";
            ctx.textBaseline = "middle";
            ctx.fillText(client.name, totalWidth/2, headerHeight/2 + 30);
            
            // Draw QR (Middle)
            ctx.drawImage(img, padding, headerHeight, qrSize, qrSize);

            // Draw Logo Centered (Standardized)
             if (userLogoImg) {
                const logoSize = qrSize * 0.22; // ~22% of QR size
                const logoX = padding + (qrSize - logoSize) / 2;
                const logoY = headerHeight + (qrSize - logoSize) / 2;
                
                // Draw white background behind logo for better contrast
                // (Only if image isn't transparent, but safe to do anyway)
                // ctx.fillStyle = "#ffffff";
                // ctx.fillRect(logoX, logoY, logoSize, logoSize);
                
                // Calculate aspect ratio fit (contain)
                const scale = Math.min(logoSize / userLogoImg.width, logoSize / userLogoImg.height);
                const w = userLogoImg.width * scale;
                const h = userLogoImg.height * scale;
                const x = logoX + (logoSize - w) / 2;
                const y = logoY + (logoSize - h) / 2;
                
                ctx.drawImage(userLogoImg, x, y, w, h);
            }

            // Footer: Branch Name (Bottom Center)
            ctx.fillStyle = "#444444";
            ctx.font = "bold 48px Arial, sans-serif";
            ctx.textBaseline = "middle";
            ctx.fillText(selectedBranchForQR.name, totalWidth/2, headerHeight + qrSize + 50);
            
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = `QR-${client.name}-${selectedBranchForQR.name}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };
        // Encode properly for UTF-8 support
        const base64Data = btoa(unescape(encodeURIComponent(svgData)));
        img.src = "data:image/svg+xml;base64," + base64Data;
    }
  };

  if (loading) return <div>Yükleniyor...</div>;
  if (!client) return <div>Firma bulunamadı.</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <button 
            onClick={() => router.back()} 
            className="text-sm text-gray-500 hover:text-gray-900 mb-2 block"
          >
            ← Geri Dön
          </button>
          <div className="flex items-center">
             <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3">
                {client.name.charAt(0)}
             </div>
             <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{client.name}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Şube ve QR Kod Yönetimi</p>
             </div>
          </div>
        </div>
        <div className="space-x-2">
            <button
            onClick={() => setIsImportModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
            >
            📤 Excel ile Yükle
            </button>
            <button
            onClick={() => setIsAddUserModalOpen(true)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
            >
            + Kullanıcı Ekle
            </button>
            <button
            onClick={() => setIsAddBranchModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
            >
            + Yeni Şube Ekle
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Şube Adı</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Adres</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bakım Sayısı</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">İşlemler</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {branches.length === 0 ? (
                <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                        Bu firmaya ait henüz bir şube yok.
                    </td>
                </tr>
            ) : (
                branches.map((branch) => (
                <tr key={branch.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900 dark:text-white">{branch.name}</div>
                        <div className="text-xs text-gray-400">ID: {branch.id.substring(0,8)}...</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {branch.address || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {branch._count.maintenanceLogs} Kayıt
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button 
                            onClick={() => router.push(`/maintenance/history/${branch.id}`)}
                            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-md transition-colors"
                        >
                            Geçmiş
                        </button>
                        <button 
                            onClick={() => handleShowQR(branch)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-md transition-colors"
                        >
                            QR
                        </button>
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Excel ile Toplu Şube Yükle</h3>
                <form onSubmit={handleImport}>
                     <div className="mb-4 text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="font-bold mb-1">Desteklenen format: .xlsx</p>
                        <p>Sütunlar: <strong>Şube Adı</strong> (veya Name), <strong>Adres</strong> (Address)</p>
                     </div>
                     <div className="space-y-4 mb-6">
                         <div className="relative border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                            <input 
                                type="file" 
                                accept=".xlsx, .xls"
                                required
                                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                className="w-full h-full opacity-0 absolute inset-0 cursor-pointer" 
                            />
                            {importFile ? (
                                <div className="text-green-600 font-bold">{importFile.name}</div>
                            ) : (
                                <div className="text-gray-500 text-sm">
                                    Dosya seçmek için tıklayın veya sürükleyin<br/>
                                    <span className="text-xs text-gray-400 mt-1">.xlsx dosyaları</span>
                                </div>
                            )}
                         </div>
                     </div>
                     <div className="flex justify-end space-x-3">
                        <button type="button" onClick={() => { setIsImportModalOpen(false); setImportFile(null); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">İptal</button>
                        <button type="submit" disabled={!importFile || isSubmitting} className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">
                            {isSubmitting ? 'Yükleniyor...' : 'Yükle'}
                        </button>
                    </div>
                </form>
             </div>
        </div>
      )}

      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Yeni Kullanıcı Ekle</h3>
                <form onSubmit={handleAddUser}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ad Soyad</label>
                            <input type="text" required className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white" value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                            <input type="email" required className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Şifre</label>
                            <input type="password" required className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol</label>
                            <select className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                                <option value="PROJECT_MANAGER">Proje Yöneticisi</option>
                                <option value="BRANCH_MANAGER">Şube Yöneticisi</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={() => setIsAddUserModalOpen(false)} className="px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">İptal</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{isSubmitting ? "..." : "Ekle"}</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {isAddBranchModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Yeni Şube Ekle</h3>
                <form onSubmit={handleAddBranch}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Şube Adı</label>
                            <input 
                                type="text"
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                value={newBranchName}
                                onChange={(e) => setNewBranchName(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adres / Konum</label>
                            <textarea 
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                rows={3}
                                value={newBranchAddress}
                                onChange={(e) => setNewBranchAddress(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button 
                            type="button" 
                            onClick={() => setIsAddBranchModalOpen(false)}
                            className="px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                        >
                            İptal
                        </button>
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {isQRModalOpen && selectedBranchForQR && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative animate-in fade-in zoom-in duration-200">
                <button 
                    onClick={() => setIsQRModalOpen(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-white/80 rounded-full p-1 z-10"
                >
                    ✕
                </button>
                
                {/* Visual Preview Container - Mimics the Downloaded PNG */}
                <div id="qr-preview-container" className="p-8 pb-6 bg-white flex flex-col items-center">
                    <h3 className="text-3xl font-bold text-gray-900 mb-6">{client.name}</h3>
                    
                    <div className="bg-white relative">
                        <QRCodeSVG 
                            id="qr-code-svg"
                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/maintenance/start?branchId=${selectedBranchForQR.id}&code=${selectedBranchForQR.qrCode}`}
                            size={280}
                            level={"H"}
                            includeMargin={true}
                            imageSettings={client?.logo ? {
                                src: "", // Empty src to just create the space/excavation
                                height: 70,
                                width: 70,
                                excavate: true,
                            } : undefined}
                        />
                         {client?.logo && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60px] h-[60px] flex items-center justify-center">
                                <img 
                                    src={client.logo} 
                                    alt="Logo" 
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        )}
                    </div>

                    <p className="text-xl font-bold text-gray-700 mt-6">{selectedBranchForQR.name}</p>
                </div>

                {/* Actions Footer */}
                <div className="bg-gray-50 border-t border-gray-100 p-4 space-y-3">
                    <button 
                        onClick={downloadQR}
                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center shadow-lg shadow-blue-200"
                    >
                        💾 PNG Olarak İndir
                    </button>
                    <button 
                        onClick={() => {
                            if (typeof window !== 'undefined') {
                                navigator.clipboard.writeText(`${window.location.origin}/maintenance/start?branchId=${selectedBranchForQR.id}&code=${selectedBranchForQR.qrCode}`);
                                alert("Link kopyalandı!");
                            }
                        }}
                        className="w-full bg-white text-gray-700 border border-gray-200 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                    >
                        🔗 Linki Kopyala
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
