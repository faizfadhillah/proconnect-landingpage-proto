<template>
  <div class="job-detail-page">
    <!-- Hero Section with Gradient Background -->
    <div v-if="job" class="hero-section">
      <v-container class="py-12">
        <v-row>
          <v-col cols="12" class="text-center">
            <v-fade-transition>
              <div class="hero-content">
                <h3 class="mb-2">Job Vacancy for</h3>
                <v-avatar
                  v-if="job.company_logo_url"
                  size="120"
                  class="mb-6 employer-logo"
                  elevation="8"
                  rounded="xl"
                >
                  <v-img
                    :src="getFullImageUrl(job.company_logo_url)"
                    :alt="job.company_name"
                    cover
                  />
                </v-avatar>
                <h1 class="text-h3 text-h4-md font-weight-bold mb-3 hero-title">
                  {{ job.title }}
                </h1>
                <div class="text-h5 text-h6-md mb-2 employer-name">
                  {{ job.company_name }}
                </div>
                <div class="d-flex align-center justify-center flex-wrap gap-3 mb-6">
                  <v-chip
                    size="large"
                    variant="flat"
                    color="white"
                    class="location-chip"
                  >
                    <v-icon start size="small">mdi-map-marker</v-icon>
                    {{ job.location }}
                  </v-chip>
                </div>
              </div>
            </v-fade-transition>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!-- Main Content -->
    <v-container v-if="job" class="py-8">
      <v-row>
        <!-- Main Content Column -->
        <v-col cols="12" lg="8">
          <!-- Job Details Card -->
          <v-card
            class="job-card mb-6"
            elevation="4"
            rounded="xl"
          >
            <v-card-text class="pa-8">
              <div class="d-flex align-center mb-6">
                <v-icon color="primary" size="32" class="mr-3">mdi-file-document-outline</v-icon>
                <h2 class="text-h5 font-weight-bold">Job Description</h2>
              </div>
              <v-divider class="mb-6" />
              <!-- Description Skeleton Loader -->
              <div v-if="!job.description || descriptionLoading" class="description-skeleton">
                <v-skeleton-loader
                  type="paragraph"
                  class="mb-4"
                ></v-skeleton-loader>
                <v-skeleton-loader
                  type="paragraph"
                  class="mb-4"
                ></v-skeleton-loader>
                <v-skeleton-loader
                  type="paragraph"
                  class="mb-4"
                ></v-skeleton-loader>
                <v-skeleton-loader
                  type="text"
                  width="60%"
                ></v-skeleton-loader>
              </div>
              <ClientOnly v-else>
                <rich-text-view v-model="job.description" />
                <template #fallback>
                  <div class="job-description ql-editor" v-html="deltaToHtml(job.description)" />
                </template>
              </ClientOnly>
              <!-- Description Content -->
              
            </v-card-text>
          </v-card>

          <!-- Requirements Section (if needed in future) -->
          <v-card
            class="job-card"
            elevation="4"
            rounded="xl"
          >
            <v-card-text class="pa-8">
              <div class="d-flex align-center mb-6">
                <v-icon color="primary" size="32" class="mr-3">mdi-information-outline</v-icon>
                <h2 class="text-h5 font-weight-bold">Job Information</h2>
              </div>
              <v-divider class="mb-6" />
              <v-row>
                <v-col cols="12" md="6">
                  <div class="info-item mb-4">
                    <div class="info-label">
                      <v-icon size="small" class="mr-2" color="primary">mdi-briefcase-outline</v-icon>
                      Employment Type
                    </div>
                    <div class="info-value mt-2">
                      <v-chip
                        v-for="status in job.employment_status"
                        :key="status"
                        size="default"
                        color="primary"
                        variant="flat"
                        class="mr-2 mb-2"
                      >
                        {{ formatEmploymentStatus(status) }}
                      </v-chip>
                    </div>
                  </div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="info-item mb-4">
                    <div class="info-label">
                      <v-icon size="small" class="mr-2" color="primary">mdi-home-outline</v-icon>
                      Work Arrangement
                    </div>
                    <div class="info-value mt-2">
                      <v-chip
                        v-for="domicile in job.domicile_status"
                        :key="domicile"
                        size="default"
                        color="secondary"
                        variant="flat"
                        class="mr-2 mb-2"
                      >
                        {{ formatDomicileStatus(domicile) }}
                      </v-chip>
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Sidebar Column -->
        <v-col cols="12" lg="4">
          <!-- Quick Apply Card -->
          <v-card
            class="sidebar-card mb-6 sticky-sidebar"
            elevation="4"
            rounded="xl"
          >
            <v-card-text class="pa-6">
              <h3 class="text-h6 font-weight-bold mb-4">Quick Info</h3>
              <v-divider class="mb-4" />
              
              <div class="quick-info-item mb-4">
                <div class="d-flex align-center mb-2">
                  <v-icon color="primary" size="20" class="mr-2">mdi-office-building-outline</v-icon>
                  <span class="text-body-2 text-medium-emphasis">Company</span>
                </div>
                <div class="text-body-1 font-weight-medium">{{ job.company_name }}</div>
              </div>

              <div class="quick-info-item mb-4">
                <div class="d-flex align-center mb-2">
                  <v-icon color="primary" size="20" class="mr-2">mdi-map-marker-outline</v-icon>
                  <span class="text-body-2 text-medium-emphasis">Location</span>
                </div>
                <div class="text-body-1 font-weight-medium">{{ job.location }}</div>
              </div>

              <v-divider class="my-4" />

              <!-- Share Section -->
              <div class="share-section">
                <div class="text-body-2 text-medium-emphasis mb-3">Share this job</div>
                <div class="d-flex gap-2">
                  <v-btn
                    icon
                    variant="flat"
                    color="success"
                    size="small"
                    @click="shareOnWhatsApp"
                  >
                    <v-icon>mdi-whatsapp</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    variant="flat"
                    color="primary"
                    size="small"
                    @click="shareOnLinkedIn"
                  >
                    <v-icon>mdi-linkedin</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    variant="flat"
                    color="info"
                    size="small"
                    @click="shareOnTwitter"
                  >
                    <v-icon>mdi-twitter</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    variant="flat"
                    color="primary"
                    size="small"
                    @click="shareOnFacebook"
                  >
                    <v-icon>mdi-facebook</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    variant="flat"
                    color="grey-darken-1"
                    size="small"
                    @click="shareOnEmail"
                  >
                    <v-icon>mdi-email</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    variant="flat"
                    color="grey-darken-1"
                    size="small"
                    @click="copyLink"
                  >
                    <v-icon>mdi-content-copy</v-icon>
                  </v-btn>
                </div>
                <v-snackbar
                  v-model="snackbar.show"
                  :color="snackbar.color"
                  :timeout="2000"
                >
                  {{ snackbar.message }}
                </v-snackbar>
              </div>
            </v-card-text>
          </v-card>

          
        </v-col>
      </v-row>
    </v-container>

    <!-- Enhanced Loading State -->
    <v-container v-else-if="loading" class="py-12">
      <v-row>
        <v-col cols="12" class="text-center">
          <v-fade-transition>
            <div>
              <v-progress-circular
                indeterminate
                color="primary"
                size="80"
                width="6"
                class="mb-6"
              />
              <div class="text-h5 font-weight-medium mb-2">Loading job details...</div>
              <div class="text-body-2 text-medium-emphasis">Please wait while we fetch the information</div>
            </div>
          </v-fade-transition>
        </v-col>
      </v-row>
    </v-container>

    <!-- Enhanced Error State -->
    <v-container v-else-if="error" class="py-12">
      <v-row>
        <v-col cols="12" md="8" class="mx-auto">
          <v-fade-transition>
            <v-card elevation="4" rounded="xl">
              <v-card-text class="pa-8 text-center">
                <v-icon
                  color="error"
                  size="80"
                  class="mb-4"
                >
                  mdi-alert-circle-outline
                </v-icon>
                <h2 class="text-h5 font-weight-bold mb-2">Job Not Found</h2>
                <p class="text-body-1 text-medium-emphasis mb-6">{{ error }}</p>
                <v-btn
                  color="primary"
                  variant="flat"
                  size="large"
                  prepend-icon="mdi-home"
                  @click="goHome"
                >
                  Back to Home
                </v-btn>
              </v-card-text>
            </v-card>
          </v-fade-transition>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
