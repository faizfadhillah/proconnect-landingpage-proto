<script setup>
const router = useRouter();
const route = useRoute();
const scrollElevation = ref(0);

const handleScroll = () => {
  scrollElevation.value = window.scrollY > 0 ? 1 : 0;
};

onMounted(() => {
  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>
<template>
  <v-app>
    <v-app-bar
      app
      v-if="route.query.back"
      density="comfortable"
      class="px-2"
      :elevation="scrollElevation"
      style="position: sticky; top: 0"
    >
      <v-row class="align-center px-3" style="min-width: 220px">
        <v-btn
          icon
          size="small"
          @click="router.back()"
          elevation="0"
          color="primary"
          class="mr-2"
          style="background: rgba(255, 255, 255, 0.1)"
        >
          <v-icon size="20">mdi-arrow-left</v-icon>
        </v-btn>
        <v-img src="/logo.svg" height="24"></v-img>
      </v-row>
      <v-spacer style="width: 90%"></v-spacer>
      <v-spacer></v-spacer>
    </v-app-bar>
    <v-container>
      <v-layout row>
        <v-flex xs12>
          <h2 class="text-center" style="font-size: 18px">
            <v-img src="/logo.svg" height="50" />

            Privacy Policy
          </h2>
          <div>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >Effective Date:</span
                ></strong
              ><span style="color: rgb(0, 0, 0); font-size: 12px"
                >&nbsp;16 January 2025</span
              >
            </p>
            <p><br /></p>
            <p style="text-align: justify">
              <span style="color: rgb(0, 0, 0); font-size: 12px"
                >PLEASE READ THE ENTIRE PRIVACY POLICY CAREFULLY AND CAREFULLY
                BEFORE USING THE SERVICES AVAILABLE ON ProConnect.</span
              >
            </p>
            <p><br /></p>
            <p style="text-align: justify">
              <span style="color: rgb(0, 0, 0); font-size: 12px"
                >At ProConnect, we value your privacy and are committed to
                protecting your personal data. This Privacy Policy outlines how
                we collect, use, and protect your information when you use our
                mobile application, ProConnect Job Matching &amp; Employment.
                This Policy applies to Advertisers, Registered Users, and the
                terms herein may be updated, revised, varied and/or changed from
                time to time.&nbsp;</span
              >
            </p>
            <p><br /></p>
            <p style="text-align: justify">
              <span style="color: rgb(0, 0, 0); font-size: 12px"
                >By registering and/or using our services, you:</span
              >
            </p>
            <ol>
              <li
                style="
                  list-style-type: lower-roman;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Acknowledge that you have read and understand this Policy
                    and agree to its provisions,</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: lower-roman;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Gives its consent to ProConnect to collect, use and/or
                    process your data for the purposes as described below,</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: lower-roman;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Gives its consent to ProConnect to transfer your personal
                    data in the situations mentioned below, as well as to any
                    transfer of your personal data outside your country,
                    and</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: lower-roman;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Gives its consent to ProConnect to share your data
                    internally and between Electronic Platforms and disclose
                    your data to service providers or third parties for the
                    purposes described below.</span
                  >
                </p>
              </li>
            </ol>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >1. DEFINITION</span
                ></strong
              >
            </p>
            <ul>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >Advertiser</span
                    ></strong
                  ><span style="color: rgb(0, 0, 0); font-size: 12px"
                    >&nbsp;means a user or company that places job vacancy
                    advertisements or promotes job-related activities on the
                    ProConnect Electronic Platform.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >Registered User</span
                    ></strong
                  ><span style="color: rgb(0, 0, 0); font-size: 12px"
                    >&nbsp;means every user as a prospective employee who has
                    registered on the ProConnect Electronic Platform.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >ProConnect&nbsp;</span
                    ></strong
                  ><span style="color: rgb(0, 0, 0); font-size: 12px"
                    >means the company that operates the relevant ProConnect
                    Electronic Platform for the country in which the User
                    resides or the country in which the User&apos;s business or
                    the User&apos;s head office is located.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >ProConnect Electronic Platform&nbsp;</span
                    ></strong
                  ><span style="color: rgb(0, 0, 0); font-size: 12px"
                    >refers to all ProConnect websites and mobile
                    applications.</span
                  >
                </p>
              </li>
            </ul>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >2. INFORMATION WE COLLECT</span
                ></strong
              >
            </p>
            <p style="text-align: justify">
              <span style="color: rgb(0, 0, 0); font-size: 12px"
                >We collect information to provide, personalise, and improve our
                services.</span
              >
            </p>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >2.1. Data You Provide Directly</span
                ></strong
              >
            </p>
            <ul>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >Registration Information:</span
                    ></strong
                  ><span style="color: rgb(0, 0, 0); font-size: 12px"
                    >&nbsp;Name, email address, domicile address, phone
                    number.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >Profile Data:</span
                    ></strong
                  ><span style="color: rgb(0, 0, 0); font-size: 12px"
                    >&nbsp;Date of birth, gender, nationality, profile picture,
                    education, work experience, skills, and
                    certifications.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >Job Preferences:</span
                    ></strong
                  ><span style="color: rgb(0, 0, 0); font-size: 12px"
                    >&nbsp;Information about job roles, job qualifications,
                    locations, salary and industries of interest.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >Communications:</span
                    ></strong
                  ><span style="color: rgb(0, 0, 0); font-size: 12px"
                    >&nbsp;Messages, comments, and interactions with our support
                    team or other users.</span
                  >
                </p>
              </li>
            </ul>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >2.2. Data Automatically Collected</span
                ></strong
              >
            </p>
            <ul>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >Device and Usage Data:</span
                    ></strong
                  >
                </p>
                <ul>
                  <li
                    style="
                      list-style-type: disc;
                      color: rgb(0, 0, 0);
                      font-size: 12px;
                    "
                  >
                    <p style="text-align: justify">
                      <span style="color: rgb(0, 0, 0); font-size: 12px"
                        >Device type, operating system, app version, and unique
                        identifiers.</span
                      >
                    </p>
                  </li>
                  <li
                    style="
                      list-style-type: disc;
                      color: rgb(0, 0, 0);
                      font-size: 12px;
                    "
                  >
                    <p style="text-align: justify">
                      <span style="color: rgb(0, 0, 0); font-size: 12px"
                        >Activity logs, such as features accessed, search
                        queries, and time spent on the app.</span
                      >
                    </p>
                  </li>
                </ul>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >Cookies and Tracking:</span
                    ></strong
                  ><span style="color: rgb(0, 0, 0); font-size: 12px"
                    >&nbsp;Cookies and similar technologies to track user
                    behavior, enhance user experience, and improve
                    services.</span
                  >
                </p>
              </li>
            </ul>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >2.3. Data from Third Parties</span
                ></strong
              >
            </p>
            <ul>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >Social Login Data:</span
                    ></strong
                  ><span style="color: rgb(0, 0, 0); font-size: 12px"
                    >&nbsp;Data from Google Login or Apple Login, including
                    Linked profile information.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >Partner Data:</span
                    ></strong
                  ><span style="color: rgb(0, 0, 0); font-size: 12px"
                    >&nbsp;Information shared by recruitment partners or
                    employers using our services.</span
                  >
                </p>
              </li>
            </ul>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >2.4. Sensitive Data</span
                ></strong
              >
            </p>
            <ul>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >We do not collect sensitive data such as financial, health,
                    racial or ethnic origin, political views and/or political
                    affiliations, religion and beliefs, or biometric data unless
                    explicitly required for specific app features and with your
                    consent.</span
                  >
                </p>
              </li>
            </ul>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >3. HOW WE USE YOUR DATA</span
                ></strong
              >
            </p>
            <p style="text-align: justify">
              <span style="color: rgb(0, 0, 0); font-size: 12px"
                >We process your personal data for the following:</span
              >
            </p>
            <ul>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >Account Management:</span
                    ></strong
                  ><span style="color: rgb(0, 0, 0); font-size: 12px"
                    >&nbsp;To create and maintain your user profile.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >Job Matching:</span
                    ></strong
                  ><span style="color: rgb(0, 0, 0); font-size: 12px"
                    >&nbsp;To recommend job opportunities aligned with your
                    preferences and qualifications.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >Service Improvement:</span
                    ></strong
                  ><span style="color: rgb(0, 0, 0); font-size: 12px"
                    >&nbsp;To enhance app functionality, fix bugs, and improve
                    user experiences.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >Personalisation:</span
                    ></strong
                  ><span style="color: rgb(0, 0, 0); font-size: 12px"
                    >&nbsp;To tailor job recommendations, notifications, and app
                    content based on your preferences.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >Analytics and Research:</span
                    ></strong
                  ><span style="color: rgb(0, 0, 0); font-size: 12px"
                    >&nbsp;To analyse usage trends and develop insights to
                    improve the app.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >Security and Compliance:</span
                    ></strong
                  ><span style="color: rgb(0, 0, 0); font-size: 12px"
                    >&nbsp;To detect fraud, enforce policies, and comply with
                    legal obligations.</span
                  >
                </p>
              </li>
            </ul>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >4. HOW WE SHARE INFORMATION</span
                ></strong
              >
            </p>
            <p style="text-align: justify">
              <span style="color: rgb(0, 0, 0); font-size: 12px"
                >We share your data only in limited circumstances:</span
              >
            </p>
            <ul>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >With Service Providers:</span
                    ></strong
                  ><span style="color: rgb(0, 0, 0); font-size: 12px"
                    >&nbsp;Trusted third parties that provide services like data
                    hosting, analytics, and customer support. These providers
                    are bound by confidentiality obligations.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >With Employers or Partners:</span
                    ></strong
                  ><span style="color: rgb(0, 0, 0); font-size: 12px"
                    >&nbsp;With your consent, relevant profile information may
                    be shared with potential employers or recruitment
                    partners.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >For Legal and Security Reasons:</span
                    ></strong
                  ><span style="color: rgb(0, 0, 0); font-size: 12px"
                    >&nbsp;When required by law, court orders, or to protect our
                    users and systems.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >Business Transfers:</span
                    ></strong
                  ><span style="color: rgb(0, 0, 0); font-size: 12px"
                    >&nbsp;In the event of a merger, acquisition, or sale of
                    assets, your data may be transferred as part of the
                    transaction.</span
                  >
                </p>
              </li>
            </ul>
            <p style="text-align: justify">
              <span style="color: rgb(0, 0, 0); font-size: 12px"
                >We do not sell your personal data to third parties for
                advertising or marketing purposes.</span
              >
            </p>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >5. DATA RETENTION</span
                ></strong
              >
            </p>
            <p style="text-align: justify">
              <span style="color: rgb(0, 0, 0); font-size: 12px"
                >We retain personal data based on its purpose and applicable
                legal requirements:</span
              >
            </p>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >5.1. Active Account Retention</span
                ></strong
              >
            </p>
            <ul>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Personal data is retained for as long as your account is
                    active, enabling you to use the app effectively.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Job application history and activity logs are stored for
                    reference and personalised recommendations.</span
                  >
                </p>
              </li>
            </ul>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >5.2. Suspicious Activity on User Account</span
                ></strong
              >
            </p>
            <p style="text-align: justify">
              <span style="color: rgb(0, 0, 0); font-size: 12px"
                >If the User sees suspicious activity on the User&apos;s
                account, or accidentally does the following:</span
              >
            </p>
            <ul>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Receive and/or reply to suspicious emails.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Clicking on suspicious links.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Receive and open attachments you didn&apos;t expect.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Visiting suspicious websites.</span
                  >
                </p>
              </li>
            </ul>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >5.2.1. Prevention Measures</span
                ></strong
              >
            </p>
            <p style="text-align: justify">
              <span style="color: rgb(0, 0, 0); font-size: 12px"
                >Several steps that Users can take to help protect
                themselves:</span
              >
            </p>
            <ul>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Run a virus scan on your computer.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Change your ProConnect account password.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >If you have used this password on other websites, please
                    change this password as well (do not reuse the same password
                    when doing so).</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Change the password for the email address that User uses to
                    log in to User&apos;s ProConnect account.</span
                  >
                </p>
              </li>
            </ul>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >5.2.2. Change Password Precaution</span
                ></strong
              >
            </p>
            <ul>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >As an additional precaution, we recommend changing the
                    password for each account that the User uses with the same
                    email address that you use to log in to the User&apos;s
                    ProConnect account.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Please contact our Customer Service if User believes
                    User&apos;s ProConnect account has been compromised, so that
                    we can investigate further.</span
                  >
                </p>
              </li>
            </ul>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >5.2.3. Responding to Suspicious Activity and Protecting Your
                  Information</span
                ></strong
              >
            </p>
            <p style="text-align: justify">
              <span style="color: rgb(0, 0, 0); font-size: 12px"
                >If ProConnect has contacted a User regarding our concerns
                regarding suspicious activity, please immediately cease
                communications with that party. If personal details have been
                provided, in addition to the steps above that Users can take,
                see the information below:</span
              >
            </p>
            <ul>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Bank details: if the User has provided the User&apos;s bank
                    details, please contact the User&apos;s financial
                    institution immediately.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Fraud and identity theft: If the User feels that the
                    User&apos;s identity has been compromised, please contact
                    the local police station. ProConnect will cooperate with the
                    police if they request any details.</span
                  >
                </p>
              </li>
            </ul>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >5.3. Account Deletion</span
                ></strong
              >
            </p>
            <ul>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >User-Initiated Deletion:</span
                    ></strong
                  ><span style="color: rgb(0, 0, 0); font-size: 12px"
                    >&nbsp;When you delete your account, we deactivate it and
                    begin the data removal process.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >Retention Period:</span
                    ></strong
                  >
                </p>
                <ul>
                  <li
                    style="
                      list-style-type: disc;
                      color: rgb(0, 0, 0);
                      font-size: 12px;
                    "
                  >
                    <p style="text-align: justify">
                      <span style="color: rgb(0, 0, 0); font-size: 12px"
                        >Basic account data is retained for 30 days to allow
                        recovery if requested.</span
                      >
                    </p>
                  </li>
                  <li
                    style="
                      list-style-type: disc;
                      color: rgb(0, 0, 0);
                      font-size: 12px;
                    "
                  >
                    <p style="text-align: justify">
                      <span style="color: rgb(0, 0, 0); font-size: 12px"
                        >Data that must comply with legal or contractual
                        obligations may be retained for up to 7 years (e.g., tax
                        records or legal disputes).</span
                      >
                    </p>
                  </li>
                </ul>
              </li>
            </ul>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >5.4. Aggregated or Anonymized Data</span
                ></strong
              >
            </p>
            <ul>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Even after the account has been deleted by the User and
                    after the User&apos;s personal data is no longer needed, we
                    will securely delete or anonymize it. We may retain such
                    anonymous data for research, analytics and application
                    improvement purposes, ensuring it cannot identify individual
                    users.</span
                  >
                </p>
              </li>
            </ul>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >6. DATA SECURITY</span
                ></strong
              >
            </p>
            <p style="text-align: justify">
              <span style="color: rgb(0, 0, 0); font-size: 12px"
                >We implement industry-standard practices to safeguard your
                personal data:</span
              >
            </p>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >6.1 Encryption</span
                ></strong
              >
            </p>
            <ul>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Sensitive data, such as login credentials, is encrypted
                    during transmission and storage using secure protocols
                    (e.g., HTTPS and AES encryption).</span
                  >
                </p>
              </li>
            </ul>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >6.2 Access Controls</span
                ></strong
              >
            </p>
            <ul>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Access to personal data is restricted to authorised
                    personnel who need it for app functionality or compliance
                    purposes.</span
                  >
                </p>
              </li>
            </ul>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >6.3 Monitoring and Incident Response</span
                ></strong
              >
            </p>
            <ul>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Systems are regularly monitored for vulnerabilities,
                    unauthorised access, or breaches.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >In the event of a data breach, affected users will be
                    notified within 72 hours or 3 x 24 hours (three times
                    twenty-four hours), as required by applicable
                    laws.&nbsp;</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >We cannot fully guarantee that Personal Data will not be
                    intercepted, accessed, disclosed, altered or destroyed by
                    unauthorized third parties, due to factors beyond our
                    control.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >ProConnect will notify the User in writing in the event of
                    a Personal Information Protection failure within 72 hours or
                    3 x 24 hours (three times twenty-four hours).</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Notification will be provided to User via electronic mail
                    (</span
                  ><em
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >e-mail</span
                    ></em
                  ><span style="color: rgb(0, 0, 0); font-size: 12px">).</span>
                </p>
              </li>
            </ul>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >6.4 User Responsibility</span
                ></strong
              >
            </p>
            <ul>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Users are encouraged to use strong passwords and enable
                    additional security features like two-factor authentication
                    if available.&nbsp;</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Users are responsible for maintaining the confidentiality
                    of User account details and Users are obliged not to share
                    User account details, including your password and One Time
                    Password (OTP) with anyone, and Users must always maintain
                    and be responsible for the security of the device that Users
                    use.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Users are advised that Users always update the ProConnect
                    application and/or User software.</span
                  >
                </p>
              </li>
            </ul>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >7. COOKIES AND TRACKING TECHNOLOGIES</span
                ></strong
              >
            </p>
            <p style="text-align: justify">
              <span style="color: rgb(0, 0, 0); font-size: 12px"
                >We use cookies and similar technologies for functionality and
                personalisation:</span
              >
            </p>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >7.1 Types of Cookies Used</span
                ></strong
              >
            </p>
            <ul>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >Essential Cookies:</span
                    ></strong
                  ><span style="color: rgb(0, 0, 0); font-size: 12px"
                    >&nbsp;Necessary for the app to function, such as
                    maintaining your session.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >Performance Cookies:</span
                    ></strong
                  ><span style="color: rgb(0, 0, 0); font-size: 12px"
                    >&nbsp;Collect data on app usage to help us improve
                    functionality.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >Targeting Cookies:</span
                    ></strong
                  ><span style="color: rgb(0, 0, 0); font-size: 12px"
                    >&nbsp;Personalize job recommendations and advertisements
                    based on user behaviour.</span
                  >
                </p>
              </li>
            </ul>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >7.2 Managing Cookies</span
                ></strong
              >
            </p>
            <ul>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >You can manage cookie preferences through your app settings
                    or device settings.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Disabling cookies may impact certain features of the
                    app.</span
                  >
                </p>
              </li>
            </ul>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >7.3 Third-Party Tracking</span
                ></strong
              >
            </p>
            <ul>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >We work with analytics providers (e.g., Google Analytics)
                    to track app performance and user interactions.</span
                  >
                </p>
              </li>
            </ul>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >8. CROSS-BORDER DATA TRANSFERS</span
                ></strong
              >
            </p>
            <p style="text-align: justify">
              <span style="color: rgb(0, 0, 0); font-size: 12px"
                >As a global platform, your data may be processed in countries
                outside of your residence. When we transfer a User&apos;s
                personal data from a User&apos;s home country, or city to
                another country, or another city, we will comply with our legal
                and regulatory obligations with respect to the User&apos;s
                personal data, including having a lawful basis for transferring
                the User&apos;s personal data and implementing appropriate
                safeguards to ensure an adequate level of protection for
                Users&apos; personal data. We will also ensure that the
                recipient of the information is obliged to protect the
                User&apos;s personal data with a standard of protection that is
                comparable to protection under applicable law.</span
              >
            </p>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >8.1 Data Transfer Standards</span
                ></strong
              >
            </p>
            <ul>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Transfers comply with data protection laws within
                    Indonesia.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Standard Contractual Clauses (SCCs) are used to ensure data
                    protection during international transfers.</span
                  >
                </p>
              </li>
            </ul>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >8.2 User Choices</span
                ></strong
              >
            </p>
            <ul>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >You can request more details about data transfer mechanisms
                    or object to specific cross-border data processing
                    activities by contacting our support team.</span
                  >
                </p>
              </li>
            </ul>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >9. CHILDREN&rsquo;S PRIVACY</span
                ></strong
              >
            </p>
            <p style="text-align: justify">
              <span style="color: rgb(0, 0, 0); font-size: 12px"
                >ProConnect is not intended for users under the age of 17:</span
              >
            </p>
            <ul>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >If we discover that a user under 17 has provided personal
                    data, we will delete it immediately.</span
                  >
                </p>
              </li>
            </ul>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >10. UPDATES TO THIS PRIVACY POLICY&nbsp;</span
                ></strong
              >
            </p>
            <p style="text-align: justify">
              <span style="color: rgb(0, 0, 0); font-size: 12px"
                >We reserve the right to change the Privacy Policy at any time,
                by notification via announcement on the ProConnect Electronic
                Platform or other means deemed reasonable to reflect new
                features, legal requirements, or changes in business
                practices:</span
              >
            </p>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >10.1 Notification of Changes</span
                ></strong
              >
            </p>
            <ul>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Significant updates will be communicated via email or
                    in-app notifications at least 30 days before
                    implementation.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Minor updates may be reflected in the policy immediately,
                    with the new effective date displayed at the top.</span
                  >
                </p>
              </li>
            </ul>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >10.2 User Acknowledgment</span
                ></strong
              >
            </p>
            <ul>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Continued use of the app after updates constitutes
                    acceptance of the revised policy.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Users are deemed to agree to the changes made to the
                    Privacy Policy by continuing to access and use the
                    Service.</span
                  >
                </p>
              </li>
            </ul>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >11. PROTECTION FROM JOB VACANCY FRAUD&nbsp;</span
                ></strong
              >
            </p>
            <p style="text-align: justify">
              <span style="color: rgb(0, 0, 0); font-size: 12px"
                >Be wary of advertisers or employers who ask for the
                following:</span
              >
            </p>
            <ul>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Upfront costs (e.g. for things like
                    &lsquo;processing&rsquo; job applications). Genuine
                    advertisers or employers WILL NOT ask for money or bank or
                    credit card details.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Receipt of money transfers that you can save some of as
                    &apos;payment&apos;.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Bank or credit card details.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Copy of driver&apos;s license or passport information as
                    part of the job application process.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Taxpayer number. This information should only be provided
                    after you have received a genuine job offer.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Personal information that is not work-related, such as
                    appearance or marital status.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >ProConnect username and password.</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Other personally identifiable information.</span
                  >
                </p>
              </li>
            </ul>
            <p><br /></p>
            <p style="text-align: justify">
              <span style="color: rgb(0, 0, 0); font-size: 12px"
                >Always check the legitimacy of any job advertisements, email,
                or company that seems suspicious before you respond. For
                example, large, well-known companies typically do not include
                Hotmail or other free email addresses in their advertising. If
                you have any problems, contact the company directly to
                verify.</span
              >
            </p>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >12. CONTACT INFORMATION</span
                ></strong
              >
            </p>
            <p style="text-align: justify">
              <span style="color: rgb(0, 0, 0); font-size: 12px"
                >If you have questions, concerns, or complaints regarding this
                privacy policy, please contact us through any of the
                following:</span
              >
            </p>
            <ul>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >Email:&nbsp;</span
                    ></strong
                  ><span style="color: rgb(0, 0, 0); font-size: 12px"
                    >Send email to &ldquo;</span
                  ><a href="mailto:cs@proconnectcareer.com"
                    ><u
                      ><span style="color: rgb(70, 120, 134); font-size: 12px"
                        >cs@proconnectcareer.com</span
                      ></u
                    ></a
                  ><span style="color: rgb(0, 0, 0); font-size: 12px"
                    >&rdquo;</span
                  >
                </p>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >In-App Contact/Feedback Form:</span
                    ></strong
                  ><span style="color: rgb(0, 0, 0); font-size: 12px"
                    >&nbsp;Available under the &quot;Profile&quot; section in
                    the app and click on &ldquo;Feedback&rdquo;.</span
                  >
                </p>
              </li>
            </ul>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >12.1 Complaints Handling</span
                ></strong
              >
            </p>
            <ul>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <span style="color: rgb(0, 0, 0); font-size: 12px"
                    >If we cannot resolve your complaint, you may file a
                    complaint with the Personal Data Protection Authority of
                    Indonesia or other relevant authorities.</span
                  >
                </p>
              </li>
            </ul>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="color: rgb(0, 0, 0); font-size: 12px"
                  >13. COMPLIANCE WITH LAW AND REGULATIONS</span
                ></strong
              >
            </p>
            <p style="text-align: justify">
              <span style="color: rgb(0, 0, 0); font-size: 12px"
                >This Privacy Policy is governed by and complies with Indonesian
                laws and regulations, including but not limited to:</span
              >
            </p>
            <ul>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >Law No. 27 of 2022 on Personal Data Protection (PDP
                      Law):</span
                    ></strong
                  >
                </p>
                <ul>
                  <li
                    style="
                      list-style-type: disc;
                      color: rgb(0, 0, 0);
                      font-size: 12px;
                    "
                  >
                    <p style="text-align: justify">
                      <span style="color: rgb(0, 0, 0); font-size: 12px"
                        >Ensuring the lawful collection, use, and sharing of
                        personal data.</span
                      >
                    </p>
                  </li>
                  <li
                    style="
                      list-style-type: disc;
                      color: rgb(0, 0, 0);
                      font-size: 12px;
                    "
                  >
                    <p style="text-align: justify">
                      <span style="color: rgb(0, 0, 0); font-size: 12px"
                        >Granting users the right to access, update, and delete
                        their personal data.</span
                      >
                    </p>
                  </li>
                </ul>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >Electronic Information and Transactions Law (EIT
                      Law):</span
                    ></strong
                  >
                </p>
                <ul>
                  <li
                    style="
                      list-style-type: disc;
                      color: rgb(0, 0, 0);
                      font-size: 12px;
                    "
                  >
                    <p style="text-align: justify">
                      <span style="color: rgb(0, 0, 0); font-size: 12px"
                        >Regulating the use of electronic systems for data
                        storage and transactions.</span
                      >
                    </p>
                  </li>
                </ul>
              </li>
              <li
                style="
                  list-style-type: disc;
                  color: rgb(0, 0, 0);
                  font-size: 12px;
                "
              >
                <p style="text-align: justify">
                  <strong
                    ><span style="color: rgb(0, 0, 0); font-size: 12px"
                      >Government Regulation No. 71 of 2019:</span
                    ></strong
                  >
                </p>
                <ul>
                  <li
                    style="
                      list-style-type: disc;
                      color: rgb(0, 0, 0);
                      font-size: 12px;
                    "
                  >
                    <p style="text-align: justify">
                      <span style="color: rgb(0, 0, 0); font-size: 12px"
                        >Governing the operation of electronic systems and
                        ensuring data protection.</span
                      >
                    </p>
                  </li>
                </ul>
              </li>
            </ul>
            <p style="text-align: justify">
              <span style="color: rgb(0, 0, 0); font-size: 12px"
                >ProConnect is committed to adhering to these regulations and
                ensuring that your personal data is handled securely and
                transparently.</span
              >
            </p>
            <p><br /></p>
          </div>
        </v-flex>
      </v-layout>
    </v-container>
  </v-app>
</template>
<style scoped>
ul {
  margin-left: 40px;
}
ol {
  margin-left: 40px;
}
</style>
