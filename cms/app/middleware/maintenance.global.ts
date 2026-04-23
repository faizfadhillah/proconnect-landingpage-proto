/**
 * Parse datetime string "YYYY-MM-DD HH:mm" dengan timezone Asia/Jakarta (UTC+7)
 * Menggunakan cara yang sama dengan halaman maintenance untuk konsistensi
 */
function parseScheduleDateTime(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  // Format: "YYYY-MM-DD HH:mm" → convert to ISO with Asia/Jakarta offset
  // Cara ini konsisten dengan perhitungan di halaman maintenance.vue
  const iso = trimmed.replace(" ", "T") + "+07:00";
  const d = new Date(iso);
  
  if (Number.isNaN(d.getTime())) {
    return null;
  }

  return d;
}

export default defineNuxtRouteMiddleware((to) => {
  // Izinkan akses ke halaman maintenance
  if (to.path === "/maintenance") {
    return;
  }

  const config = useRuntimeConfig();
  const publicConfig = config.public as {
    MAINTENANCE_MODE?: boolean;
    MAINTENANCE_SCHEDULE_ENABLED?: boolean;
    MAINTENANCE_START_AT?: string;
    MAINTENANCE_END_AT?: string;
  };

  const manualActive = !!publicConfig.MAINTENANCE_MODE;
  let scheduledActive = false;

  if (publicConfig.MAINTENANCE_SCHEDULE_ENABLED) {
    const now = new Date(); // Gunakan Date() langsung untuk konsistensi dengan client
    const start = parseScheduleDateTime(publicConfig.MAINTENANCE_START_AT);
    const end = parseScheduleDateTime(publicConfig.MAINTENANCE_END_AT);

    if (start && end) {
      // Maintenance aktif hanya jika sekarang berada di antara start dan end
      // Jika waktu sudah lewat (now > end), maintenance tidak aktif
      scheduledActive = now >= start && now <= end;
    }
  }

  // Jika MAINTENANCE_MODE manual aktif, selalu maintenance
  // Jika schedule aktif, cek apakah masih dalam jadwal
  const isMaintenanceActive = manualActive || scheduledActive;

  if (isMaintenanceActive) {
    return navigateTo("/maintenance");
  }
});


