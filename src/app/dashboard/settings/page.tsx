import Link from "next/link";

export default function SettingsPage() {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Ayarlar</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Sistem yapılandırma ve tercihlerini buradan yönetebilirsiniz.</p>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Checklist Settings Card */}
            <Link href="/dashboard/settings/checklists" className="group">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-full hover:shadow-md transition-shadow cursor-pointer">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform">
                        📋
                    </div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-2">Bakım Şablonları</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Müşterilere özel veya genel bakım kontrol listelerini (checklist) oluşturun ve düzenleyin.
                    </p>
                </div>
            </Link>

            {/* Placeholder for other settings */}
            <div className="opacity-50 pointer-events-none">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-full">
                     <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4 text-2xl">
                        🔔
                    </div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-2">Bildirim Ayarları</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        (Yakında) E-posta ve sistem bildirim tercihlerini yapılandırın.
                    </p>
                </div>
            </div>
             <div className="opacity-50 pointer-events-none">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-full">
                     <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4 text-2xl">
                        🔐
                    </div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-2">Güvenlik</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        (Yakında) Şifre politikaları ve oturum ayarları.
                    </p>
                </div>
            </div>
        </div>
      </div>
    );
  }
