"use client";

import { useState } from "react";
import Link from "next/link";
<<<<<<< HEAD
import { useRouter } from "next/navigation";
=======
>>>>>>> 24315347cc5da3ab0a88e97b73a9aa50c7f5099d
import { motion, AnimatePresence } from "motion/react";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { BackButton } from "@/components/auth/back-button";
import { ProgressSteps } from "@/components/auth/progress-steps";
<<<<<<< HEAD
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { translateAuthError } from "@/lib/auth-errors";
import { TermsCheckbox } from "@/components/auth/terms-checkbox";
=======
>>>>>>> 24315347cc5da3ab0a88e97b73a9aa50c7f5099d

const stepLabels = ["Email", "Kata Sandi", "Detail Profil"];

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 24 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -24 }),
};

type FormState = {
  email: string;
  password: string;
  nama_perusahaan: string;
  npwp: string;
  alamat: string;
  telepon: string;
};

export default function DaftarIndustriPage() {
<<<<<<< HEAD
  const router = useRouter();
=======
>>>>>>> 24315347cc5da3ab0a88e97b73a9aa50c7f5099d
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
    nama_perusahaan: "",
    npwp: "",
    alamat: "",
    telepon: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "submitted">("idle");
<<<<<<< HEAD
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
=======
>>>>>>> 24315347cc5da3ab0a88e97b73a9aa50c7f5099d

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function goNext() {
    setDirection(1);
    setStep((s) => Math.min(s + 1, stepLabels.length - 1));
  }
  function goBack() {
    setDirection(-1);
<<<<<<< HEAD
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

=======
    setStep((s) => Math.max(s - 1, 0));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
>>>>>>> 24315347cc5da3ab0a88e97b73a9aa50c7f5099d
    if (step < stepLabels.length - 1) {
      goNext();
      return;
    }
<<<<<<< HEAD

    if (!agreed) {
      setError("Kamu harus menyetujui Syarat & Ketentuan dan Kebijakan Privasi dulu.");
      return;
    }

    setStatus("loading");
    try {
      // 1) Buat akun + simpan profil sekaligus di server (satu langkah,
      //    tidak bergantung sesi browser yang belum tentu ada).
      const res = await fetch("/api/daftar/industri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (!res.ok) {
        setStatus("idle");
        setError(result.error ?? "Terjadi kesalahan, coba lagi.");
        return;
      }

      // 2) Login beneran di browser supaya dapat sesi asli.
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (signInError) throw signInError;

      setStatus("submitted");
      // Belum ada dashboard khusus industri, jadi kembali ke beranda.
      router.push("/");
      router.refresh();
    } catch (err) {
      setStatus("idle");
      setError(translateAuthError(err instanceof Error ? err.message : null));
    }
=======
    setStatus("loading");
    // TODO: kirim ke API pendaftaran industri sesungguhnya, mis. POST /api/industri.
    setTimeout(() => setStatus("submitted"), 600);
>>>>>>> 24315347cc5da3ab0a88e97b73a9aa50c7f5099d
  }

  return (
    <AuthShell
      eyebrow="Pendaftaran industri"
      title="Daftar sebagai Industri"
      subtitle="Untuk pabrik dan industri sumber limbah."
      footer={
        <p className="text-sm text-ink/60 space-y-1.5">
          <span className="block">
            Sudah punya akun?{" "}
            <Link href="/masuk" className="text-green font-medium hover:underline">
              Masuk
            </Link>
          </span>
          <span className="block">
            Mau daftar sebagai mitra?{" "}
            <Link href="/daftar/mitra" className="text-green font-medium hover:underline">
              Klik di sini
            </Link>
          </span>
        </p>
      }
    >
      {status === "submitted" ? (
        <div className="text-center py-4">
<<<<<<< HEAD
          <p className="text-forest font-medium mb-1">Pendaftaran industri berhasil.</p>
          <p className="text-ink/55 text-sm">Mengalihkan ke beranda...</p>
=======
          <p className="text-forest font-medium mb-1">Pendaftaran industri terkirim.</p>
>>>>>>> 24315347cc5da3ab0a88e97b73a9aa50c7f5099d
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
                    placeholder="nama@perusahaan.com"
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
<<<<<<< HEAD
                      minLength={6}
=======
>>>>>>> 24315347cc5da3ab0a88e97b73a9aa50c7f5099d
                      required
                      autoFocus
                    />
                  </>
                )}

                {step === 2 && (
                  <>
                    <FormField
                      label="Nama perusahaan"
                      type="text"
                      value={form.nama_perusahaan}
                      onChange={(e) => update("nama_perusahaan", e.target.value)}
                      placeholder="PT / CV ..."
                      required
                      autoFocus
                    />
                    <FormField
                      label="NPWP"
                      type="text"
                      value={form.npwp}
                      onChange={(e) => update("npwp", e.target.value)}
                      placeholder="XX.XXX.XXX.X-XXX.XXX"
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
<<<<<<< HEAD
                    <TermsCheckbox checked={agreed} onChange={setAgreed} />
=======
>>>>>>> 24315347cc5da3ab0a88e97b73a9aa50c7f5099d
                  </>
                )}
              </motion.div>
            </AnimatePresence>

<<<<<<< HEAD
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3.5 py-2.5 mb-4">
                {error}
              </p>
            )}

=======
>>>>>>> 24315347cc5da3ab0a88e97b73a9aa50c7f5099d
            <div className="flex gap-3">
              {step > 0 && <BackButton onClick={goBack} />}
              <SubmitButton type="submit" disabled={status === "loading"}>
                {step < stepLabels.length - 1
                  ? "Lanjut"
                  : status === "loading"
                  ? "Memproses..."
                  : "Daftar sebagai Industri"}
              </SubmitButton>
            </div>
          </form>
        </>
      )}
    </AuthShell>
  );
}
