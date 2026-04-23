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
          <h2 class="text-center">
            <v-img src="/logo.svg" height="50" />
          </h2>
          <div>
            <p style="text-align: center">
              <strong
                ><span style="font-size: 18px"
                  >ProConnect Terms of Service</span
                ></strong
              >
            </p>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="font-size: 12px">Effective Date:</span></strong
              ><span style="font-size: 12px">&nbsp;16 January 2025</span>
            </p>
            <p><br /></p>
            <p style="text-align: justify">
              <span style="font-size: 12px"
                >PLEASE READ THE ENTIRE TERMS OF SERVICE CAREFULLY AND CAREFULLY
                BEFORE USING THE SERVICES AVAILABLE ON ProConnect.</span
              >
            </p>
            <p><br /></p>
            <p style="text-align: justify">
              <span style="font-size: 12px"
                >The following Service Terms applies to Advertisers, Registered
                Users, and the terms herein may be updated, revised, varied
                and/or changed from time to time. By registering and/or using
                our services, you agree to the terms of this document.</span
              >
            </p>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="font-size: 12px">1. DEFINITION</span></strong
              >
            </p>
            <ul>
              <li style="list-style-type: disc; font-size: 12px">
                <p style="text-align: justify">
                  <strong
                    ><span style="font-size: 12px">Advertiser</span></strong
                  ><span style="font-size: 12px"
                    >&nbsp;means a user or company that places job vacancy
                    advertisements or promotes job-related activities on the
                    ProConnect Electronic Platform.</span
                  >
                </p>
              </li>
              <li style="list-style-type: disc; font-size: 12px">
                <p style="text-align: justify">
                  <strong
                    ><span style="font-size: 12px"
                      >Registered User</span
                    ></strong
                  ><span style="font-size: 12px"
                    >&nbsp;means every user as a prospective employee who has
                    registered on the ProConnect Electronic Platform.</span
                  >
                </p>
              </li>
              <li style="list-style-type: disc; font-size: 12px">
                <p style="text-align: justify">
                  <strong
                    ><span style="font-size: 12px"
                      >ProConnect&nbsp;</span
                    ></strong
                  ><span style="font-size: 12px"
                    >means the company that operates the relevant ProConnect
                    Electronic Platform for the country in which the User
                    resides or the country in which the User&apos;s business or
                    the User&apos;s head office is located.</span
                  >
                </p>
              </li>
              <li style="list-style-type: disc; font-size: 12px">
                <p style="text-align: justify">
                  <strong
                    ><span style="font-size: 12px"
                      >ProConnect Electronic Platform&nbsp;</span
                    ></strong
                  ><span style="font-size: 12px"
                    >refers to all ProConnect websites and mobile
                    applications</span
                  >
                </p>
              </li>
            </ul>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="font-size: 12px"
                  >2. ACCEPTANCE OF TERMS</span
                ></strong
              >
            </p>
            <p style="text-align: justify">
              <span style="font-size: 12px"
                >By downloading, installing, or using ProConnect Electronic
                Platform, you agree to abide by these Terms of Service and our
                <router-link to="/privacy-policy">Privacy Policy</router-link>.
                If you do not agree to these terms, you may not use the
                App.</span
              >
            </p>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="font-size: 12px"
                  >3. USER REGISTRATION</span
                ></strong
              >
            </p>
            <p style="text-align: justify">
              <span style="font-size: 12px"
                >To use the ProConnect Electronic Platform, you must create an
                account by providing accurate and up-to-date information. You
                are responsible for maintaining the confidentiality of your
                account and password, and for all activities that occur under
                your account.</span
              >
            </p>
            <p><br /></p>
            <p style="text-align: justify">
              <span style="font-size: 12px">You agree to:</span>
            </p>
            <ul>
              <li style="list-style-type: disc; font-size: 12px">
                <p style="text-align: justify">
                  <span style="font-size: 12px"
                    >Provide accurate, current, and complete information during
                    the registration process.</span
                  >
                </p>
              </li>
              <li style="list-style-type: disc; font-size: 12px">
                <p style="text-align: justify">
                  <span style="font-size: 12px"
                    >Update your account information as necessary.</span
                  >
                </p>
              </li>
              <li style="list-style-type: disc; font-size: 12px">
                <p style="text-align: justify">
                  <span style="font-size: 12px"
                    >Protect your login credentials and ensure they are not
                    shared with others.</span
                  >
                </p>
              </li>
            </ul>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="font-size: 12px"
                  >4. USE OF THE PROCONNECT ELECTRONIC PLATFORM</span
                ></strong
              >
            </p>
            <p style="text-align: justify">
              <span style="font-size: 12px"
                >You may use ProConnect Electronic Platform solely for personal,
                non-commercial purposes in accordance with these Terms of
                Service. You agree not to use the App for any unlawful or
                prohibited activities, including but not limited to:</span
              >
            </p>
            <ul>
              <li style="list-style-type: disc; font-size: 12px">
                <p style="text-align: justify">
                  <span style="font-size: 12px"
                    >Using the App for fraudulent purposes.</span
                  >
                </p>
              </li>
              <li style="list-style-type: disc; font-size: 12px">
                <p style="text-align: justify">
                  <span style="font-size: 12px"
                    >Posting or transmitting offensive or inappropriate
                    content.</span
                  >
                </p>
              </li>
              <li style="list-style-type: disc; font-size: 12px">
                <p style="text-align: justify">
                  <span style="font-size: 12px"
                    >Violating any applicable local, state, or international
                    law.</span
                  >
                </p>
              </li>
            </ul>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="font-size: 12px"
                  >5. USER RESPONSIBILITIES</span
                ></strong
              >
            </p>
            <p style="text-align: justify">
              <span style="font-size: 12px"
                >You are responsible for all actions performed through your
                account. You agree to:</span
              >
            </p>
            <ul>
              <li style="list-style-type: disc; font-size: 12px">
                <p style="text-align: justify">
                  <span style="font-size: 12px"
                    >Not impersonate another person or entity.</span
                  >
                </p>
              </li>
              <li style="list-style-type: disc; font-size: 12px">
                <p style="text-align: justify">
                  <span style="font-size: 12px"
                    >Not engage in any activity that interferes with or disrupts
                    the functioning of the App.</span
                  >
                </p>
              </li>
              <li style="list-style-type: disc; font-size: 12px">
                <p style="text-align: justify">
                  <span style="font-size: 12px"
                    >Ensure the information you provide is accurate, truthful,
                    and up to date.</span
                  >
                </p>
              </li>
              <li style="list-style-type: disc; font-size: 12px">
                <p style="text-align: justify">
                  <span style="font-size: 12px"
                    >Not to use the App to violate the rights of others,
                    including their privacy or intellectual property.</span
                  >
                </p>
              </li>
            </ul>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="font-size: 12px"
                  >6. ACCOUNT TERMINATION</span
                ></strong
              >
            </p>
            <p style="text-align: justify">
              <span style="font-size: 12px"
                >You may terminate your account at any time by deleting your
                profile or contacting customer support. If you violate these
                Terms of Service, we may suspend or terminate your account
                without prior notice.</span
              >
            </p>
            <p><br /></p>
            <p style="text-align: justify">
              <span style="font-size: 12px"
                >Upon termination, you lose access to all features of the
                ProConnect Electronic Platform, and we may delete your data in
                accordance with our
                <router-link to="/privacy-policy">Privacy Policy</router-link
                >.</span
              >
            </p>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="font-size: 12px"
                  >7. DATA COLLECTION AND PRIVACY</span
                ></strong
              >
            </p>
            <p style="text-align: justify">
              <span style="font-size: 12px"
                >By using the App, you consent to the collection and use of your
                personal data in accordance with our&nbsp;</span
              ><router-link to="/privacy-policy"
                ><span style="font-size: 12px"
                  >Privacy Policy</span
                ></router-link
              ><span style="font-size: 12px"
                >. We respect your privacy and take reasonable steps to protect
                your data, but you acknowledge that no security system is 100%
                secure.</span
              >
            </p>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="font-size: 12px"
                  >8. THIRD-PARTY SERVICES</span
                ></strong
              >
            </p>
            <p style="text-align: justify">
              <span style="font-size: 12px"
                >ProConnect Electronic Platform may contain links or connections
                to third-party services, including social media platforms
                (Google Login, Apple Login, Including linked profile
                information). These third parties have their own terms and
                privacy policies, and we do not assume any responsibility or
                liability for their practices.</span
              >
            </p>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="font-size: 12px"
                  >9. INTELLECTUAL PROPERTY</span
                ></strong
              >
            </p>
            <p style="text-align: justify">
              <span style="font-size: 12px"
                >All content and materials available through the App, including
                but not limited to text, logos, graphics, images, and software,
                are the property of ProConnect or its licensors and are
                protected by intellectual property laws. You may not copy,
                modify, distribute, or create derivative works based on the App
                or its contents without prior written permission.</span
              >
            </p>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="font-size: 12px"
                  >10. LIMITATION OF LIABILITY</span
                ></strong
              >
            </p>
            <p style="text-align: justify">
              <span style="font-size: 12px"
                >To the fullest extent permitted by law, ProConnect will not be
                liable for any direct, indirect, incidental, special, or
                consequential damages arising out of or related to your use of
                ProConnect Electronic Platform, including but not limited to
                loss of data, loss of profits, or any other damages resulting
                from the use or inability to use the ProConnect Electronic
                Platform.</span
              >
            </p>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="font-size: 12px"
                  >11. WARRANTY INFORMATION</span
                ></strong
              >
            </p>
            <p style="text-align: justify">
              <span style="font-size: 12px"
                >ProConnect Electronic Platform is provided &quot;as is&quot;
                and &quot;as available,&quot; without warranties of any kind,
                either express or implied, including but not limited to implied
                warranties of merchantability, fitness for a particular purpose,
                or non-infringement. We do not guarantee that ProConnect
                Electronic Platform will be error-free, secure, or continuously
                available.</span
              >
            </p>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="font-size: 12px"
                  >12. MODIFICATIONS TO THE TERMS OF SERVICE</span
                ></strong
              >
            </p>
            <p style="text-align: justify">
              <span style="font-size: 12px"
                >ProConnect reserve the right to change these Terms of Service
                at any time, by notification via announcement on the ProConnect
                Electronic Platform or other means deemed reasonable to reflect
                new features, legal requirements, or changes in business
                practices</span
              >
            </p>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="font-size: 12px"
                  >13. CHOICE OF LAW AND DISPUTE RESOLUTION</span
                ></strong
              >
            </p>
            <ul>
              <li style="list-style-type: disc; font-size: 12px">
                <p style="text-align: justify">
                  <span style="font-size: 12px"
                    >These terms of service are subject to and therefore must be
                    interpreted based on the provisions of the laws of the
                    Republic of Indonesia.</span
                  >
                </p>
              </li>
              <li style="list-style-type: disc; font-size: 12px">
                <p style="text-align: justify">
                  <span style="font-size: 12px"
                    >If a dispute arises regarding the interpretation and/or
                    implementation of the Terms of Service, it will be resolved
                    by deliberation to reach a consensus.</span
                  >
                </p>
              </li>
              <li style="list-style-type: disc; font-size: 12px">
                <p style="text-align: justify">
                  <span style="font-size: 12px"
                    >If the above dispute cannot be resolved amicably and/or by
                    deliberation to reach consensus, then the dispute will be
                    resolved through the District Court (based on
                    ProConnect&rsquo;s domicile)</span
                  >
                </p>
              </li>
            </ul>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="font-size: 12px"
                  >14. CONTACT INFORMATION</span
                ></strong
              >
            </p>
            <p style="text-align: justify">
              <span style="font-size: 12px"
                >If you have any questions, concerns, or feedback about these
                Terms of Service, please contact us at:</span
              >
            </p>
            <ul>
              <li style="list-style-type: disc; font-size: 12px">
                <p style="text-align: justify">
                  <strong
                    ><span style="font-size: 12px">Email:&nbsp;</span></strong
                  ><span style="font-size: 12px">Send email to &ldquo;</span
                  ><a href="mailto:cs@proconnectcareer.com"
                    ><u
                      ><span style="color: #467886; font-size: 12px"
                        >cs@proconnectcareer.com</span
                      ></u
                    ></a
                  ><span style="font-size: 12px">&rdquo;</span>
                </p>
              </li>
              <li style="list-style-type: disc; font-size: 12px">
                <p style="text-align: justify">
                  <strong
                    ><span style="font-size: 12px"
                      >In-App Contact/Feedback Form:</span
                    ></strong
                  ><span style="font-size: 12px"
                    >&nbsp;Available under the &quot;Profile&quot; section in
                    the app and click on &ldquo;Feedback&rdquo;.</span
                  >
                </p>
              </li>
            </ul>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="font-size: 12px"
                  >15. WAIVER OF INDEMNIFICATION</span
                ></strong
              >
            </p>
            <p style="text-align: justify">
              <span style="font-size: 12px">You declare that</span
              ><strong><span style="font-size: 12px">&nbsp;</span></strong
              ><span style="font-size: 12px"
                >ProConnect, its directors, commissioners, employees, partners,
                affiliates, and/or representatives are not responsible and/or
                cannot be held liable for claims, demands, lawsuits, losses
                (whether direct or indirect, material or immaterial) and
                obligations in any form. by you and/or any party resulting from
                or in connection with:&nbsp;</span
              >
            </p>
            <ol>
              <li style="list-style-type: lower-roman; font-size: 12px">
                <p style="text-align: justify">
                  <span style="font-size: 12px">Material</span>
                </p>
              </li>
              <li style="list-style-type: lower-roman; font-size: 12px">
                <p style="text-align: justify">
                  <span style="font-size: 12px">Services</span>
                </p>
              </li>
              <li style="list-style-type: lower-roman; font-size: 12px">
                <p style="text-align: justify">
                  <span style="font-size: 12px"
                    >Your failure to comply with the Terms of
                    Service,&nbsp;</span
                  >
                </p>
                <ol>
                  <li style="list-style-type: lower-alpha; font-size: 12px">
                    <p style="text-align: justify">
                      <span style="font-size: 12px"
                        >information, statements and others provided by you are
                        assessed or found to be incorrect,&nbsp;</span
                      >
                    </p>
                  </li>
                  <li style="list-style-type: lower-alpha; font-size: 12px">
                    <p style="text-align: justify">
                      <span style="font-size: 12px"
                        >use of your Account by other parties,&nbsp;</span
                      >
                    </p>
                  </li>
                  <li style="list-style-type: lower-alpha; font-size: 12px">
                    <p style="text-align: justify">
                      <span style="font-size: 12px"
                        >disruption and/or operational failure of the ProConnect
                        Electronic Platform,&nbsp;</span
                      >
                    </p>
                  </li>
                  <li style="list-style-type: lower-alpha; font-size: 12px">
                    <p style="text-align: justify">
                      <span style="font-size: 12px"
                        >your visit and/or use of the ProConnect Electronic
                        Platform, or&nbsp;</span
                      >
                    </p>
                  </li>
                  <li style="list-style-type: lower-alpha; font-size: 12px">
                    <p style="text-align: justify">
                      <span style="font-size: 12px"
                        >your actions that are not in accordance with laws and
                        regulations.</span
                      >
                    </p>
                  </li>
                </ol>
              </li>
            </ol>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="font-size: 12px">16. SEVERABILITY</span></strong
              >
            </p>
            <p style="text-align: justify">
              <span style="font-size: 12px"
                >If any part of these Terms of Service is deemed legally invalid
                and/or invalid and/or unenforceable, the remaining parts will
                remain valid and enforceable.</span
              >
            </p>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="font-size: 12px"
                  >17. FORCE MAJEURE&nbsp;</span
                ></strong
              >
            </p>
            <ul>
              <li style="list-style-type: disc; font-size: 12px">
                <p style="text-align: justify">
                  <span style="font-size: 12px"
                    >Each Party will not be deemed to have violated these Terms
                    of Service if there is a total or partial failure of duties
                    and obligations under these Terms of Service caused by fire,
                    government or state action, war, riot, rebellion,
                    earthquake, tsunami, embargo, labor dispute, terrorism,
                    strikes, computer failures, unlawful security breaches
                    (hacking), occurring now or in the future which are beyond
                    the control of such Party.</span
                  >
                </p>
              </li>
              <li style="list-style-type: disc; font-size: 12px">
                <p style="text-align: justify">
                  <span style="font-size: 12px"
                    >Each Party is not responsible for any losses incurred in
                    connection with a Force Majeure Event by the other
                    Party.</span
                  >
                </p>
              </li>
            </ul>
            <p><br /></p>
            <p style="text-align: justify">
              <strong
                ><span style="font-size: 12px"
                  >18. ENTIRE AGREEMENT</span
                ></strong
              >
            </p>
            <p style="text-align: justify">
              <span style="font-size: 12px">These&nbsp;</span
              ><strong
                ><span style="font-size: 12px">Terms of Service</span></strong
              ><span style="font-size: 12px">, together with our&nbsp;</span
              ><router-link to="/privacy-policy"
                ><span style="font-size: 12px"
                  >Privacy Policy</span
                ></router-link
              ><span style="font-size: 12px"
                >, constitute the entire agreement between you and ProConnect
                with respect to your use of the App. If any provision of these
                terms is found to be invalid or unenforceable, the remaining
                provisions will remain in full force and effect.</span
              >
            </p>
            <p><br /></p>
            <p><br /></p>
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
