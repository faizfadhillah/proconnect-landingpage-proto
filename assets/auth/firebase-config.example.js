// ============================================================
// ProConnect — Firebase Web Config (EXAMPLE / TEMPLATE)
// ============================================================
// This file is a template. To activate real login/signup on
// login.html and signup.html:
//
//   1) Copy this file to:  assets/auth/firebase-config.js
//   2) Paste the values from your Firebase Console:
//      Console → Project settings → General → Your apps → Web SDK snippet
//      (These are the SAME values the /cms Nuxt app uses via its
//       NUXT_PUBLIC_FIREBASE_* env vars — see /cms/nuxt.config.ts
//       and /cms/app/plugins/firebase.client.ts)
//   3) In the Firebase Console:
//      - Enable Authentication → Sign-in method → Email/Password
//      - Enable Google provider (use the same OAuth client as the CMS)
//      - Enable Phone (for OTP on signup)
//      - Add your Netlify domain to "Authorized domains":
//          proconnect-landingpage-proto.netlify.app
//          (and your custom domain, e.g. proconnectcareer.com)
//
// The values below are PUBLIC — Firebase config is safe to ship
// in client code. Security is enforced by Firebase Security Rules
// and the CMS backend token checks, not by hiding these keys.
// ============================================================

window.PC_FIREBASE_CONFIG = {
  apiKey:            "REPLACE_WITH_NUXT_PUBLIC_FIREBASE_API_KEY",
  authDomain:        "REPLACE_WITH_NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN",       // e.g. proconnect-xxx.firebaseapp.com
  projectId:         "REPLACE_WITH_NUXT_PUBLIC_FIREBASE_PROJECT_ID",        // e.g. proconnect-xxx
  storageBucket:     "REPLACE_WITH_NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET",    // e.g. proconnect-xxx.appspot.com
  messagingSenderId: "REPLACE_WITH_NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  appId:             "REPLACE_WITH_NUXT_PUBLIC_FIREBASE_APP_ID",
  measurementId:     "REPLACE_WITH_NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID"     // optional
};
