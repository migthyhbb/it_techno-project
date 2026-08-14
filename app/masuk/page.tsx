"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { BackButton } from "@/components/auth/back-button";
import { ProgressSteps } from "@/components/auth/progress-steps";

const stepLabels = ["Email", "Kata Sandi"];

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 24 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -24 }),
};

export default function MasukPage() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "submitted">("idle");

  function goNext() {
    setDirection(1);
    setStep((s) => Math.min(s + 1, stepLabels.length - 1));
  }
  function goBack() {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step < stepLabels.length - 1) {
      goNext();
      return;
    }
    setStatus("loading");
    // TODO: sambungkan ke provider auth sesungguhnya (mis. NextAuth, Supabase Auth).
    setTimeout(() => setStatus("submitted"), 600);
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
          <p className="text-forest font-medium mb-1">Permintaan masuk terkirim.</p>
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
