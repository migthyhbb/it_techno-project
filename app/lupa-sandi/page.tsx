"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { PasswordRequirements } from "@/components/auth/password-requirements";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { isValidPassword, validationMessages } from "@/lib/validation";

export default function LupaSandiPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [status, setStatus] = useState<"idle" | "loading" | "submitted">("idle");
  const [error, setError] = useState<string | null>(null);
  async function handleSendOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setStatus("loading");

    try {
      const supabase = createSupabaseBrowserClient();

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (otpError) throw otpError;

      setStatus("idle");
      setStep(2);
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Gagal mengirimkan kode OTP");
    }
  }
  async function handleVerifyOtpAndReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!isValidPassword(newPassword)) {
      setError(validationMessages.password);
      return;
    }

    setStatus("loading");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });

      if (verifyError) throw verifyError;
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setStatus("submitted");
      setTimeout(() => {
        router.push("/masuk");
      }, 2000);
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Kode OTP tidak valid atau kadaluarsa");
    }
  }

  return (
    <AuthShell
      eyebrow="Lupa Kata Sandi"
      title={step === 1 ? "Atur Ulang Kata Sandi" : "Masukkan Kode OTP"}
      subtitle={
        step === 1
          ? "Masukkan email akun LENTERA Anda untuk menerima kode OTP."
          : `Kode OTP telah dikirim ke ${email}. Masukkan kode dan kata sandi baru Anda.`
      }
      footer={
        <p className="text-sm text-ink/60">
          Sudah ingat kata sandi?{" "}
          <Link href="/masuk" className="text-green font-medium hover:underline">
            Masuk kembali
          </Link>
        </p>
      }
    >
      {status === "submitted" ? (
        <div className="text-center py-4">
          <p className="text-forest font-medium mb-1">Kata sandi berhasil diperbarui!</p>
          <p className="text-ink/55 text-sm">Mengalihkan ke halaman masuk...</p>
        </div>
      ) : step === 1 ? (
        /* FORM TAHAP 1 */
        <form onSubmit={handleSendOtp}>
          <FormField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@perusahaan.com"
            required
            autoFocus
          />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3.5 py-2.5 mb-4">
              {error}
            </p>
          )}

          <SubmitButton type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Mengirim OTP..." : "Kirim Kode OTP"}
          </SubmitButton>
        </form>
      ) : (
        /* FORM TAHAP 2 */
        <form onSubmit={handleVerifyOtpAndReset}>
          <FormField
            label="Kode OTP (6 Angka)"
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="123456"
            required
            autoFocus
          />

          <div className="mb-4">
            <FormField
              label="Kata Sandi Baru"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <PasswordRequirements value={newPassword} />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3.5 py-2.5 mb-4">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3">
            <SubmitButton type="submit" disabled={status === "loading"}>
              {status === "loading" ? "Memproses..." : "Simpan Kata Sandi Baru"}
            </SubmitButton>

            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep(1);
              }}
              className="text-xs text-ink/50 hover:text-forest transition-colors text-center"
            >
              ← Ubah Email
            </button>
          </div>
        </form>
      )}
    </AuthShell>
  );
}