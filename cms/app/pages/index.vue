<template>
      <!-- Hero Section -->
      <v-container>
        <v-row align="center" justify="center" class=" mb-12">
          <v-col cols="12" md="6" class="text-left order-2 order-md-1">
            <h1 class="font-weight-bold mb-4">
              Empowering Hospitality Careers Across ASEAN
            </h1>
            <p class="mb-8">
              At ProConnect, we're transforming how talent and employers connect
              in the hospitality and tourism industry.
            </p>
            <div class="d-flex">
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
              <v-btn
                to="/signup"
                color="primary"
                class="mr-4"
                style="border-radius: 16px; font-size: 12px"
                height="48"
                ><v-icon start size="24">mdi-earth</v-icon>Open On Web</v-btn
              >
            </div>
          </v-col>
          <v-col cols="12" md="6" class="px-6 order-1 order-md-2">
            <v-img src="/images/hero.png"></v-img>
          </v-col>
        </v-row>
        <v-row class="mt-12 pt-12" style="font-size: 13px">
          <v-col cols="12" md="6">
            <v-card
              elevation="0"
              class="pa-4 py-8 bg-primary"
              style="
                background: linear-gradient(
                  to bottom,
                  rgba(255, 255, 255, 0.1),
                  rgba(0, 0, 0, 0.05)
                );
                border-radius: 16px;
              "
            >
              <v-img
                src="/images/flags.png"
                contain
                height="120"
                class="mb-4"
              ></v-img>
              <div class="text-center">
                Built for Southeast Asia's fast-growing service economy, our
                platform helps job seekers showcase their verified skills and
                enables employers to hire with confidence.
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-card
              elevation="0"
              class="pa-4 py-8 bg-primary"
              style="
                background: linear-gradient(
                  to bottom,
                  rgba(255, 255, 255, 0.1),
                  rgba(0, 0, 0, 0.05)
                );
                border-radius: 16px;
              "
            >
              <v-img
                src="/images/hero-2.png"
                contain
                height="120"
                class="mb-4"
              ></v-img>
              <div class="text-center">
                Whether you're a fresh graduate looking for your first hotel
                role, or a resort seeking certified, skilled staff, ProConnect
                streamlines the process — bringing transparency, efficiency, and
                trust to hospitality hiring.
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>

      <!-- Mission Section -->

      <v-container
        class="mt-12 py-12 bg-grey-lighten-5"
        fluid
        id="mission-section"
      >
        <v-container class="pr-12">
          <v-row>
            <v-col cols="12" md="5">
              <v-img src="/logo-double.svg" height="130" contain></v-img>
            </v-col>
            <v-col cols="12" md="7" class="d-flex align-center">
              <div>
                <h2 class="mb-4">Our Mission</h2>
                <p>
                  To improve workforce mobility and hiring quality in the
                  hospitality sector by providing verified, skill-based job
                  matching tools that benefit both candidates and employers.
                </p>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </v-container>

      <!-- About Section -->
      <v-container class="my-12">
        <v-row>
          <v-col cols="12" md="5" class="d-flex align-center">
            <div>
              <h2 class="mb-4">Why We Exist</h2>
              <p class="mb-8" style="max-width: 350px">
                Across ASEAN, the hospitality sector is growing yet hiring
                remains fragmented, informal, and unstandardised. ProConnect was
                created to address this challenge through:
              </p>
            </div>
          </v-col>
          <v-col cols="12" md="7">
            <v-row>
              <v-col cols="12" sm="12" md="6">
                <v-card
                  elevation="0"
                  class="pa-4 bg-blue-lighten-5"
                  rounded="xl"
                  style="min-height: 220px"
                >
                  <v-img
                    src="/images/ic-skill-passport.png"
                    height="150"
                    width="150"
                    style="
                      margin-left: -26px;
                      margin-top: -40px;
                      margin-bottom: -24px;
                    "
                  ></v-img>
                  <div class="font-weight-bold mb-2">
                    Verified Skill Passports to reduce credential fraud
                  </div>
                </v-card>
              </v-col>
              <v-col cols="12" sm="12" md="6">
                <v-card
                  elevation="0"
                  class="pa-4 bg-blue-lighten-5"
                  rounded="xl"
                  style="min-height: 220px"
                >
                  <v-img
                    src="/images/ic-customized.png"
                    height="70"
                    width="70"
                    class="mb-4"
                    style="margin-left: 16px"
                  ></v-img>
                  <div class="font-weight-bold mb-2">
                    Customized Application Workflows to simplify hiring
                  </div>
                </v-card>
              </v-col>
              <v-col cols="12" sm="12" md="6">
                <v-card
                  elevation="0"
                  class="pa-4 bg-blue-lighten-5"
                  rounded="xl"
                  style="min-height: 220px"
                >
                  <v-img
                    src="/images/ic-smart-matching.png"
                    height="70"
                    width="70"
                    class="mb-4"
                    style="margin-left: 16px"
                  ></v-img>
                  <div class="font-weight-bold mb-2">
                    (Soon) Smart Matching Tools to reduce job search fatigue
                  </div>
                </v-card>
              </v-col>
              <v-col cols="12" sm="12" md="6">
                <v-card
                  elevation="0"
                  class="pa-4 bg-blue-lighten-5"
                  rounded="xl"
                  style="min-height: 220px"
                >
                  <div>
                    <v-img
                      src="/images/ic-collaboration.png"
                      height="70"
                      width="70"
                      class="mb-4"
                      style="margin-left: 16px"
                    ></v-img>
                  </div>
                  <div class="font-weight-bold mb-2">
                    Regional Collaboration with universities, training centers,
                    and employers to standardize workforce
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
        <v-row class="mt-10" justify="center">
          <v-col cols="12">
            <h2 class="text-center">Who We Serve</h2>
          </v-col>
          <v-col cols="12" sm="12" md="4">
            <v-card
              elevation="0"
              class="pa-4 bg-blue-lighten-5"
              rounded="xl"
              style="min-height: 220px"
            >
              <v-icon size="70" class="mb-4" color="primary"
                >mdi-face-man</v-icon
              >
              <div class="font-weight-bold mb-2">Job Seekers</div>
              <div style="font-size: 13px">
                From chefs to concierge staff, we help hospitality professionals
                highlight skills, verify certifications, and access verified
                opportunities.
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="12" md="4">
            <v-card
              elevation="0"
              class="pa-4 bg-blue-lighten-5"
              rounded="xl"
              style="min-height: 220px"
            >
              <v-icon size="70" class="mb-4" color="primary">mdi-domain</v-icon>
              <div class="font-weight-bold mb-2">Employers</div>
              <div style="font-size: 13px">
                Hotels, resorts, F&B businesses, and travel firms use ProConnect
                to find qualified, verified talent faster and more reliably.
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="12" md="4">
            <v-card
              elevation="0"
              class="pa-4 bg-blue-lighten-5"
              rounded="xl"
              style="min-height: 220px"
            >
              <v-icon size="70" class="mb-4" color="primary">mdi-school</v-icon>
              <div class="font-weight-bold mb-2">
                Education & Training Providers
              </div>
              <div style="font-size: 13px">
                We collaborate with vocational schools and universities to bring
                credential validation into hiring processes.
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
      <v-container
        class="mt-12 py-12 bg-primary"
        fluid
        style="
          background: linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.1),
            rgba(0, 0, 0, 0.5)
          );
        "
      >
        <v-container class="pr-12">
          <v-row>
            <v-col
              cols="12"
              md="7"
              class="d-flex align-center order-2 order-md-1"
            >
              <div class="text-center">
                <h2 class="mb-4">Our Commitment</h2>
                <p class="font-weight-medium">
                  We're committed to building a trusted platform where
                  qualifications matter, candidates are empowered, and employers
                  hire better. With integrity at our core and technology as our
                  enabler, we aim to close skill gaps and raise standards across
                  the region.
                </p>
              </div>
            </v-col>
            <v-col cols="12" md="5" class="order-1 order-md-2">
              <v-img src="/images/commitment.png" height="180" contain></v-img>
            </v-col>
          </v-row>
        </v-container>
      </v-container>

      <!-- Contact Section -->
      <v-container fluid class="bg-blue-lighten-5" id="faq-section">
        <v-container class="my-12">
          <v-row justify="center">
            <v-col cols="12" md="5">
              <h2 class="mb-4 font-weight-medium" style="font-size: 36px">
                Frequently Asked Questions
              </h2>
              <p>
                Find answers to the most frequently asked questions below. If
                you don't find what you're looking for, feel free to reach out
                to us for further assistance.
              </p>
            </v-col>
            <v-col cols="12" md="7">
              <div class="mb-4">
                <v-chip-group column v-model="faqCategorySelected">
                  <v-chip
                    v-for="category in [
                      {
                        label: 'General',
                      },
                      {
                        label: 'For Job Seekers',
                      },
                      {
                        label: 'For Employers',
                      },
                      {
                        label: 'Skill Passport',
                      },
                    ]"
                    class="mb-2 mr-2"
                    color="primary"
                    :variant="
                      category.label === faqCategorySelected
                        ? 'flat'
                        : 'outlined'
                    "
                    rounded="xl"
                    :value="category.label"
                    >{{ category.label }}</v-chip
                  >
                </v-chip-group>
              </div>
              <v-expansion-panels>
                <v-expansion-panel
                  v-for="(faq, index) in getFaqsByCategory(faqCategorySelected)"
                  :key="index"
                  class="mb-2"
                >
                  <v-expansion-panel-title
                    style="line-height: 1.5"
                    collapse-icon="mdi-minus"
                    expand-icon="mdi-plus"
                    >{{ faq.title }}</v-expansion-panel-title
                  >
                  <v-expansion-panel-text>
                    <p
                      v-html="faq.text"
                      class="text-grey-darken-2"
                      style="font-size: 14px"
                    ></p>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-col>
          </v-row>
        </v-container>
      </v-container>
