import { defineStore } from "pinia";
import Cookies from "js-cookie";
import { encryptData, decryptData } from "~/utils/crypto";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: null,
  }),
  actions: {
    setToken(token) {
      this.token = token;
      const encryptedToken = encryptData(token);
      Cookies.set("token", encryptedToken, { expires: 7 }); // Set cookie with expiration of 7 days
    },
    loadToken() {
      const encryptedToken = Cookies.get("token");
      if (encryptedToken) {
        this.token = decryptData(encryptedToken);
      } else {
        this.token = null;
      }
    },
    clearToken() {
      this.token = null;
      Cookies.remove("token");
    },
    isAuthenticated() {
      return this.token !== null; // Return true if token is present
    },
  },
});
