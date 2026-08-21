"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { BackButton } from "@/components/auth/back-button";
import { ProgressSteps } from "@/components/auth/progress-steps";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { translateAuthError } from "@/lib/auth-errors";
import { TermsCheckbox } from "@/components/auth/terms-checkbox";

const stepLabels = ["Email", "Kata Sandi", "Detail Profil"];

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 24 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -24 }),
};

// 1) Diubah jadi nik
type FormState = {
  email: string;
  password: string;
  nama_mitra: string;
  nik: string; 
  alamat: string;
  telepon: string;
};

export default function DaftarMitraPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
    nama_mitra: "",
    nik: "", // 2) Diubah jadi nik
    alamat: "",
    telepon: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "submitted">("idle");
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function goNext() {
    setDirection(1);
    setStep((s) => Math.min(s + 1, stepLabels.length - 1));
  }
  
  function goBack() {
    setDirection(-1);
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (step < stepLabels.length - 1) {
      goNext();
      return;
    }

    if (!agreed) {
      setError("Kamu harus menyetujui Syarat & Ketentuan dan Kebijakan Privasi dulu.");
      return;
    }

    setStatus("loading");
    try {
      // 1) Buat akun + simpan profil sekaligus di server
      const res = await fetch("/api/registrasi_agen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          namaAgen: form.nama_mitra,
          nik: form.nik,              // 3) Mengirim dengan key "nik" ke backend
          alamatLengkap: form.alamat,
          noTelepon: form.telepon
        }),
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        setStatus("idle");
        setError(result.error ?? "Terjadi kesalahan, coba lagi.");
        return;
      }

      // 2) Login beneran di browser supaya dapat sesi asli, baru redirect.
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      
      if (signInError) throw signInError;

      setStatus("submitted");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setStatus("idle");
      setError(translateAuthError(err instanceof Error ? err.message : null));
    }
  }

  return (
    <AuthShell
      eyebrow="Pendaftaran mitra"
      title="Daftar sebagai Mitra"
      subtitle="Untuk agen dan distributor energi LENTERA."
      footer={
        <p className="text-sm text-ink/60 space-y-1.5">
          <span className="block">
            Sudah punya akun?{" "}
            <Link href="/masuk" className="text-green font-medium hover:underline">
              Masuk
            </Link>
          </span>
          <span className="block">
            Mau daftar sebagai industri?{" "}
            <Link href="/daftar/industri" className="text-green font-medium hover:underline">
              Klik di sini
            </Link>
          </span>
        </p>
      }
    >
      {status === "submitted" ? (
        <div className="text-center py-4">
          <p className="text-forest font-medium mb-1">Pendaftaran mitra berhasil.</p>
          <p className="text-ink/55 text-sm">Mengalihkan ke dashboard...</p>
        </div>
      ) : (
        <>
          <ProgressSteps steps={stepLabels} current={step} />
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={step}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {step === 0 && (
                  <FormField
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="nama@email.com"
                    required
                    autoFocus
                  />
                )}

                {step === 1 && (
                  <>
                    <p className="text-sm text-ink/55 mb-4">
                      Untuk{" "}
                      <span className="text-forest font-medium">{form.email}</span>{" "}
                      ·{" "}
                      <button type="button" onClick={goBack} className="text-green hover:underline">
                        ganti
                      </button>
                    </p>
                    <FormField
                      label="Kata sandi"
                      type="password"
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                      placeholder="••••••••"
                      minLength={6}
                      required
                      autoFocus
                    />
                  </>
                )}

                {step === 2 && (
                  <>
                    <FormField
                      label="Nama mitra"
                      type="text"
                      value={form.nama_mitra}
                      onChange={(e) => update("nama_mitra", e.target.value)}
                      placeholder="Nama perorangan / usaha"
                      required
                      autoFocus
                    />
                    <FormField
                      label="NIK / NIB"
                      type="text"
                      value={form.nik} // 4) Diubah jadi nik
                      onChange={(e) => update("nik", e.target.value)} // 5) Diubah jadi nik
                      placeholder="Nomor NIK atau NIB"
                      required
                    />
                    <FormField
                      label="Alamat lengkap"
                      type="text"
                      value={form.alamat}
                      onChange={(e) => update("alamat", e.target.value)}
                      placeholder="Jalan, kota, provinsi"
                      required
                    />
                    <FormField
                      label="Nomor telepon"
                      type="tel"
                      value={form.telepon}
                      onChange={(e) => update("telepon", e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      required
                    />
                    <TermsCheckbox checked={agreed} onChange={setAgreed} />
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3.5 py-2.5 mb-4">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              {step > 0 && <BackButton onClick={goBack} />}
              <SubmitButton type="submit" disabled={status === "loading"}>
                {step < stepLabels.length - 1
                  ? "Lanjut"
                  : status === "loading"
                  ? "Memproses..."
                  : "Daftar sebagai Mitra"}
              </SubmitButton>
            </div>
          </form>
        </>
      )}
    </AuthShell>
  );
}