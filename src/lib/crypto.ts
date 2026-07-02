import crypto from "node:crypto";

/**
 * Cifrado simétrico para la bóveda de contraseñas del backoffice.
 * AES-256-GCM. La clave sale de `VAULT_KEY` (env de Vercel); si no está,
 * usa un "pepper" de la app (menos seguro → configura VAULT_KEY en producción).
 * Formato almacenado: base64( iv(12) | tag(16) | ciphertext ).
 */
const PEPPER = "oucy-studios-vault-pepper-v1";
const KEY = crypto
  .createHash("sha256")
  .update(process.env.VAULT_KEY || PEPPER)
  .digest();

export function vaultKeyConfigured(): boolean {
  return Boolean(process.env.VAULT_KEY && process.env.VAULT_KEY.length >= 16);
}

export function encryptSecret(plain: string): string {
  if (!plain) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptSecret(stored: string): string {
  if (!stored) return "";
  try {
    const buf = Buffer.from(stored, "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
  } catch {
    return "";
  }
}
