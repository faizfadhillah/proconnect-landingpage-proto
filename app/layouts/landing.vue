<template>
  <v-app>
    <!-- Navigation Bar -->
    <v-app-bar
      app
      :elevation="scrollElevation"
      density="comfortable"
      style="position: sticky; top: 0"
    >
      <v-row class="align-center px-3 mr-4" style="min-width: 220px">
        <v-img 
          src="/logo.svg" 
          height="24"
          style="cursor: pointer"
          @click="scrollToTop"
        ></v-img>
      </v-row>

      <template v-if="isDesktop">
        <v-btn text @click="scrollToTop">Home</v-btn>
        <v-btn text @click="scrollToMission">Our Mission</v-btn>
        <v-btn text @click="scrollToFAQ">FAQ</v-btn>
        <v-spacer style="width: 90%"></v-spacer>
        <template v-if="!authStore.isAuthenticated()">
          <v-btn to="/login" variant="outlined" rounded="lg" class="mr-4">
            <v-icon start>mdi-account-circle-outline</v-icon>
            Login
          </v-btn>
        </template>
        <template v-else>
          <v-btn
            to="/admin/dashboard"
            variant="outlined"
            rounded="lg"
            class="mr-4"
          >
            Open ProConnect
          </v-btn>
        </template>
      </template>
      <template v-else>
        <v-spacer style="width: 90%"></v-spacer>
        <v-btn icon @click="drawer = !drawer" class="mr-2">
          <v-icon>mdi-menu</v-icon>
        </v-btn>
      </template>
    </v-app-bar>

    <!-- Navigation Drawer -->
    <v-navigation-drawer
      v-if="!isDesktop"
      v-model="drawer"
      app
      location="right"
      style="
        position: fixed;
        top: calc(var(--v-app-bar-height) + 10px);
        right: 0;
        width: 250px;
      "
    >
      <v-list>
        <v-list-item
          @click="
            scrollToTop();
            drawer = false;
          "
        >
          <v-list-item-title>Home</v-list-item-title>
        </v-list-item>
        <v-list-item
          @click="
            scrollToMission();
            drawer = false;
          "
        >
          <v-list-item-title>Our Mission</v-list-item-title>
        </v-list-item>
        <v-list-item
          @click="
            scrollToFAQ();
            drawer = false;
          "
        >
          <v-list-item-title>FAQ</v-list-item-title>
        </v-list-item>
        <v-list-item>
          <template v-if="!authStore.isAuthenticated()">
            <v-btn to="/login" variant="outlined" rounded="lg" class="mr-4">
              <v-icon start>mdi-account-circle-outline</v-icon>
              Login
            </v-btn>
          </template>
          <template v-else>
            <v-btn
              to="/admin/dashboard"
              variant="outlined"
              rounded="lg"
              class="mr-4"
            >
              Open ProConnect
            </v-btn>
          </template>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <slot />
    </v-main>

    <!-- Footer -->
    <v-footer color="primary" dark padless>
      <v-container class="py-12">
        <v-row>
          <v-col cols="12" md="5">
            <v-img
              class="mt-2 mb-6"
              src="/logo-footer-white.svg"
              style="max-width: 350px"
            ></v-img>

            <v-card
              class="mr-4"
              style="border-radius: 16px; background-color: #000"
              target="_blank"
              width="160"
              href="https://play.google.com/store/apps/details?id=com.proconnectjob&pcampaignid=web_share"
            >
              <v-img
                src="/images/playstore.png"
                height="48"
                width="160"
                contain
              ></v-img>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <h1 class="font-weight-medium">Contact</h1>
            <div style="line-height: 2.5; font-size: 12px">
              <a
                href="mailto:cs@proconnectcareer.com"
                class="text-white text-decoration-none"
                >cs@proconnectcareer.com</a
              ><br />
              <a
                href="https://proconnectcareer.com"
                class="text-white text-decoration-none"
                >www.proconnectcareer.com</a
              >
            </div>
          </v-col>
          <v-col cols="12" md="3">
            <h1 style="font-weight: 500">Location</h1>
            <div style="line-height: 2.5; font-size: 12px">
              Plaza Mutiara Building, 8th Floor<br />

              <p>
                JI. DR. Ide Anak Agung Gde Agung <br />
                Kav. E.1.2 No. 1-2 South Jakarta, <br />DKI Jakarta 12950,
                Indonesia
              </p>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-footer>
  </v-app>
</template>

<script setup>
const { isMobile, isDesktop } = useScreenSize();
const scrollElevation = ref(0);
const drawer = ref(false);
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

watch([() => isMobile, () => isDesktop], () => {
  drawer.value = false;
});

// Watch for route changes to handle hash navigation
watch(() => route.hash, (newHash) => {
  if (route.path === '/' && newHash) {
    nextTick(() => {
      const hash = newHash.replace('#', '');
      const element = document.getElementById(hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    });
  }
});

// Watch for route path changes to handle navigation to landing page with hash
watch(() => route.path, (newPath) => {
  if (newPath === '/' && route.hash) {
    nextTick(() => {
      const hash = route.hash.replace('#', '');
      const element = document.getElementById(hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 300);
      }
    });
  }
});

const handleScroll = () => {
  scrollElevation.value = window.scrollY > 0 ? 1 : 0;
};

const scrollToMission = () => {
  // If we're on the landing page, scroll to section
  if (route.path === '/') {
    const missionSection = document.getElementById("mission-section");
    if (missionSection) {
      missionSection.scrollIntoView({ behavior: "smooth" });
    }
  } else {
    // If we're on another page, navigate to landing page with hash
    router.push('/#mission-section');
  }
};

const scrollToFAQ = () => {
  // If we're on the landing page, scroll to section
  if (route.path === '/') {
    const faqSection = document.getElementById("faq-section");
    if (faqSection) {
      faqSection.scrollIntoView({ behavior: "smooth" });
    }
  } else {
    // If we're on another page, navigate to landing page with hash
    router.push('/#faq-section');
  }
};

const scrollToTop = () => {
  // If we're on the landing page, scroll to top
  if (route.path === '/') {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  } else {
    // If we're on another page, navigate to landing page
    router.push('/');
  }
};

onMounted(() => {
  window.addEventListener("scroll", handleScroll);
  authStore.loadToken();
  
  // Handle hash navigation when landing page loads
  if (route.path === '/' && route.hash) {
    nextTick(() => {
      const hash = route.hash.replace('#', '');
      const element = document.getElementById(hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    });
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>