// Enable SSR for this page
definePageMeta({
  ssr: true,
  layout: "landing",
});

const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();
const apiBase = config.public.apiBase;
const jobId = route.params.id;

// State
const job = ref(null);
const loading = ref(true);
const error = ref(null);
const descriptionLoading = ref(true);
const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
});

// Fetch job data
const fetchJob = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    const response = await $fetch(`${apiBase}/jobs/public/${jobId}`, {
      method: 'GET',
    });
    
    if (!response) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Job Not Found',
        message: 'The job you are looking for could not be found.',
      });
    }
    
    job.value = response;
    
    // Set description loading to false after a short delay to ensure smooth rendering
    if (process.client) {
      descriptionLoading.value = true;
      await nextTick();
      // Wait for description to be processed and rendered
      setTimeout(() => {
        if (job.value?.description) {
          descriptionLoading.value = false;
        }
      }, 1100);
    } else {
      // On server side, set to false immediately
      //descriptionLoading.value = false;
    }
  } catch (err) {
    console.error('Error fetching job:', err);
    const statusCode = err?.response?.status || err?.statusCode || err?.statusCode || 500;
    const errorMessage = err?.response?._data?.message || err?.message || 'Job not found or not published';
    
    // If job not found (404), throw createError to trigger not-found page
    if (statusCode === 404 || (statusCode === 500 && errorMessage.toLowerCase().includes('not found'))) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Job Not Found',
        message: 'The job you are looking for could not be found. It may have been removed or the URL is incorrect.',
      });
    }
    
    // For other errors, show error state
    error.value = errorMessage;
    job.value = null;
  } finally {
    loading.value = false;
  }
};

