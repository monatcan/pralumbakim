"use client";

import { useState, useEffect } from "react";

  interface ChecklistTemplate {
  id: string;
  name: string;
  items: string[];
  instructions?: string | null;
  isGlobal: boolean;
  clientId: string | null;
  client?: { name: string };
}

interface Client {
    id: string;
    name: string; 
}

export default function ChecklistSettingsPage() {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New/Edit Form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [itemsText, setItemsText] = useState(""); // line separated
  const [instructions, setInstructions] = useState(""); // NEW
  const [isGlobal, setIsGlobal] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState("");

  useEffect(() => {
    fetchTemplates();
    fetchClients();
  }, []);

  const fetchTemplates = async () => {
    const res = await fetch("/api/settings/checklists");
    if (res.ok) setTemplates(await res.json());
    setLoading(false);
  };

  const fetchClients = async () => {
      const res = await fetch("/api/clients");
      if(res.ok) setClients(await res.json());
  };

  const handleOpenCreate = () => {
      setEditingId(null);
      setName("");
      setItemsText("");
      setInstructions(""); // NEW
      setIsGlobal(true);
      setSelectedClientId("");
      setIsModalOpen(true);
  };

  const handleOpenEdit = (t: ChecklistTemplate) => {
      setEditingId(t.id);
      setName(t.name);
      setItemsText(t.items.join("\n"));
      setInstructions(t.instructions || ""); // NEW
      setIsGlobal(t.isGlobal);
      setSelectedClientId(t.clientId || "");
      setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
      if(!confirm("Bu listeyi silmek istediğinize emin misiniz?")) return;
      
      const res = await fetch(`/api/settings/checklists?id=${id}`, { method: 'DELETE' });
      if(res.ok) {
          fetchTemplates();
      } else {
          alert("Silme işlemi başarısız.");
      }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = itemsText.split("\n").filter(i => i.trim() !== "");
    
    const payload = {
        name,
        items,
        instructions: instructions || null, // NEW
        isGlobal,
        clientId: isGlobal ? undefined : selectedClientId
    };

    if (editingId) {
        // Update
        await fetch("/api/settings/checklists", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, id: editingId })
        });
    } else {
        // Create
        await fetch("/api/settings/checklists", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    }
    
    setIsModalOpen(false);
    fetchTemplates();
  };

  return (
    <div className="p-8 text-gray-900 dark:text-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Kontrol Listeleri</h1>
        <button 
            onClick={handleOpenCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
            + Yeni Liste Oluştur
        </button>
      </div>

      <div className="grid gap-4">
        {templates.map(t => (
            <div key={t.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors relative group">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center space-x-2">
                             <h3 className="font-bold text-gray-900 dark:text-white">{t.name}</h3>
                             <span className={`text-xs px-2 py-1 rounded font-medium ${t.isGlobal ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'}`}>
                                {t.isGlobal ? "Genel" : t.client?.name || "Özel"}
                            </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <ul className="list-disc pl-4">
                                {t.items.slice(0, 3).map((i, idx) => <li key={idx}>{i}</li>)}
                                {t.items.length > 3 && <li>... (+{t.items.length - 3})</li>}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Edit/Delete Actions */}
                <div className="absolute top-4 right-4 flex space-x-2">
                     <button 
                        onClick={() => handleOpenEdit(t)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Düzenle"
                     >
                        ✏️
                     </button>
                     <button 
                         onClick={() => handleDelete(t.id)}
                         className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Sil"
                     >
                        🗑️
                     </button>
                </div>
            </div>
        ))}
      </div>
      
      {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{editingId ? "Listeyi Düzenle" : "Yeni Liste"}</h3>
                  <form onSubmit={handleSave}>
                      <div className="space-y-4">
                          <input 
                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-colors" 
                            placeholder="Liste Adı"
                            value={name} onChange={e => setName(e.target.value)}
                          />
                          <textarea 
                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-colors" 
                            rows={5}
                            placeholder="Maddeler (Her satıra bir tane)"
                            value={itemsText} onChange={e => setItemsText(e.target.value)}
                          />
                          
                          <div className="relative">
                            <label className="text-xs font-bold text-gray-500 uppercase">Saha Personeli Talimatları (Opsiyonel)</label>
                            <textarea 
                                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:ring-2 focus:ring-yellow-500 outline-none transition-colors" 
                                rows={3}
                                placeholder="Gerekli ekipmanlar, uyarılar veya özel yönergeler..."
                                value={instructions} onChange={e => setInstructions(e.target.value)}
                            />
                          </div>
                          <label className="flex items-center space-x-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={isGlobal} 
                                onChange={e => setIsGlobal(e.target.checked)} 
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-gray-700 dark:text-gray-300">Tüm Müşteriler İçin Geçerli (Genel)</span>
                          </label>

                          {!isGlobal && (
                              <div>
                                  <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">Müşteri Seçin</label>
                                  <select 
                                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                    value={selectedClientId}
                                    onChange={e => setSelectedClientId(e.target.value)}
                                    required={!isGlobal}
                                  >
                                      <option value="">Seçiniz...</option>
                                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                  </select>
                              </div>
                          )}

                      </div>
                      <div className="mt-6 flex justify-end space-x-3">
                          <button 
                            type="button" 
                            onClick={() => setIsModalOpen(false)} 
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded transition-colors"
                          >
                            İptal
                          </button>
                          <button 
                            type="submit" 
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                          >
                            {editingId ? "Güncelle" : "Kaydet"}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}
