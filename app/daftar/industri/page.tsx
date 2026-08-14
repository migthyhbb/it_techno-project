"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { BackButton } from "@/components/auth/back-button";
import { ProgressSteps } from "@/components/auth/progress-steps";

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

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

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
    // TODO: kirim ke API pendaftaran industri sesungguhnya, mis. POST /api/industri.
    setTimeout(() => setStatus("submitted"), 600);
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
          <p className="text-forest font-medium mb-1">Pendaftaran industri terkirim.</p>
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
                  : "Daftar sebagai Industri"}
              </SubmitButton>
            </div>
          </form>
        </>
      )}
    </AuthShell>
  );
}
