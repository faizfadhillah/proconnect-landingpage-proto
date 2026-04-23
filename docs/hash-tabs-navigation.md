# Hash-Based Tab Navigation

This document describes the hash-based tab navigation feature implemented in the ProConnect CMS.

## Overview

The hash-based tab navigation allows users to:

- Navigate between tabs using browser back/forward buttons
- Share direct links to specific tabs
- Maintain tab state on page refresh
- Have bookmarkable tab URLs

## Implementation

### Composable: `useHashTabs`

A reusable composable located at `composables/useHashTabs.js` that provides hash-based tab navigation functionality.

#### Usage

```javascript
import { useHashTabs } from "~/composables/useHashTabs";

// Initialize with default tab and valid tab values
const {
  activeTab,
  initializeFromHash,
  setupHashListener,
  cleanupHashListener,
} = useHashTabs(
  "defaultTab", // Default tab value
  ["tab1", "tab2", "tab3"] // Array of valid tab values
);

// In onMounted
onMounted(() => {
  initializeFromHash(); // Set initial tab from URL hash
  setupHashListener(); // Listen for hash changes
});

// In onBeforeUnmount
onBeforeUnmount(() => {
  cleanupHashListener(); // Clean up event listeners
});
```

#### Parameters

- `defaultTab` (string): The default tab value if no hash is present in the URL
- `validTabs` (array): Array of valid tab values that can be set via hash

#### Returns

- `activeTab` (ref): Reactive reference to the current active tab
- `initializeFromHash()`: Function to initialize tab from URL hash
- `setupHashListener()`: Function to set up hash change event listener
- `cleanupHashListener()`: Function to clean up event listeners

## Example Implementation

The users management page (`pages/admin/settings/masters/users/index.vue`) demonstrates the implementation:

```javascript
// Tab management with hash navigation
const {
  activeTab,
  initializeFromHash,
  setupHashListener,
  cleanupHashListener,
} = useHashTabs("candidates", ["candidates", "companies", "batches"]);

// In onMounted
onMounted(async () => {
  // ... other initialization code

  // Initialize hash-based tab navigation
  initializeFromHash();
  setupHashListener();
});

// In onBeforeUnmount
onBeforeUnmount(() => {
  // Clean up hash listener
  cleanupHashListener();
});
```

## URL Structure

With hash navigation enabled, URLs will look like:

- `/admin/settings/masters/users#candidates`
- `/admin/settings/masters/users#companies`
- `/admin/settings/masters/users#batches`

## Features

1. **Browser Navigation**: Back/forward buttons work with tabs
2. **Direct Access**: Users can navigate directly to a specific tab via URL
3. **State Persistence**: Tab selection persists on page refresh
4. **Shareable Links**: Users can share links to specific tabs
5. **Validation**: Only valid tab values are accepted from URL hash

## Browser Compatibility

This feature uses the standard `window.location.hash` and `hashchange` event, which are supported in all modern browsers.

## Notes

- The composable automatically handles client-side only execution
- Hash changes are validated against the provided valid tabs array
- Event listeners are properly cleaned up to prevent memory leaks
- The implementation is framework-agnostic and can be used with any Vue 3 setup

# Hash-Based Tab Navigation

This document describes the hash-based tab navigation feature implemented in the ProConnect CMS.

## Overview

The hash-based tab navigation allows users to:

- Navigate between tabs using browser back/forward buttons
- Share direct links to specific tabs
- Maintain tab state on page refresh
- Have bookmarkable tab URLs

## Implementation

### Composable: `useHashTabs`

A reusable composable located at `composables/useHashTabs.js` that provides hash-based tab navigation functionality.

#### Usage

```javascript
import { useHashTabs } from "~/composables/useHashTabs";

// Initialize with default tab and valid tab values
const {
  activeTab,
  initializeFromHash,
  setupHashListener,
  cleanupHashListener,
} = useHashTabs(
  "defaultTab", // Default tab value
  ["tab1", "tab2", "tab3"] // Array of valid tab values
);

// In onMounted
onMounted(() => {
  initializeFromHash(); // Set initial tab from URL hash
  setupHashListener(); // Listen for hash changes
});

// In onBeforeUnmount
onBeforeUnmount(() => {
  cleanupHashListener(); // Clean up event listeners
});
```

#### Parameters

- `defaultTab` (string): The default tab value if no hash is present in the URL
- `validTabs` (array): Array of valid tab values that can be set via hash

#### Returns

- `activeTab` (ref): Reactive reference to the current active tab
- `initializeFromHash()`: Function to initialize tab from URL hash
- `setupHashListener()`: Function to set up hash change event listener
- `cleanupHashListener()`: Function to clean up event listeners

## Example Implementation

The users management page (`pages/admin/settings/masters/users/index.vue`) demonstrates the implementation:

```javascript
// Tab management with hash navigation
const {
  activeTab,
  initializeFromHash,
  setupHashListener,
  cleanupHashListener,
} = useHashTabs("candidates", ["candidates", "companies", "batches"]);

// In onMounted
onMounted(async () => {
  // ... other initialization code

  // Initialize hash-based tab navigation
  initializeFromHash();
  setupHashListener();
});

// In onBeforeUnmount
onBeforeUnmount(() => {
  // Clean up hash listener
  cleanupHashListener();
});
```

## URL Structure

With hash navigation enabled, URLs will look like:

- `/admin/settings/masters/users#candidates`
- `/admin/settings/masters/users#companies`
- `/admin/settings/masters/users#batches`

## Features

1. **Browser Navigation**: Back/forward buttons work with tabs
2. **Direct Access**: Users can navigate directly to a specific tab via URL
3. **State Persistence**: Tab selection persists on page refresh
4. **Shareable Links**: Users can share links to specific tabs
5. **Validation**: Only valid tab values are accepted from URL hash

## Browser Compatibility

This feature uses the standard `window.location.hash` and `hashchange` event, which are supported in all modern browsers.

## Notes

- The composable automatically handles client-side only execution
- Hash changes are validated against the provided valid tabs array
- Event listeners are properly cleaned up to prevent memory leaks
- The implementation is framework-agnostic and can be used with any Vue 3 setup
