"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  clients: { id: string; name: string }[];
  assignedBranches: { id: string; name: string; client: { name: string } }[];
}

interface Client {
    id: string;
    name: string;
    branches: { id: string; name: string }[];
}

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]); // For selection
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "FIELD_STAFF",
    selectedClientIds: [] as string[],
    selectedBranchIds: [] as string[]
  });

  useEffect(() => {
    fetchUsers();
    fetchClients();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  };

  const fetchClients = async () => {
    // Need an endpoint that returns clients AND their branches for selection
    const res = await fetch("/api/clients?includeBranches=true"); 
    if (res.ok) setClients(await res.json());
  };

  const resetForm = () => {
    setFormData({
        email: "",
        password: "",
        fullName: "",
        role: "FIELD_STAFF",
        selectedClientIds: [],
        selectedBranchIds: []
    });
    setEditingId(null);
  };

  const handleEdit = (user: User) => {
      setEditingId(user.id);
      setFormData({
          email: user.email,
          password: "", // Password empty on edit means no change
          fullName: user.fullName,
          role: user.role,
          selectedClientIds: user.clients.map(c => c.id),
          selectedBranchIds: user.assignedBranches.map(b => b.id)
      });
      setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
      if(!confirm("Kullanıcıyı silmek istediğinize emin misiniz?")) return;
      
      try {
          const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
          if(res.ok) {
              fetchUsers();
              alert("Kullanıcı silindi.");
          } else {
              alert("Silme işlemi başarısız.");
          }
      } catch(e) { console.error(e); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const url = editingId ? `/api/users/${editingId}` : "/api/users";
        const method = editingId ? "PUT" : "POST";
        
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            setIsModalOpen(false);
            resetForm();
            fetchUsers();
            alert(editingId ? "Kullanıcı güncellendi." : "Kullanıcı oluşturuldu.");
        } else {
            alert("Hata oluştu.");
        }
    } catch (e) {
        console.error(e);
    }
  };

  const toggleClient = (id: string) => {
      setFormData(prev => {
          const exists = prev.selectedClientIds.includes(id);
          // If unchecking a client, also remove its branches
          let newBranches = prev.selectedBranchIds;
          if (exists) {
              const clientBranches = clients.find(c => c.id === id)?.branches.map(b => b.id) || [];
              newBranches = newBranches.filter(bid => !clientBranches.includes(bid));
          }

          return {
              ...prev,
              selectedClientIds: exists 
                ? prev.selectedClientIds.filter(c => c !== id)
                : [...prev.selectedClientIds, id],
              selectedBranchIds: newBranches
          };
      });
  };

  const toggleBranch = (id: string) => {
      setFormData(prev => {
          const exists = prev.selectedBranchIds.includes(id);
          return {
              ...prev,
              selectedBranchIds: exists 
                ? prev.selectedBranchIds.filter(b => b !== id)
                : [...prev.selectedBranchIds, id]
          };
      });
  };

  const selectAllBranchesForClient = (client: Client) => {
     const branchIds = client.branches.map(b => b.id);
     const allSelected = branchIds.every(id => formData.selectedBranchIds.includes(id));
     
     setFormData(prev => {
         if (allSelected) {
             // Deselect all
             return {
                 ...prev,
                 selectedBranchIds: prev.selectedBranchIds.filter(id => !branchIds.includes(id))
             };
         } else {
             // Select all
             const otherBranches = prev.selectedBranchIds.filter(id => !branchIds.includes(id));
             return {
                 ...prev,
                 selectedBranchIds: [...otherBranches, ...branchIds]
             };
         }
     });
  };

  if (loading) return <div>Yükleniyor...</div>;
  if (session?.user.role !== 'SUPER_ADMIN') return <div>Yetkisiz</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Kullanıcı Yönetimi</h1>
        <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
            + Yeni Kullanıcı
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">İsim / Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Bağlı Firmalar</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Bağlı Şubeler</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">İşlem</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map(user => (
                    <tr key={user.id}>
                        <td className="px-6 py-4">
                            <div className="font-bold text-gray-900 dark:text-gray-100">{user.fullName}</div>
                            <div className="text-gray-500 dark:text-gray-400 text-sm">{user.email}</div>
                        </td>
                        <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded text-xs">{user.role}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {user.clients.map(c => c.name).join(", ") || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {user.assignedBranches.length > 0 
                                ? user.assignedBranches.length + " Şube" 
                                : "-"}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                            <button 
                                onClick={() => handleEdit(user)}
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-200 mr-4"
                            >
                                Düzenle
                            </button>
                            <button 
                                onClick={() => handleDelete(user.id)}
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200"
                            >
                                Sil
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 dark:text-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border dark:border-gray-700">
                <h2 className="text-xl font-bold mb-4">{editingId ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">İsim Soyisim</label>
                            <input 
                                required
                                type="text" 
                                className="w-full border dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                                value={formData.fullName}
                                onChange={e => setFormData({...formData, fullName: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email</label>
                            <input 
                                required
                                type="email" 
                                className="w-full border dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Şifre {editingId && '(Boş ise değişmez)'}</label>
                            <input 
                                required={!editingId}
                                type="password" 
                                className="w-full border dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                                value={formData.password}
                                onChange={e => setFormData({...formData, password: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Rol</label>
                            <select 
                                className="w-full border dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                                value={formData.role}
                                onChange={e => setFormData({...formData, role: e.target.value})}
                            >
                                <option value="FIELD_STAFF">Saha Personeli (Teknisyen)</option>
                                <option value="PROJECT_MANAGER">Proje Yöneticisi</option>
                                <option value="BRANCH_MANAGER">Şube Yöneticisi</option>
                                <option value="SUPER_ADMIN">Süper Admin</option>
                            </select>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                        <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Firma Erişimi</label>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                            {clients.map(client => (
                                <label key={client.id} className="flex items-center space-x-2 cursor-pointer p-1 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.selectedClientIds.includes(client.id)}
                                        onChange={() => toggleClient(client.id)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-500"
                                    />
                                    <span className="text-gray-700 dark:text-gray-300">{client.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {formData.selectedClientIds.length > 0 && (
                        <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Şube Erişimi (Spesifik Şubeler)</label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Eğer boş bırakılırsa, teknisyen seçili firmanın hiçbir şubesini göremez (atanmadıkça).</p>
                            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-600 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                                {clients
                                    .filter(c => formData.selectedClientIds.includes(c.id))
                                    .map(client => (
                                        <div key={client.id} className="col-span-2 border-b border-gray-200 dark:border-gray-700 last:border-0 pb-2 mb-2">
                                            <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-700/50 p-1 mb-1 rounded">
                                                 <span className="font-bold text-gray-700 dark:text-gray-300 px-1">{client.name} Şubeleri</span>
                                                 <button 
                                                    type="button"
                                                    onClick={() => selectAllBranchesForClient(client)}
                                                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium px-2 py-1"
                                                 >
                                                    Tümünü Seç / Kaldır
                                                 </button>
                                            </div>
                                            <div className="pl-4 grid grid-cols-2 gap-2">
                                                {client.branches?.map(branch => (
                                                    <label key={branch.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 p-1 rounded transition-colors">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={formData.selectedBranchIds.includes(branch.id)}
                                                            onChange={() => toggleBranch(branch.id)}
                                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-500"
                                                        />
                                                        <span className="text-sm text-gray-600 dark:text-gray-300">{branch.name}</span>
                                                    </label>
                                                ))}
                                                {(!client.branches || client.branches.length === 0) && <span className="text-xs text-gray-400">Şube yok</span>}
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-2 pt-4">
                        <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            İptal
                        </button>
                        <button 
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white transition-colors"
                        >
                            {editingId ? 'Güncelle' : 'Oluştur'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
