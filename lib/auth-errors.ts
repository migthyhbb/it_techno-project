const errorMap: [string, string][] = [
  ["User already registered", "Email ini sudah terdaftar. Coba masuk, atau pakai email lain."],
  ["already been registered", "Email ini sudah terdaftar. Coba masuk, atau pakai email lain."],
  ["Invalid login credentials", "Email atau kata sandi salah."],
  ["Email not confirmed", "Email belum dikonfirmasi. Cek kotak masuk email kamu."],
  ["Password should be at least", "Kata sandi minimal 6 karakter."],
  ["Unable to validate email address", "Format email tidak valid."],
  ["rate limit", "Terlalu banyak percobaan. Coba lagi beberapa saat lagi."],
];

/**
 * Supabase mengembalikan pesan error dalam bahasa Inggris. Fungsi ini
 * menerjemahkan pesan yang umum terjadi ke Bahasa Indonesia; pesan yang
 * tidak dikenali jatuh ke pesan generik (bukan ditampilkan mentah-mentah).
 */
export function translateAuthError(message: string | undefined | null): string {
  if (!message) return "Terjadi kesalahan, coba lagi.";
  const found = errorMap.find(([needle]) =>
    message.toLowerCase().includes(needle.toLowerCase())
  );
  return found ? found[1] : "Terjadi kesalahan, coba lagi.";
}
