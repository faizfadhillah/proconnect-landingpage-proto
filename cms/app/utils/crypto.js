import CryptoJS from "crypto-js";

const secretKey = "your-secret-key"; // Use a secure, random key in a real application

export function encryptData(data) {
  return CryptoJS.AES.encrypt(data, secretKey).toString();
}

export function decryptData(data) {
  const bytes = CryptoJS.AES.decrypt(data, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}
