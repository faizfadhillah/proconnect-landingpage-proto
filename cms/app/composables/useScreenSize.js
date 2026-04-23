import { ref, onMounted, onUnmounted } from "vue";

export function useScreenSize() {
  const isMobile = ref(false);
  const isTablet = ref(false);
  const isDesktop = ref(false);

  const checkScreenSize = () => {
    const width = window.innerWidth;
    isMobile.value = width < 960;
    isTablet.value = width < 1420;
    isDesktop.value = width >= 960;
  };

  onMounted(() => {
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", checkScreenSize);
  });

  return {
    isMobile,
    isTablet,
    isDesktop,
  };
}
