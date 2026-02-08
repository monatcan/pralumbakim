"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Client {
  id: string;
  name: string;
  logo: string | null;
  _count: {
    branches: number;
    users: number;
  };
  createdAt: string;
}

export default function ClientsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // New Client Form State
  const [newClientName, setNewClientName] = useState("");
  const [newClientLogo, setNewClientLogo] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchClients();
  }, [session]);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      } else {
        console.error("Failed to fetch clients");
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let logoUrl = editingClient?.logo || null;

      // 1. Upload Logo if exists
      if (newClientLogo) {
          const formData = new FormData();
          formData.append("file", newClientLogo);
          const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
          if(uploadRes.ok) {
              const data = await uploadRes.json();
              logoUrl = data.url;
          }
      }

      // 2. Create or Update Client
      const url = editingClient ? `/api/clients/${editingClient.id}` : "/api/clients";
      const method = editingClient ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newClientName, logo: logoUrl }),
      });

      if (response.ok) {
        setNewClientName("");
        setNewClientLogo(null);
        setEditingClient(null);
        setIsModalOpen(false);
        fetchClients(); // Refresh list
      } else {
        alert("İşlem sırasında bir hata oluştu.");
      }
    } catch (error) {
      console.error("Error saving client:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (client: Client) => {
      setEditingClient(client);
      setNewClientName(client.name);
      setNewClientLogo(null);
      setIsModalOpen(true);
  };

  const openNewModal = () => {
      setEditingClient(null);
      setNewClientName("");
      setNewClientLogo(null);
      setIsModalOpen(true);
  }

  if (loading) return <div>Yükleniyor...</div>;

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Müşteriler / Firmalar</h1>
          <p className="text-gray-500 dark:text-gray-400">Sistemdeki kayıtlı firmaları yönetin.</p>
        </div>
        {isSuperAdmin && (
            <button
            onClick={openNewModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors"
            >
            <span className="mr-2">+</span> Yeni Firma Ekle
            </button>
        )}
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.length === 0 ? (
            <div className="col-span-full text-center py-10 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 border-dashed">
                <p className="text-gray-500 dark:text-gray-400">Henüz kayıtlı firma yok.</p>
            </div>
        ) : (
            clients.map((client) => (
            <div key={client.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xl mr-4">
                        {client.logo ? <img src={client.logo} alt={client.name} className="w-full h-full rounded-full object-cover"/> : client.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{client.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">ID: {client.id.substring(0, 8)}...</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-700 pt-4 mt-2">
                    <div className="text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Şubeler</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{client._count.branches}</p>
                    </div>
                    <div className="text-center border-l border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kullanıcılar</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{client._count.users}</p>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <button 
                        onClick={() => openEditModal(client)}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
                    >
                        Düzenle
                    </button>
                    <Link href={`/dashboard/clients/${client.id}`} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                        Detaylar &rarr;
                    </Link>
                </div>
            </div>
            ))
        )}
      </div>

      {/* Add/Edit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 dark:text-white">{editingClient ? "Firmayı Düzenle" : "Yeni Firma Ekle"}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        ✕
                    </button>
                </div>
                
                <form onSubmit={handleSaveClient} className="p-6">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Firma Adı</label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Örn: ABC Holding"
                            value={newClientName}
                            onChange={(e) => setNewClientName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Logo (Opsiyonel)</label>
                        <input 
                            type="file" 
                            accept="image/*"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            onChange={(e) => setNewClientLogo(e.target.files?.[0] || null)}
                        />
                    </div>
                    
                    <div className="flex justify-end space-x-3 mt-6">
                        <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm"
                        >
                            İptal
                        </button>
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center"
                        >
                            {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