// Share functions
const getCurrentUrl = () => {
  if (process.client) {
    return window.location.href;
  }
  return getFullUrl();
};

const getShareText = () => {
  const locationText = job.value?.location || 'Unknown Location';
  return `Job vacancy for *${job.value?.title || 'this position'}* in *${job.value?.company_name || 'this company'}* located in *${locationText}* has been open. \n \nClick this link to view job vacancy.`;
};

const shareOnWhatsApp = () => {
  const url = getCurrentUrl();
  const text = getShareText();
  const encodedText = encodeURIComponent(`${text} ${url}`);
  window.open(`https://wa.me/?text=${encodedText}`, '_blank');
};

const shareOnLinkedIn = () => {
  const url = encodeURIComponent(getCurrentUrl());
  const summary = encodeURIComponent(getShareText());
  window.open(
    `https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${summary}`,
    '_blank'
  );
};

const shareOnTwitter = () => {
  const url = encodeURIComponent(getCurrentUrl());
  const text = encodeURIComponent(getShareText());
  window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
};

const shareOnFacebook = () => {
  const url = encodeURIComponent(getCurrentUrl());
  const quote = encodeURIComponent(getShareText());
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`, '_blank');
};

const shareOnEmail = () => {
  const url = getCurrentUrl();
  const subject = encodeURIComponent(
    `Job Vacancy: ${job.value?.title || 'Position Available'}${job.value?.company_name ? ` at ${job.value?.company_name}` : ''}`
  );
  const body = encodeURIComponent(`${getShareText()}\n\n${url}`);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
};

const copyLink = async () => {
  try {
    const url = getCurrentUrl();
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      snackbar.value = {
        show: true,
        message: 'Link copied to clipboard!',
        color: 'success',
      };
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      snackbar.value = {
        show: true,
        message: 'Link copied to clipboard!',
        color: 'success',
      };
    }
  } catch (err) {
    snackbar.value = {
      show: true,
      message: 'Failed to copy link',
      color: 'error',
    };
  }
};

const goHome = () => {
  router.push('/');
};

// Helper functions (defined before computed properties)
const BASE_URL = `${apiBase}/`;

const getFullUrl = (path = '') => {
  if (process.server) {
    // On server, try to get from request headers
    try {
      const headers = useRequestHeaders();
      const protocol = headers['x-forwarded-proto'] || 
                       (headers['x-forwarded-ssl'] === 'on' ? 'https' : 'http');
      const host = headers['x-forwarded-host'] || 
                   headers.host || 
                   'localhost:3011';
      return `${protocol}://${host}${path || route.fullPath}`;
    } catch (e) {
      // Fallback if headers not available
      const protocol = process.env.NUXT_PUBLIC_PROTOCOL || 'http';
      const host = process.env.NUXT_PUBLIC_SITE_URL || 'localhost:3011';
      return `${protocol}://${host}${path || route.fullPath}`;
    }
  }
  return `${window.location.origin}${path || route.fullPath}`;
};

