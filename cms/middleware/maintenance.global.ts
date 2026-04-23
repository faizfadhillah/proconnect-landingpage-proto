function getJakartaDate(): Date {
  const now = new Date();
  const jakartaOffsetMinutes = 7 * 60;
  const utcTotalMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const jakartaMinutes =
    (utcTotalMinutes + jakartaOffsetMinutes + 24 * 60) % (24 * 60);

  const jakarta = new Date(now);
  jakarta.setUTCHours(0, 0, 0, 0);
  const hours = Math.floor(jakartaMinutes / 60);
  const minutes = jakartaMinutes % 60;
  jakarta.setHours(hours, minutes, 0, 0);

  return jakarta;
}

function isWithinDateRange(startDate?: string, endDate?: string): boolean {
  // Jika tidak ada tanggal, anggap selalu true (hanya pakai jam)
  if (!startDate && !endDate) {
    return true;
  }

  const jakarta = getJakartaDate();
  const currentDateStr = jakarta.toISOString().slice(0, 10); // YYYY-MM-DD

  if (startDate && currentDateStr < startDate) {
    return false;
  }

  if (endDate && currentDateStr > endDate) {
    return false;
  }

  return true;
}

function isWithinTimeRange(startTime: string, endTime: string): boolean {
  if (!startTime || !endTime) {
    return false;
  }

  const jakarta = getJakartaDate();
  const partsStart = startTime.split(":");
  const partsEnd = endTime.split(":");

  if (partsStart.length !== 2 || partsEnd.length !== 2) {
    return false;
  }

  const startHour = Number(partsStart[0]);
  const startMinute = Number(partsStart[1]);
  const endHour = Number(partsEnd[0]);
  const endMinute = Number(partsEnd[1]);

  if ([startHour, startMinute, endHour, endMinute].some((v) => Number.isNaN(v))) {
    return false;
  }

  const currentMinutes = jakarta.getHours() * 60 + jakarta.getMinutes();
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  // Jika jadwal tidak melewati tengah malam (contoh: 22:00-23:00)
  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  // Jika jadwal melewati tengah malam (contoh: 22:00-02:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  // Start dan end sama => tidak aktifkan jadwal
  return false;
}

export default defineNuxtRouteMiddleware((to) => {
  // Izinkan akses ke halaman maintenance dan asset publik
  if (to.path === "/maintenance") {
    return;
  }

  // Baca config runtime dari server
  const config = useRuntimeConfig();

  const schedule = config.maintenanceSchedule;
  const isScheduled =
    schedule?.enabled &&
    isWithinDateRange(
      (schedule.startDate as string) || undefined,
      (schedule.endDate as string) || undefined
    ) &&
    isWithinTimeRange(
      schedule.startTime as string,
      schedule.endTime as string
    );

  const isMaintenanceActive = config.maintenanceMode || isScheduled;

  // Jika MAINTENANCE_MODE aktif (manual) atau sedang dalam jadwal, redirect semua route ke halaman maintenance
  if (isMaintenanceActive) {
    return navigateTo("/maintenance");
  }
});