</template>

<script setup>
definePageMeta({
  layout: "landing",
});

const requestUrl = useRequestURL();
const route = useRoute();
const canonicalUrl = computed(() => {
  return new URL(route.fullPath || "/", requestUrl.origin).href;
});
const ogImageUrl = computed(() => {
  return new URL("/images/hero.png", requestUrl.origin).href;
});

useHead({
  title: "ProConnect | Hospitality Jobs Across ASEAN",
  meta: [
    {
      name: "description",
      content:
        "ProConnect is a hospitality job platform across ASEAN connecting verified employers with skilled talent. Discover jobs, verified skill passports, and faster hiring.",
    },
    {
      name: "robots",
      content:
        "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
    },
    {
      name: "googlebot",
      content:
        "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
    },
    {
      property: "og:title",
      content: "ProConnect | Hospitality Jobs Across ASEAN",
    },
    {
      property: "og:description",
      content:
        "ProConnect is a hospitality job platform across ASEAN connecting verified employers with skilled talent. Discover jobs, verified skill passports, and faster hiring.",
    },
    {
      property: "og:type",
      content: "website",
    },
    {
      property: "og:url",
      content: canonicalUrl,
    },
    {
      property: "og:image",
      content: ogImageUrl,
    },
    {
      name: "twitter:card",
      content: "summary_large_image",
    },
    {
      name: "twitter:title",
      content: "ProConnect | Hospitality Jobs Across ASEAN",
    },
    {
      name: "twitter:description",
      content:
        "ProConnect is a hospitality job platform across ASEAN connecting verified employers with skilled talent. Discover jobs, verified skill passports, and faster hiring.",
    },
    {
      name: "twitter:image",
      content: ogImageUrl,
    },
  ],
  link: [
    {
      rel: "canonical",
      href: canonicalUrl,
    },
  ],
});

