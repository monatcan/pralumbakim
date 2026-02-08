"use client";

import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm w-full animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🎉</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">İşlem Başarılı!</h1>
        <p className="text-gray-500 mb-8">Bakım kaydı başarıyla tamamlandı ve sisteme işlendi.</p>
        
        <div className="space-y-3">
            <button 
                onClick={() => router.push("/dashboard")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
            >
                Panele Dön
            </button>
            <button 
                onClick={() => router.back()}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors"
            >
                Geri Dön
            </button>
        </div>
      </div>
    </div>
  );
}
