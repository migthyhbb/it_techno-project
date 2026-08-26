"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormField } from "@/components/auth/form-field";
import { OtpField } from "@/components/auth/otp-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { BackButton } from "@/components/auth/back-button";
import { ProgressSteps } from "@/components/auth/progress-steps";
import { TermsCheckbox } from "@/components/auth/terms-checkbox";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { translateAuthError } from "@/lib/auth-errors";
import {
  isValidNikNib,
  isValidAddress,
  isValidPhone,
  isValidPassword,
  validationMessages,
} from "@/lib/validation";
import { PasswordRequirements } from "@/components/auth/password-requirements";

const stepLabels = ["Email", "Verifikasi Email", "Kata Sandi", "Detail Profil"];

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 24 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -24 }),
};

type FormState = {
  email: string;
  otp: string;
  password: string;
  nama_mitra: string;
  nik_nib: string;
  provinsi: string;
  kota: string;
  detail_alamat: string;
  telepon: string;
  foto_nik: File | null;
};

type FieldErrors = Partial<Record<"nama_mitra" | "nik_nib" | "provinsi" | "kota" | "detail_alamat" | "telepon" | "foto_nik", string>>;

export default function DaftarMitraPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<FormState>({
    email: "", otp: "", password: "", nama_mitra: "", nik_nib: "", provinsi: "", kota: "", detail_alamat: "", telepon: "", foto_nik: null,
  });
  
  const [status, setStatus] = useState<"idle" | "loading" | "submitted">("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [agreed, setAgreed] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [provinces, setProvinces] = useState<{id: string, name: string}[]>([]);
  const [cities, setCities] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json")
      .then((res) => res.json())
      .then((data) => setProvinces(data))
      .catch((err) => console.error("Gagal load provinsi:", err));
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const handleProvinsiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provId = e.target.value;
    const provName = e.target.options[e.target.selectedIndex].text;
    
    update("provinsi", provName);
    update("kota", "");
    
    if (provId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provId}.json`)
        .then((res) => res.json())
        .then((data) => setCities(data))
        .catch((err) => console.error("Gagal load kota:", err));
    } else {
      setCities([]);
    }
  };

  function goNext() {
    setDirection(1);
    setStep((s) => Math.min(s + 1, stepLabels.length - 1));
  }
  function goBack() {
    setDirection(-1);
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function sendOtp() {
    const supabase = createSupabaseBrowserClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: form.email,
      options: { shouldCreateUser: true },
    });
    if (otpError) throw otpError;
    setResendCooldown(30);
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setError(null);
    setStatus("loading");
    try {
      await sendOtp();
    } catch (err) {
      setError(translateAuthError(err instanceof Error ? err.message : null));
    } finally {
      setStatus("idle");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (step === 0) {
      setStatus("loading");
      try {
        await sendOtp();
        setStatus("idle");
        goNext();
      } catch (err) {
        setStatus("idle");
        setError(translateAuthError(err instanceof Error ? err.message : null));
      }
      return;
    }

    if (step === 1) {
      if (form.otp.length !== 6) {
        setError("Masukkan 6 digit kode verifikasi.");
        return;
      }
      setStatus("loading");
      try {
        const supabase = createSupabaseBrowserClient();
        const { error: verifyError } = await supabase.auth.verifyOtp({
          email: form.email, token: form.otp, type: "email",
        });
        if (verifyError) throw verifyError;
        setStatus("idle");
        goNext();
      } catch {
        setStatus("idle");
        setError("Kode salah atau sudah kedaluwarsa. Coba lagi atau kirim ulang kode.");
      }
      return;
    }

    if (step === 2) {
      if (!isValidPassword(form.password)) {
        setError(validationMessages.password);
        return;
      }
      setStatus("loading");
      try {
        const supabase = createSupabaseBrowserClient();
        const { error: updateError } = await supabase.auth.updateUser({
          password: form.password,
        });
        if (updateError) throw updateError;
        setStatus("idle");
        goNext();
      } catch (err) {
        setStatus("idle");
        setError(translateAuthError(err instanceof Error ? err.message : null));
      }
      return;
    }

    const errors: FieldErrors = {};
    if (!form.nama_mitra.trim()) errors.nama_mitra = "Nama mitra wajib diisi.";
    if (!isValidNikNib(form.nik_nib)) errors.nik_nib = validationMessages.nikNib;
    if (!form.foto_nik) errors.foto_nik = "Foto NIK/NPWP wajib diupload.";
    if (!form.provinsi) errors.provinsi = "Provinsi wajib dipilih.";
    if (!form.kota) errors.kota = "Kota/Kabupaten wajib dipilih.";
    if (!form.detail_alamat.trim()) errors.detail_alamat = "Detail alamat wajib diisi.";
    
    const alamatLengkap = `${form.detail_alamat}, ${form.kota}, ${form.provinsi}`;
    if (form.provinsi && form.kota && form.detail_alamat && !isValidAddress(alamatLengkap)) {
      errors.detail_alamat = validationMessages.address;
    }

    if (!isValidPhone(form.telepon)) errors.telepon = validationMessages.phone;
    
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (!agreed) {
      setError("Kamu harus menyetujui Syarat & Ketentuan dan Kebijakan Privasi dulu.");
      return;
    }

    setStatus("loading");
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? (await supabase.auth.getUser()).data.user;

      if (!user) throw new Error("no-session");

      let fotoUrl = "";
      if (form.foto_nik) {
        const fileExt = form.foto_nik.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('mitra_documents').upload(`nik/${fileName}`, form.foto_nik);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('mitra_documents').getPublicUrl(`nik/${fileName}`);
        fotoUrl = publicUrlData.publicUrl;
      }

      const { error: profileError } = await supabase.from("mitra_profiles").upsert({
        user_id: user.id,
        nama_mitra: form.nama_mitra,
        nik_nib: form.nik_nib,
        alamat: alamatLengkap,
        telepon: form.telepon,
        foto_nik_url: fotoUrl, 
      }, { onConflict: 'user_id' });

      if (profileError) throw profileError;

      setStatus("submitted");
      // Menggunakan hard redirect agar sesi terbaca sempurna oleh middleware Next.js
      window.location.href = "/dashboard";
      
    } catch (err) {
      setStatus("idle");
      if (err instanceof Error && err.message === "no-session") {
        setError("Sesi kamu berakhir. Silakan login kembali.");
      } else if (err && typeof err === "object" && "message" in err) {
        setError((err as { message: string }).message);
      } else {
        setError("Gagal menyimpan data profil, coba lagi.");
      }
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
            <Link href="/masuk" className="text-green font-medium hover:underline">Masuk</Link>
          </span>
          <span className="block">
            Mau daftar sebagai industri?{" "}
            <Link href="/daftar/industri" className="text-green font-medium hover:underline">Klik di sini</Link>
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
                key={step} custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {step === 0 && (
                  <FormField label="Email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="nama@email.com" required autoFocus />
                )}

                {step === 1 && (
                  <>
                    <p className="text-sm text-ink/55 mb-4">
                      Kode dikirim ke <span className="text-forest font-medium">{form.email}</span> · <button type="button" onClick={goBack} className="text-green hover:underline">ganti</button>
                    </p>
                    <OtpField value={form.otp} onChange={(v) => update("otp", v)} />
                    <button type="button" onClick={handleResend} disabled={resendCooldown > 0 || status === "loading"} className="text-xs text-green hover:underline disabled:text-ink/35 mb-2">
                      {resendCooldown > 0 ? `Kirim ulang kode (${resendCooldown}s)` : "Kirim ulang kode"}
                    </button>
                  </>
                )}

                {step === 2 && (
                  <>
                    <FormField label="Kata sandi" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="••••••••" required autoFocus />
                    <PasswordRequirements value={form.password} />
                  </>
                )}

                {step === 3 && (
                  <>
                    <FormField label="Nama mitra" type="text" value={form.nama_mitra} onChange={(e) => update("nama_mitra", e.target.value)} placeholder="Nama perorangan / usaha" error={fieldErrors.nama_mitra} required autoFocus />
                    <FormField label="NIK / NIB" type="text" value={form.nik_nib} onChange={(e) => update("nik_nib", e.target.value)} placeholder="16 digit NIK atau 13 digit NIB" error={fieldErrors.nik_nib} required />
                    
                    <div className="mb-4 text-left">
                      <label className="block text-sm font-medium mb-1.5 text-ink">Upload Foto NIK / NPWP</label>
                      <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={(e) => setForm(f => ({ ...f, foto_nik: e.target.files?.[0] || null }))} className="block w-full text-sm text-ink/80 border border-ink/20 rounded-md p-2" required />
                      {fieldErrors.foto_nik && <p className="text-xs text-red-600 mt-1.5">{fieldErrors.foto_nik}</p>}
                    </div>

                    <div className="mb-4 text-left">
                      <label className="block text-sm font-medium mb-1.5 text-ink">Provinsi</label>
                      <select className={`block w-full text-sm text-ink/80 border ${fieldErrors.provinsi ? 'border-red-500' : 'border-ink/20'} rounded-md p-2.5 bg-white`} onChange={handleProvinsiChange} required>
                        <option value="">Pilih Provinsi...</option>
                        {provinces.map((prov) => <option key={prov.id} value={prov.id}>{prov.name}</option>)}
                      </select>
                    </div>

                    <div className="mb-4 text-left">
                      <label className="block text-sm font-medium mb-1.5 text-ink">Kota / Kabupaten</label>
                      <select className={`block w-full text-sm text-ink/80 border ${fieldErrors.kota ? 'border-red-500' : 'border-ink/20'} rounded-md p-2.5 bg-white disabled:bg-ink/5`} onChange={(e) => update("kota", e.target.options[e.target.selectedIndex].text)} disabled={cities.length === 0} required>
                        <option value="">Pilih Kota/Kabupaten...</option>
                        {cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
                      </select>
                    </div>

                    <FormField label="Detail Alamat" type="text" value={form.detail_alamat} onChange={(e) => update("detail_alamat", e.target.value.toUpperCase())} placeholder="Jalan, RT/RW, no. rumah, patokan" error={fieldErrors.detail_alamat} required />
                    <FormField label="Nomor telepon" type="tel" value={form.telepon} onChange={(e) => update("telepon", e.target.value)} placeholder="08123456789" error={fieldErrors.telepon} required />
                    <TermsCheckbox checked={agreed} onChange={setAgreed} />
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3.5 py-2.5 mb-4">{error}</p>}

            <div className="flex gap-3">
              {step > 0 && <BackButton onClick={goBack} />}
              <SubmitButton type="submit" disabled={status === "loading"}>
                {status === "loading" ? "Memproses..." : step === 0 ? "Kirim Kode" : step === 1 ? "Verifikasi" : step < stepLabels.length - 1 ? "Lanjut" : "Daftar sebagai Mitra"}
              </SubmitButton>
            </div>
          </form>
        </>
      )}
    </AuthShell>
  );
}