const getBaseUrl = () => {
  if (process.server) {
    // On server, try to get from request headers
    try {
      const headers = useRequestHeaders();
      const protocol = headers['x-forwarded-proto'] || 
                       (headers['x-forwarded-ssl'] === 'on' ? 'https' : 'http');
      const host = headers['x-forwarded-host'] || 
                   headers.host || 
                   'localhost:3011';
      return `${protocol}://${host}`;
    } catch (e) {
      // Fallback if headers not available
      const protocol = process.env.NUXT_PUBLIC_PROTOCOL || 'http';
      const host = process.env.NUXT_PUBLIC_SITE_URL || 'localhost:3011';
      return `${protocol}://${host}`;
    }
  }
  return window.location.origin;
};

const getFullImageUrl = (url) => {
  if (!url) return getFullUrl('/logo-double.svg');
  if (url.includes('http://') || url.includes('https://')) {
    return url;
  }
  // For meta tags, we need absolute URL
  if (url.startsWith('/')) {
    // Public assets served by Nuxt (e.g. logo, favicon) should use site base.
    if (url.startsWith('/logo') || url.startsWith('/favicon') || url.startsWith('/_nuxt')) {
      return `${getBaseUrl()}${url}`;
    }
    // Assume API media paths are served by the API base URL.
    // Ensure no double slash
    const cleanApiBase = apiBase.replace(/\/$/, '');
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${cleanApiBase}${cleanUrl}`;
  }
  // If it's a relative media path without leading slash, use API base URL
  const cleanApiBase = apiBase.replace(/\/$/, '');
  return `${cleanApiBase}/${url}`;
};

// Helper function to convert Delta to HTML (works in SSR)
const deltaToHtml = (description) => {
  if (!description) return '';
  
  let delta = null;
  
  // Parse Delta from string or object
  if (typeof description === 'string') {
    const trimmed = description.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(description);
        // Case 1: It's an array of ops directly [{"insert":"text"}]
        if (Array.isArray(parsed)) {
          delta = { ops: parsed };
        }
        // Case 2: It's an object with ops property {"ops":[{"insert":"text"}]}
        else if (parsed && typeof parsed === 'object' && parsed.ops && Array.isArray(parsed.ops)) {
          delta = parsed;
        } else {
          return description; // Not Delta format, return as is
        }
      } catch (e) {
        return description; // Not JSON, return as is
      }
    } else {
      return description; // Plain text, return as is
    }
  } 
  // If it's an array directly (ops array)
  else if (Array.isArray(description)) {
    delta = { ops: description };
  }
  // If it's an object (Delta with ops property)
  else if (typeof description === 'object' && description !== null && description.ops && Array.isArray(description.ops)) {
    delta = description;
  } else {
    return String(description);
  }
  
  if (!delta || !delta.ops || !Array.isArray(delta.ops)) return '';
  
  // Process ops and group by list context
  let html = '';
  let inList = false;
  let listType = '';
  let currentItem = '';
  let currentParagraph = '';
  
  const processText = (text, attrs) => {
    // Escape HTML
    text = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    
    // Apply formatting
    if (attrs.bold) text = `<strong>${text}</strong>`;
    if (attrs.italic) text = `<em>${text}</em>`;
    if (attrs.underline) text = `<u>${text}</u>`;
    if (attrs.strike) text = `<s>${text}</s>`;
    if (attrs.code) text = `<code>${text}</code>`;
    
    return text;
  };
  
  delta.ops.forEach((op, index) => {
    if (!op || !op.insert) return;
    
    const attrs = op.attributes || {};
    const isList = !!attrs.list;
    const isHeader = !!attrs.header;
    const isBlockquote = !!attrs.blockquote;
    
    // Handle list context changes
    if (isList !== inList) {
      if (inList) {
        // Close current list
        if (currentItem) {
          html += `<li>${currentItem}</li>`;
          currentItem = '';
        }
        html += listType === 'ordered' ? '</ol>' : '</ul>';
        inList = false;
        listType = '';
      }
      
      if (isList) {
        // Start new list
        if (currentParagraph) {
          html += `<p>${currentParagraph}</p>`;
          currentParagraph = '';
        }
        inList = true;
        listType = attrs.list;
        html += listType === 'ordered' ? '<ol>' : '<ul>';
      }
    }
    
    // Handle insert
    if (typeof op.insert === 'string') {
      let text = op.insert.replace(/\n/g, ' ').trim();
      const processed = processText(text, attrs);
      
      if (isList) {
        // If this op has list attribute, it's a new list item
        if (currentItem) {
          html += `<li>${currentItem}</li>`;
        }
        currentItem = processed;
      } else {
        currentParagraph += processed;
      }
    } else if (op.insert && typeof op.insert === 'object' && op.insert.image) {
      const imgTag = `<img src="${op.insert.image}" alt="" style="max-width: 100%; height: auto;" />`;
      if (isList) {
        if (currentItem) {
          html += `<li>${currentItem}</li>`;
        }
        html += `<li>${imgTag}</li>`;
        currentItem = '';
      } else {
        if (currentParagraph) {
          html += `<p>${currentParagraph}</p>`;
          currentParagraph = '';
        }
        html += `<p>${imgTag}</p>`;
      }
    }
    
    // Handle block-level elements
    if (isHeader || isBlockquote) {
      if (currentParagraph) {
        if (isHeader) {
          const level = attrs.header;
          html += `<h${level}>${currentParagraph}</h${level}>`;
        } else if (isBlockquote) {
          html += `<blockquote>${currentParagraph}</blockquote>`;
        }
        currentParagraph = '';
      }
    }
    
    // Check if next op changes context
    const nextOp = delta.ops[index + 1];
    if (!nextOp) {
      // Last op - flush everything
      if (inList && currentItem) {
        html += `<li>${currentItem}</li>`;
        html += listType === 'ordered' ? '</ol>' : '</ul>';
      } else if (currentParagraph) {
        const attrs = op.attributes || {};
        if (attrs.header) {
          const level = attrs.header;
          html += `<h${level}>${currentParagraph}</h${level}>`;
        } else if (attrs.blockquote) {
          html += `<blockquote>${currentParagraph}</blockquote>`;
        } else {
          html += `<p>${currentParagraph}</p>`;
        }
      }
    } else {
      const nextIsList = !!nextOp.attributes?.list;
      if (inList && !nextIsList && currentItem) {
        // Current is list item, next is not - close list
        html += `<li>${currentItem}</li>`;
        html += listType === 'ordered' ? '</ol>' : '</ul>';
        currentItem = '';
        inList = false;
        listType = '';
      }
    }
  });
  
  // Final flush
  if (inList && currentItem) {
    html += `<li>${currentItem}</li>`;
    html += listType === 'ordered' ? '</ol>' : '</ul>';
  } else if (currentParagraph) {
    html += `<p>${currentParagraph}</p>`;
  }
  
  return html || '';
};

// Helper function to extract plain text from Quill Delta JSON
// This ensures meta description only contains plain text, no JSON
const extractTextFromQuill = (description) => {
  if (!description) return '';
  
  // Helper function to extract text from ops array
  const extractFromOps = (ops) => {
    if (!Array.isArray(ops) || ops.length === 0) return '';
    let text = '';
    ops.forEach((op) => {
      if (op && op.insert) {
        if (typeof op.insert === 'string') {
          text += op.insert;
        } else if (op.insert && typeof op.insert === 'object') {
          // Handle embedded content (images, etc.) - skip
          if (op.insert.image) {
            // Skip images in text extraction
          }
        }
      }
    });
    return text.replace(/\n/g, ' ').replace(/\r/g, ' ').replace(/\s+/g, ' ').trim();
  };
  
  // If it's already a plain string (not JSON), return it
  if (typeof description === 'string') {
    // Check if it's a JSON string (Quill Delta format)
    const trimmed = description.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(description);
        
        // Case 1: It's an array of ops directly [{"insert":"text"}]
        if (Array.isArray(parsed)) {
          return extractFromOps(parsed);
        }
        
        // Case 2: It's an object with ops property {"ops":[{"insert":"text"}]}
        if (parsed && typeof parsed === 'object' && parsed.ops && Array.isArray(parsed.ops)) {
          return extractFromOps(parsed.ops);
        }
        
        // If it's JSON but not Delta format, return empty string to avoid showing JSON
        return '';
      } catch (e) {
        // If parsing fails, it's not valid JSON, treat as plain text
        // Strip HTML tags and clean up
        return description.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
      }
    } else {
      // It's a plain string, strip HTML if any
      return description.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
    }
  }
  
  // If it's an array directly (ops array)
  if (Array.isArray(description)) {
    return extractFromOps(description);
  }
  
  // If it's an object (Delta with ops property)
  if (typeof description === 'object' && description !== null && description.ops && Array.isArray(description.ops)) {
    return extractFromOps(description.ops);
  }
  
  // For any other type, convert to string and clean up
  const text = String(description);
  // If it looks like JSON, return empty to avoid showing JSON in meta
  if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
    return '';
  }
  return text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
};

const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
};

const truncateText = (text, maxLength = 160) => {
  if (!text) return '';
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.substring(0, maxLength - 3) + '...';
};

// Fetch on server and client
await fetchJob();

// Get meta values - use direct values for SSR
const metaTitle = job.value 
  ? `${job.value.title} - ${job.value.company_name}` 
  : 'Job Details - ProConnect';

const metaDescription = job.value
  ? (() => {
      const extractedText = extractTextFromQuill(job.value.description);
      return extractedText && extractedText.trim().length > 0
        ? truncateText(extractedText, 160)
        : `Job vacancy for ${job.value.title} at ${job.value.company_name} located in ${job.value.location || 'Unknown Location'}. Apply now on ProConnect.`;
    })()
  : 'View job details on ProConnect';

const metaImage = job.value?.company_logo_url
  ? getFullImageUrl(job.value.company_logo_url)
  : getFullImageUrl('/logo-double.svg');

const metaUrl = getFullUrl();

// Create computed values for reactivity
const pageTitle = computed(() => 
  job.value ? `${job.value.title} - ${job.value.company_name}` : 'Job Details - ProConnect'
);

const pageDescription = computed(() => 
  job.value
    ? (() => {
        const extractedText = extractTextFromQuill(job.value.description);
        return extractedText && extractedText.trim().length > 0
          ? truncateText(extractedText, 160)
          : `Job vacancy for ${job.value.title} at ${job.value.company_name} located in ${job.value.location || 'Unknown Location'}. Apply now on ProConnect.`;
      })()
    : 'View job details on ProConnect'
);

const pageImage = computed(() => 
  job.value?.company_logo_url
    ? getFullImageUrl(job.value.company_logo_url)
    : getFullImageUrl('/logo-double.svg')
);

const pageUrl = computed(() => getFullUrl());

// Meta tags for SEO and social sharing - use direct values for SSR
useHead({
  title: metaTitle,
  meta: [
    {
      name: 'description',
      content: metaDescription,
    },
    // Open Graph
    {
      property: 'og:title',
      content: metaTitle,
    },
    {
      property: 'og:description',
      content: metaDescription,
    },
    {
      property: 'og:image',
      content: metaImage,
    },
    {
      property: 'og:url',
      content: metaUrl,
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:site_name',
      content: 'ProConnect',
    },
    {
      property: 'og:image:type',
      content: 'image/png',
    },
    {
      property: 'og:image:width',
      content: '1200',
    },
    {
      property: 'og:image:height',
      content: '630',
    },
    // Twitter Card
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    {
      name: 'twitter:title',
      content: metaTitle,
    },
    {
      name: 'twitter:description',
      content: metaDescription,
    },
    {
      name: 'twitter:image',
      content: metaImage,
    },
  ],
});

// Also use useSeoMeta with computed values for reactivity
useSeoMeta({
  description: pageDescription,
  ogTitle: pageTitle,
  ogDescription: pageDescription,
  ogImage: pageImage,
  ogUrl: pageUrl,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: pageTitle,
  twitterDescription: pageDescription,
  twitterImage: pageImage,
});

// Helper function for image display (used in template)
const getImageUrl = (url) => {
  if (!url) return '/logo-double.svg';
  if (url.includes('http://') || url.includes('https://')) {
    return url;
  }
  // If it's a relative path, prepend API base URL
  return BASE_URL + url;
};


const formatEmploymentStatus = (status) => {
  const statusMap = {
    'full-time': 'Full Time',
    'part-time': 'Part Time',
    'contract': 'Contract',
    'freelance': 'Freelance',
    'internship': 'Internship',
  };
  return statusMap[status] || status;
};

const formatDomicileStatus = (domicile) => {
  const domicileMap = {
    'on-site': 'On-Site',
    'remote': 'Remote',
    'hybrid': 'Hybrid',
  };
  return domicileMap[domicile] || domicile;
};
</script>

<style scoped>
.job-detail-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f5f7fa 0%, #ffffff 100%);
}

/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, #1560BD 0%, #0d4a8f 100%);
  color: white;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.1;
}

.hero-content {
  position: relative;
  z-index: 1;
}

.employer-logo {
  border: 4px solid rgba(255, 255, 255, 0.3);
  background: white;
  animation: fadeInUp 0.6s ease-out;
}

.hero-title {
  color: white;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

.employer-name {
  color: rgba(255, 255, 255, 0.9);
  animation: fadeInUp 0.8s ease-out 0.4s both;
}

.location-chip {
  animation: fadeInUp 0.8s ease-out 0.6s both;
}

/* Cards */
.job-card,
.sidebar-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeInUp 0.6s ease-out;
}

.job-card:hover,
.sidebar-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15) !important;
}

/* Sticky Sidebar */
.sticky-sidebar {
  position: sticky;
  top: 24px;
}



/* Job Description - Rich Text Viewer */
.job-details :deep(.rich-text-viewer) {
  line-height: 1.9;
  color: rgba(0, 0, 0, 0.87);
  font-size: 1.05rem;
}

.job-details :deep(.ql-editor) {
  padding: 0;
  border: none;
  background: transparent;
  font-family: inherit;
}

.job-details :deep(.ql-editor p) {
  margin-bottom: 1.2em;
  line-height: 1.8;
}

.job-details :deep(.ql-editor p:last-child) {
  margin-bottom: 0;
}

.job-details :deep(.ql-editor ul),
.job-details :deep(.ql-editor ol) {
  margin-left: 1.5em;
  margin-bottom: 1.2em;
  padding-left: 0;
}

.job-details :deep(.ql-editor li) {
  margin-bottom: 0.6em;
  line-height: 1.8;
}

.job-details :deep(.ql-editor h1),
.job-details :deep(.ql-editor h2),
.job-details :deep(.ql-editor h3),
.job-details :deep(.ql-editor h4),
.job-details :deep(.ql-editor h5),
.job-details :deep(.ql-editor h6) {
  margin-top: 1.5em;
  margin-bottom: 0.8em;
  font-weight: 600;
  line-height: 1.4;
}

.job-details :deep(.ql-editor h1:first-child),
.job-details :deep(.ql-editor h2:first-child),
.job-details :deep(.ql-editor h3:first-child) {
  margin-top: 0;
}

.job-details :deep(.ql-editor strong),
.job-details :deep(.ql-editor b) {
  font-weight: 600;
  color: rgba(0, 0, 0, 0.95);
}

.job-details :deep(.ql-editor em),
.job-details :deep(.ql-editor i) {
  font-style: italic;
}

.job-details :deep(.ql-editor u) {
  text-decoration: underline;
}

.job-details :deep(.ql-editor s),
.job-details :deep(.ql-editor strike) {
  text-decoration: line-through;
}

.job-details :deep(.ql-editor blockquote) {
  border-left: 4px solid rgb(var(--v-theme-primary));
  padding-left: 1em;
  margin: 1.5em 0;
  font-style: italic;
  color: rgba(0, 0, 0, 0.7);
}

.job-details :deep(.ql-editor code) {
  background: rgba(0, 0, 0, 0.05);
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.job-details :deep(.ql-editor pre) {
  background: rgba(0, 0, 0, 0.05);
  padding: 1em;
  border-radius: 8px;
  overflow-x: auto;
  margin: 1.5em 0;
}

.job-details :deep(.ql-editor pre code) {
  background: transparent;
  padding: 0;
}

.job-details :deep(.ql-editor a) {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s;
}

.job-details :deep(.ql-editor a:hover) {
  border-bottom-color: rgb(var(--v-theme-primary));
}

.job-details :deep(.ql-editor img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 1.5em 0;
}

/* Info Items */
.info-item {
  padding: 16px;
  background: rgba(var(--v-theme-primary), 0.05);
  border-radius: 12px;
  border-left: 4px solid rgb(var(--v-theme-primary));
}

.info-label {
  font-weight: 600;
  color: rgba(0, 0, 0, 0.7);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  color: rgba(0, 0, 0, 0.87);
}

/* Quick Info */
.quick-info-item {
  padding: 12px 0;
}

.share-section {
  padding-top: 16px;
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 960px) {
  .sticky-sidebar {
    position: relative;
    top: 0;
  }
  
  .hero-title {
    font-size: 1.75rem !important;
  }
  
  .employer-name {
    font-size: 1.25rem !important;
  }
}

/* Gap utility */
.gap-2 {
  gap: 8px;
}

.gap-3 {
  gap: 12px;
}

/* Enhanced transitions */
.v-fade-transition-enter-active,
.v-fade-transition-leave-active {
  transition: opacity 0.4s ease;
}

.v-fade-transition-enter-from,
.v-fade-transition-leave-to {
  opacity: 0;
}
</style>