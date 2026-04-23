export default defineNuxtPlugin(() => {
  // Pastikan script hanya berjalan di client-side
  if (process.client) {
    // Load Google Analytics script
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=G-670FTYY5R1";
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(arguments);
    }

    gtag("js", new Date());
    gtag("config", "G-670FTYY5R1");

    // Make gtag available globally
    window.gtag = gtag;
  }
});

// Type declaration untuk TypeScript
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}
