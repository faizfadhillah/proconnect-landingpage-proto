/**
 * Composable for hash-based tab navigation
 * Provides functionality to sync URL hash with active tab state
 *
 * @param {string} defaultTab - Default tab value if no hash is present
 * @param {Array} validTabs - Array of valid tab values
 * @returns {Object} - Object containing activeTab ref and helper functions
 */
export const useHashTabs = (defaultTab = "", validTabs = []) => {
  const activeTab = ref(defaultTab);

  // Update URL hash when tab changes
  const updateHashFromTab = (tab) => {
    if (process.client) {
      window.location.hash = tab;
    }
  };

  // Update tab from URL hash
  const updateTabFromHash = () => {
    if (process.client) {
      const hash = window.location.hash.slice(1); // Remove the # symbol
      if (validTabs.length === 0 || validTabs.includes(hash)) {
        activeTab.value = hash || defaultTab;
      }
    }
  };

  // Initialize tab from URL hash
  const initializeFromHash = () => {
    updateTabFromHash();
  };

  // Set up hash change listener
  const setupHashListener = () => {
    if (process.client) {
      window.addEventListener("hashchange", updateTabFromHash);
    }
  };

  // Clean up hash change listener
  const cleanupHashListener = () => {
    if (process.client) {
      window.removeEventListener("hashchange", updateTabFromHash);
    }
  };

  // Watch for tab changes and update hash
  watch(activeTab, (newTab) => {
    updateHashFromTab(newTab);
  });

  return {
    activeTab,
    updateHashFromTab,
    updateTabFromHash,
    initializeFromHash,
    setupHashListener,
    cleanupHashListener,
  };
};
