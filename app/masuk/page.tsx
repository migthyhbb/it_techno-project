"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { translateAuthError } from "@/lib/auth-errors";

export default function MasukPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "submitted">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const clearSessionOnLoad = async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        await supabase.auth.signOut();
      }
    };

    clearSessionOnLoad();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setStatus("loading");

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      const user = data.user;
      if (!user) throw new Error("Gagal mengambil data pengguna.");

      // 1. Cek apakah user berada di daftar hitam (blacklists)
      const { data: blacklisted } = await supabase
        .from("blacklists")
        .select("alasan")
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .maybeSingle();

      if (blacklisted) {
        await supabase.auth.signOut();
        setStatus("idle");
        setError(
          `Akun Anda ditangguhkan/di-ban! Alasan: ${
            blacklisted.alasan || "Pelanggaran ketentuan layanan."
          }`
        );
        return;
      }

      // 2. Cek Peran: Admin (Hanya query user_id sesuai struktur tabel admin_profiles)
      const { data: adminRow } = await supabase
        .from("admin_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminRow) {
        setStatus("submitted");
        router.replace("/dashboard-admin");
        router.refresh();
        return;
      }

      // 3. Cek Peran: Mitra
      const { data: mitraRow } = await supabase
        .from("mitra_profiles")
        .select("user_id, status_akun, alasan_ban")
        .eq("user_id", user.id)
        .maybeSingle();

      if (mitraRow) {
        if (mitraRow.status_akun === "banned") {
          await supabase.auth.signOut();
          setStatus("idle");
          setError(
            `Akun Mitra Anda di-ban! Alasan: ${
              mitraRow.alasan_ban || "Pelanggaran layanan."
            }`
          );
          return;
        }
        setStatus("submitted");
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      // 4. Cek Peran: Industri
      const { data: industriRow } = await supabase
        .from("industri_profiles")
        .select("user_id, status_akun, alasan_ban")
        .eq("user_id", user.id)
        .maybeSingle();

      if (industriRow) {
        if (industriRow.status_akun === "banned") {
          await supabase.auth.signOut();
          setStatus("idle");
          setError(
            `Akun Industri Anda di-ban! Alasan: ${
              industriRow.alasan_ban || "Pelanggaran layanan."
            }`
          );
          return;
        }
        setStatus("submitted");
        router.replace("/dashboard-industri");
        router.refresh();
        return;
      }

      // 5. Jika akun terdaftar di Auth Supabase tetapi belum punya profil
      setStatus("submitted");
      router.replace("/daftar");
      router.refresh();
    } catch (err: unknown) {
      setStatus("idle");
      const errorMessage = err instanceof Error ? err.message : null;
      setError(translateAuthError(errorMessage));
    }
  }

  return (
    <AuthShell
      eyebrow="Selamat datang kembali"
      title="Masuk ke akun LENTERA"
      subtitle="Kelola jadwal pengumpulan, status pengolahan, dan penyaluran energi Anda."
      footer={
        <p className="text-sm text-ink/60">
          Belum punya akun?{" "}
          <Link href="/daftar" className="text-green font-medium hover:underline">
            Daftar sekarang
          </Link>
        </p>
      }
    >
      {status === "submitted" ? (
        <div className="text-center py-4">
          <p className="text-forest font-medium mb-1">Berhasil masuk.</p>
          <p className="text-ink/55 text-sm">Mengalihkan...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <FormField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@perusahaan.com"
            required
            autoFocus
          />
          <FormField
            label="Kata sandi"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <div className="flex justify-end mb-5">
            <a
              href="/lupa-sandi"
              className="text-xs text-ink/50 hover:text-forest transition-colors"
            >
              Lupa kata sandi?
            </a>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3.5 py-2.5 mb-4">
              {error}
            </p>
          )}

          <SubmitButton type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Memproses..." : "Masuk"}
          </SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}