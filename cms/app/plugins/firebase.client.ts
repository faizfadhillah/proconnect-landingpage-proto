import { getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken } from "firebase/messaging";

export default defineNuxtPlugin(async (nuxtApp) => {
  // Ensure this plugin only runs on client-side
  if (!process.client) {
    return;
  }

  const config = useRuntimeConfig();

  const firebaseConfig = {
    apiKey: config.public.FIREBASE_API_KEY,
    authDomain: config.public.FIREBASE_AUTH_DOMAIN,
    projectId: config.public.FIREBASE_PROJECT_ID,
    storageBucket: config.public.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: config.public.FIREBASE_MESSAGING_SENDER_ID,
    appId: config.public.FIREBASE_APP_ID,
    measurementId: config.public.FIREBASE_MEASUREMENT_ID as string | undefined,
  };

  // Initialize Firebase only if it hasn't been initialized already
  const app =
    getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

  if (!app) {
    console.error("Failed to initialize Firebase app");
    return;
  }

  // Initialize Firebase services
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  let messaging: any = null;

  // Setup authentication persistence
  try {
    await setPersistence(auth, browserLocalPersistence);
    console.log("Authentication state is persisted.");
  } catch (error) {
    console.error("Error setting persistence:", error);
  }

  // Monitor authentication state
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const token = await user.getIdToken(true); // Force refresh token
      } catch (error) {
        console.error("Error refreshing user token:", error);
      }
    } else {
      console.log("User is signed out.");
    }
  });

  // Check if Firebase Messaging is supported
  if ("serviceWorker" in navigator && typeof window !== "undefined") {
    try {
      messaging = getMessaging(app);

      // Function to register the Service Worker
      const registerServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register(
            `/firebase-messaging-sw.js`,
            {
              scope: "",
            }
          );
          console.log(
            "Service Worker registered with scope:",
            registration.scope
          );
          return registration;
        } catch (error) {
          console.error("Service Worker registration failed:", error);
          throw error;
        }
      };

      // Function to request notification permission and retrieve FCM token
      const requestPermission = async () => {
        try {
          await registerServiceWorker(); // Register the Service Worker first

          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            console.log("Notification permission granted.");

            // Get FCM token
            const registration = await navigator.serviceWorker.ready;
            const token = await getToken(messaging, {
              vapidKey: config.public.FIREBASE_MESSAGING_VAPID_KEY,
              serviceWorkerRegistration: registration,
            });

            if (token) {
              const user = auth.currentUser;
              if (user) {
                const { $apiFetch } = useApi();
                await $apiFetch("/firebase/save-token", {
                  method: "POST",
                  body: JSON.stringify({ token }),
                });
              }
            } else {
              console.error("No FCM token retrieved. Ensure VAPID key is set.");
            }

            return token;
          } else {
            console.error("Notification permission denied.");
          }
        } catch (error) {
          console.error("Token retrieval failed:", error);
          throw error;
        }
      };

      // Expose the requestPermission function globally
      nuxtApp.provide("firebaseRequestPermission", requestPermission);
    } catch (error) {
      console.warn("Firebase Messaging initialization failed:", error);
      messaging = null;
    }
  } else {
    console.warn("Firebase Messaging is not supported in this environment.");
  }

  // Provide Firebase services globally
  return {
    provide: {
      firebaseApp: app,
      firebaseAuth: auth,
      firebaseFirestore: firestore,
      firebaseMessaging: messaging,
    },
  } as any;
});
