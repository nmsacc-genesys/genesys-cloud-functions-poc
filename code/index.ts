import crypto from "crypto";

const ALGORITHM = "aes-256-gcm" as const;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

type Mode = "encrypt" | "decrypt";

interface HandlerEvent {
  mode: Mode;
  text: string;
  passphrase: string;
}

interface HandlerResponse {
  result: string;
}

function deriveKey(passphrase: string): Buffer {
  return crypto.scryptSync(passphrase, "genesys-cloud-salt", 32);
}

function encryptText(plaintext: string, passphrase: string): string {
  const key = deriveKey(passphrase);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();

  return iv.toString("hex") + tag.toString("hex") + encrypted;
}

function decryptText(ciphertext: string, passphrase: string): string {
  const key = deriveKey(passphrase);
  const iv = Buffer.from(ciphertext.slice(0, IV_LENGTH * 2), "hex");
  const tag = Buffer.from(ciphertext.slice(IV_LENGTH * 2, IV_LENGTH * 2 + TAG_LENGTH * 2), "hex");
  const encrypted = ciphertext.slice(IV_LENGTH * 2 + TAG_LENGTH * 2);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export const handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  const { mode, text, passphrase } = event;

  if (!text || !passphrase) {
    throw new Error("Both 'text' and 'passphrase' are required");
  }

  if (mode === "encrypt") {
    return { result: encryptText(text, passphrase) };
  } else if (mode === "decrypt") {
    return { result: decryptText(text, passphrase) };
  }

  throw new Error("Mode must be 'encrypt' or 'decrypt'");
};
