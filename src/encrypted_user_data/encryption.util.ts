import * as crypto from "crypto";
import * as dotenv from "dotenv";

dotenv.config();

const algorithm = "aes-256-cbc";
const key = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");
const iv = Buffer.from(process.env.ENCRYPTION_IV!, "hex");

export function encrypt(text: string): string {
  if (!text) return text;
  try {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    return text; // Return original text if encryption fails
  }
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return encryptedText;
  try {
    const textParts = encryptedText.split(":");
    const iv = Buffer.from(textParts.shift()!, "hex");
    const encryptedTextHex = textParts.join(":");
    const decipher = crypto.createDecipheriv(algorithm, key, iv);

    let decrypted = decipher.update(encryptedTextHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedText; // Return original text if decryption fails
  }
}