const faqCategorySelected = ref("General");
const faqIndexSelected = ref([]);

const faqs = {
  General: [
    {
      title: "What is ProConnect?",
      text: "ProConnect is a job matching platform that connects hospitality and tourism professionals with verified employers across ASEAN. We streamline job applications and provide tools to help you present your skills effectively.",
    },
    {
      title: "Which countries does ProConnect support?",
      text: "We currently serve job seekers and employers in ASEAN, currently focusing on Indonesia. Launching in the future for Thailand, Vietnam, Malaysia, Cambodia, Singapore and the Philippines.",
    },
    {
      title: "What languages does ProConnect support?",
      text: "The platform is currently available in English.",
    },
    {
      title: "Can I use ProConnect on mobile?",
      text: "Yes, the platform is mobile-friendly and accessible via any modern web browser. Download our Android App as well at <a href='https://bit.ly/proconnectandroid' target='_blank'>https://bit.ly/proconnectandroid</a>.",
    },
    {
      title: "Is my data secure on ProConnect?",
      text: "Yes. We follow industry-standard encryption and data privacy practices. Your information is stored securely and only shared with relevant employers.",
    },
    {
      title: "Who can I contact for support?",
      text: "You can reach our support team via the Help section or email us at <a href='mailto:cs@proconnectcareer.com'>cs@proconnectcareer.com</a>.",
    },
  ],
  "For Job Seekers": [
    {
      title: "How do I sign up and create a profile?",
      text: "You can register using your email and mobile number. Once signed in, you can complete your profile by adding your work history, education, certifications, and skills. After that, you can match with your dream jobs around the tourism and hospitality industry.",
    },
    {
      title: "How are my skills verified on ProConnect?",
      text: "Your uploaded certifications and training records may be verified in partnership with schools and institutions. These verified skills are part of your Skill Passport and help employers quickly recognise your qualifications.",
    },
    {
      title: "What types of jobs are available on ProConnect?",
      text: "We feature jobs in hotels, resorts, restaurants, airlines, travel agencies, cruise lines, and other hospitality sectors from front office and kitchen staff to managerial roles.",
    },
    {
      title: "How can I apply for jobs?",
      text: "After completing your profile, you can apply directly to job postings with one click. Some employers may include custom questions or interview steps.",
    },
    {
      title: "How does job matching work?",
      text: "Currently, jobs are suggested based on your profile. Advanced AI-based job matching will be introduced soon to automatically match your skills and experience with suitable roles.",
    },
  ],
  "For Employers": [
    {
      title: "How can my company post jobs on ProConnect?",
      text: "Register as an employer, complete your company profile, and start posting job openings.",
    },
    {
      title: "Can I customise the application process?",
      text: "Yes. You can add forms, short questions, and schedule interviews based on your hiring workflow and needs.",
    },
    {
      title: "How do I view and manage candidates?",
      text: "You'll be able to see a list of applicants for each job post, along with their profiles, uploaded credentials, and application status.",
    },
    {
      title: "How does ProConnect verify candidate skills?",
      text: "ProConnect works with educational institutions and training providers to verify candidate certifications with ASEAN Standard Certifications. Once verified, candidates receive skill verification on their profiles. These verified skills help Employers quickly identify applicants with authentic and job-relevant qualifications, reducing the risk of unqualified hires.",
    },
    {
      title: "Is there a cost to use ProConnect?",
      text: "Currently ProConnect is free to use.",
    },
  ],
  "Skill Passport": [
    {
      title: "What is a Skill Passport?",
      text: "A Skill Passport is a digital profile that showcases your verified skills, certifications, and work history. It serves as a trusted alternative to traditional CVs.",
    },
    {
      title: "Who verifies the skills?",
      text: "ProConnect works with accredited universities, vocational institutions, and training providers to verify uploaded certificates and qualifications.",
    },
    {
      title: "Is it mandatory to have a Skill Passport?",
      text: "No, but candidates with verified Skill Passports may be prioritised by employers and gain access to preferred job listings.",
    },
    {
      title: "Can employers see my Skill Passport?",
      text: "Yes. verified parts of your Skill Passport will be visible to employers when you apply for jobs or when they view your profile.",
    },
  ],
};

const getFaqsByCategory = (category) => {
  return faqs[category] || [];
};
</script>

<style scoped>
.hero-section {
  background: linear-gradient(to right, #4a148c, #880e4f);
  color: white;
  height: 95vh;
}
</style>
