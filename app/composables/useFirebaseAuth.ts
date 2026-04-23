import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCustomToken,
  GithubAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  type AuthProvider,
  type User,
  onAuthStateChanged,
  getAuth,
} from "firebase/auth";

export default function () {
  const { $firebaseAuth } = useNuxtApp();
  const authStore = useAuthStore();
  const user = useState<User | null | any>("firebaseUser", () => null);

  const providers = {
    google: new GoogleAuthProvider(),
    facebook: new FacebookAuthProvider(),
    github: new GithubAuthProvider(),
    apple: new OAuthProvider("apple.com"),
  };

  interface IResponse {
    message: string | null;
    error: string | null;
  }

  const mapFirebaseError = (errorCode: string) => {
    const errorMessages: Record<string, string> = {
      "auth/app-deleted": "The authentication service is no longer available.",
      "auth/app-not-authorized":
        "The app is not authorized to use Firebase Authentication.",
      "auth/argument-error":
        "Invalid argument provided. Please check your input.",
      "auth/invalid-api-key":
        "Invalid API key. Please check your Firebase configuration.",
      "auth/invalid-user-token": "Invalid user token. Please re-authenticate.",
      "auth/network-request-failed":
        "Network error. Please check your internet connection.",
      "auth/operation-not-allowed":
        "This authentication method is not enabled. Contact support.",
      "auth/requires-recent-login":
        "Your session has expired. Please log in again.",
      "auth/too-many-requests":
        "Too many failed attempts. Please try again later.",
      "auth/unauthorized-domain":
        "The app is not authorized to use Firebase authentication.",
      "auth/user-disabled": "This user account has been disabled.",
      "auth/user-token-expired":
        "Your session has expired. Please log in again.",
      "auth/web-storage-unsupported":
        "Web storage is not supported or disabled in this browser.",

      // User-related errors
      "auth/email-already-in-use":
        "This email is already registered. Please use a different one.",
      "auth/invalid-email": "Invalid email format. Please enter a valid email.",
      "auth/user-not-found":
        "No account found with this email. Please register first.",
      "auth/wrong-password": "Incorrect password. Please try again.",
      "auth/weak-password":
        "Weak password. Use at least 6 characters with a mix of letters and numbers.",

      // Provider errors
      "auth/popup-closed-by-user":
        "The sign-in popup was closed before completing the process.",
      "auth/cancelled-popup-request":
        "Another sign-in popup request was canceled.",

      // Token errors
      "auth/invalid-credential":
        "Invalid credentials. Please check your email and password.",
      "auth/invalid-verification-code":
        "Invalid verification code. Please check and try again.",
      "auth/invalid-verification-id":
        "Invalid verification ID. Please request a new one.",

      // Custom Token errors
      "auth/invalid-custom-token":
        "The custom token format is incorrect. Please check again.",
      "auth/custom-token-mismatch":
        "The custom token does not match the expected format.",

      default: "An unknown error occurred. Please try again later.",
    };

    return errorMessages[errorCode] || errorMessages.default;
  };

  const registerUser = async (email: string, password: string) => {
    try {
      const userCreds = await createUserWithEmailAndPassword(
        $firebaseAuth,
        email,
        password
      );
      if (userCreds) {
        user.value = userCreds.user;
        const token = await userCreds.user.getIdToken();
        authStore.setToken(token);
        return {
          user: user.value,
          message: "Account successfully created!",
          error: null,
        };
      }
    } catch (error: any) {
      console.error("Firebase Error:", error);
      return {
        message: null,
        error: mapFirebaseError(error.code),
      };
    }
  };

  const signinUser = async (email: string, password: string) => {
    try {
      const userCreds = await signInWithEmailAndPassword(
        $firebaseAuth,
        email,
        password
      );
      if (userCreds) {
        user.value = userCreds.user;
        const token = await userCreds.user.getIdToken();
        authStore.setToken(token);
        return {
          user: user.value,
          message: "Successfully logged in!",
          error: null,
        };
      }
    } catch (error: any) {
      console.error("Firebase Error:", error);
      return {
        message: null,
        error: mapFirebaseError(error.code),
      };
    }
  };

  const signinWithCustomToken = async (token: string) => {
    try {
      const userCreds = await signInWithCustomToken($firebaseAuth, token);
      if (userCreds) {
        user.value = userCreds.user;
        const idToken = await userCreds.user.getIdToken();
        authStore.setToken(idToken);
        return {
          user: user.value,
          message: "Successfully logged in with token!",
          error: null,
        };
      }
    } catch (error: any) {
      console.error("Firebase Error:", error);
      return {
        message: null,
        error: mapFirebaseError(error.code),
      };
    }
  };

  const signinWith = async (provider: string) => {
    const selectedProvider = useState<AuthProvider | null>(
      "selectedProvider",
      () => null
    );

    switch (provider) {
      case "google":
        providers.google.setCustomParameters({ prompt: "select_account" });
        selectedProvider.value = providers.google;
        break;
      case "facebook":
        selectedProvider.value = providers.facebook;
        break;
      case "github":
        selectedProvider.value = providers.github;
        break;
      case "apple":
        providers.apple.addScope("email");
        providers.apple.addScope("name");
        selectedProvider.value = providers.apple;
        break;
      default:
        return {
          message: null,
          error: "Authentication provider is not recognized.",
        };
    }

    try {
      const userCreds = await signInWithPopup(
        $firebaseAuth,
        selectedProvider.value
      );
      if (userCreds) {
        user.value = userCreds.user;
        const token = await userCreds.user.getIdToken();
        authStore.setToken(token);
        return {
          user: user.value,
          message: `Successfully signed in with ${provider}!`,
          error: null,
        };
      }
    } catch (error: any) {
      console.error("Firebase Error:", error);
      return {
        message: null,
        error: mapFirebaseError(error.code),
      };
    }
  };

  const signOutUser = async () => {
    try {
      await signOut($firebaseAuth);
      user.value = null;
      authStore.clearToken();
      return {
        message: "Successfully signed out!",
        error: null,
      };
    } catch (error: any) {
      console.error("Firebase Error:", error);
      return {
        message: null,
        error: mapFirebaseError(error.code),
      };
    }
  };

  // Constructor-like initialization
  const initialize = async () => {
    if (process.client) {
      const firebaseAuth = await getAuth();
      user.value = firebaseAuth.currentUser;
      if (user.value) {
        const token = await user.value.getIdToken();
        authStore.setToken(token);
      }

      onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
        user.value = firebaseUser;
        if (firebaseUser) {
          const token = await firebaseUser.getIdToken(true); // Force refresh
          authStore.setToken(token);
        } else {
          authStore.clearToken();
        }
      });
      return user.value;
    }
  };

  initialize();

  return {
    registerUser,
    signinUser,
    signinWithCustomToken,
    signinWith,
    user,
    signOutUser,
    initialize,
  };
}
