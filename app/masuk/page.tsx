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
=======
>>>>>>> 24315347cc5da3ab0a88e97b73a9aa50c7f5099d

const stepLabels = ["Email", "Kata Sandi"];

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 24 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -24 }),
};

export default function MasukPage() {
<<<<<<< HEAD
  const router = useRouter();
=======
>>>>>>> 24315347cc5da3ab0a88e97b73a9aa50c7f5099d
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "submitted">("idle");
<<<<<<< HEAD
  const [error, setError] = useState<string | null>(null);
=======
>>>>>>> 24315347cc5da3ab0a88e97b73a9aa50c7f5099d

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

    setStatus("loading");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;

      setStatus("submitted");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setStatus("idle");
      setError(translateAuthError(err instanceof Error ? err.message : null));
    }
=======
    setStatus("loading");
    // TODO: sambungkan ke provider auth sesungguhnya (mis. NextAuth, Supabase Auth).
    setTimeout(() => setStatus("submitted"), 600);
>>>>>>> 24315347cc5da3ab0a88e97b73a9aa50c7f5099d
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
<<<<<<< HEAD
          <p className="text-forest font-medium mb-1">Berhasil masuk.</p>
          <p className="text-ink/55 text-sm">Mengalihkan ke dashboard...</p>
=======
          <p className="text-forest font-medium mb-1">Permintaan masuk terkirim.</p>
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@perusahaan.com"
                    required
                    autoFocus
                  />
                )}
                {step === 1 && (
                  <>
                    <p className="text-sm text-ink/55 mb-4">
                      Masuk sebagai{" "}
                      <span className="text-forest font-medium">{email}</span>{" "}
                      ·{" "}
                      <button
                        type="button"
                        onClick={goBack}
                        className="text-green hover:underline"
                      >
                        ganti
                      </button>
                    </p>
                    <FormField
                      label="Kata sandi"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoFocus
                    />
                    <div className="flex justify-end mb-2">
                      <a href="#" className="text-xs text-ink/50 hover:text-forest transition-colors">
                        Lupa kata sandi?
                      </a>
                    </div>
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
                  : "Masuk"}
              </SubmitButton>
            </div>
          </form>
        </>
      )}
    </AuthShell>
  );
}
