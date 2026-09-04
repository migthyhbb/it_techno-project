
export function isValidPhone(value: string): boolean {
  const cleaned = value.replace(/[\s-]/g, "");
  return /^(?:\+62|62|0)8[1-9][0-9]{6,10}$/.test(cleaned);
}

export function isValidNikNib(value: string): boolean {
  const cleaned = value.replace(/\D/g, "");
  return cleaned.length === 16 || cleaned.length === 13;
}

export function isValidNpwp(value: string): boolean {
  const cleaned = value.replace(/\D/g, "");
  return cleaned.length === 15 || cleaned.length === 16;
}

export function isValidAddress(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 15 && trimmed.split(/\s+/).length >= 3;
}

export interface PasswordRule {
  key: "length" | "uppercase" | "lowercase" | "number" | "symbol";
  label: string;
  test: (value: string) => boolean;
}

export const passwordRules: PasswordRule[] = [
  {
    key: "length",
    label: "Minimal 8 karakter",
    test: (v) => v.length >= 8,
  },
  {
    key: "uppercase",
    label: "Mengandung huruf besar (A-Z)",
    test: (v) => /[A-Z]/.test(v),
  },
  {
    key: "lowercase",
    label: "Mengandung huruf kecil (a-z)",
    test: (v) => /[a-z]/.test(v),
  },
  {
    key: "number",
    label: "Mengandung angka (0-9)",
    test: (v) => /[0-9]/.test(v),
  },
  {
    key: "symbol",
    label: "Mengandung simbol (mis. !@#$%)",
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
];

export function isValidPassword(value: string): boolean {
  return passwordRules.every((rule) => rule.test(value));
}

export const validationMessages = {
  phone: "Nomor telepon tidak valid. Contoh: 081200000000.",
  nikNib: "NIK harus 16 digit atau NIB 13 digit angka.",
  npwp: "NPWP harus 15 atau 16 digit angka.",
  address: "Alamat lengkap minimal 15 karakter dan 3 kata (jalan, kota, provinsi).",
  password: "Kata sandi belum memenuhi semua syarat di atas.",
};
