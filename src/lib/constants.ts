export const MAINTENANCE_STATUS_LABELS: Record<string, string> = {
  PENDING: "Bekliyor",
  IN_PROGRESS: "Devam Ediyor",
  COMPLETED: "Tamamlandı",
  APPROVED: "Onaylandı",
  PENDING_APPROVAL: "Onay Bekliyor",
  NEEDS_VISIT: "Tekrar Ziyaret Gerekli",
  INCOMPLETE: "Eksik / Malzeme",
  CANCELLED: "İptal Edildi",
  REJECTED: "Reddedildi",
  ARCHIVED: "Arşivlenmiş"
};

export const MAINTENANCE_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
  IN_PROGRESS: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
  COMPLETED: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
  APPROVED: "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200",
  PENDING_APPROVAL: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
  NEEDS_VISIT: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200",
  INCOMPLETE: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
  CANCELLED: "bg-red-50 dark:bg-red-900/40 text-red-900 dark:text-red-200",
  REJECTED: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
  ARCHIVED: "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
};

export const getStatusLabel = (status: string): string => {
  return MAINTENANCE_STATUS_LABELS[status] || status;
};

export const getStatusColor = (status: string): string => {
  return MAINTENANCE_STATUS_COLORS[status] || "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
};
