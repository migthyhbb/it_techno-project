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
  isValidNpwp,
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
  nama_perusahaan: string;
  npwp: string;
  provinsi: string;
  kota: string;
  detail_alamat: string;
  telepon: string;
  foto_npwp: File | null;
};

type FieldErrors = Partial<Record<"nama_perusahaan" | "npwp" | "provinsi" | "kota" | "detail_alamat" | "telepon" | "foto_npwp", string>>;

export default function DaftarIndustriPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<FormState>({
    email: "",
    otp: "",
    password: "",
    nama_perusahaan: "",
    npwp: "",
    provinsi: "",
    kota: "",
    detail_alamat: "",
    telepon: "",
    foto_npwp: null,
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
      // FIX: URL KABUPATEN DIKEMBALIKAN KE WWW.EMSIFA.COM
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
          email: form.email,
          token: form.otp,
          type: "email",
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
    if (!form.nama_perusahaan.trim()) errors.nama_perusahaan = "Nama perusahaan wajib diisi.";
    if (!isValidNpwp(form.npwp)) errors.npwp = validationMessages.npwp;
    if (!form.foto_npwp) errors.foto_npwp = "Foto bukti NPWP wajib diupload.";
    
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
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("no-session");

      let fotoUrl = "";
      if (form.foto_npwp) {
        const fileExt = form.foto_npwp.name.split('.').pop();
        const fileName = `${userData.user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('industri_documents')
          .upload(`npwp/${fileName}`, form.foto_npwp);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('industri_documents')
          .getPublicUrl(`npwp/${fileName}`);
        
        fotoUrl = publicUrlData.publicUrl;
      }

     const { error: profileError } = await supabase.from("industri_profiles").upsert({
        user_id: userData.user.id, // auth_id ganti jadi user_id
        nama_perusahaan: form.nama_perusahaan,
        npwp: form.npwp,
        alamat: alamatLengkap,     // alamat_lengkap ganti jadi alamat
        telepon: form.telepon,     // no_telepon ganti jadi telepon
        foto_npwp_url: fotoUrl 
      }, {
        onConflict: 'user_id'      // Ini juga ganti jadi user_id
      });
      
      if (profileError) throw profileError;

      setStatus("submitted");
      router.push("/dashboard-industri"); 
      router.refresh();
    } catch (err) {
      setStatus("idle");
      if (err instanceof Error && err.message === "no-session") {
        setError("Sesi kamu berakhir. Coba ulangi dari langkah verifikasi email.");
      } else {
        setError("Gagal menyimpan data profil, coba lagi.");
        console.error("Supabase Error:", err);
      }
    }
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
            <Link href="/masuk" className="text-green font-medium hover:underline">Masuk</Link>
          </span>
          <span className="block">
            Mau daftar sebagai mitra?{" "}
            <Link href="/daftar/mitra" className="text-green font-medium hover:underline">Klik di sini</Link>
          </span>
        </p>
      }
    >
      {status === "submitted" ? (
        <div className="text-center py-4">
          <p className="text-forest font-medium mb-1">Pendaftaran industri berhasil.</p>
          <p className="text-ink/55 text-sm">Akun dan profil industri kamu sudah tersimpan. Mengalihkan ke dashboard...</p>
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
                  <FormField label="Email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="nama@perusahaan.com" required autoFocus />
                )}

                {step === 1 && (
                  <>
                    <p className="text-sm text-ink/55 mb-4">
                      Kode dikirim ke <span className="text-forest font-medium">{form.email}</span> · <button type="button" onClick={goBack} className="text-green hover:underline">ganti</button>
                    </p>
                    <OtpField value={form.otp} onChange={(v) => update("otp", v)} />
                    <button type="button" onClick={handleResend} disabled={resendCooldown > 0 || status === "loading"} className="text-xs text-green hover:underline disabled:text-ink/35 disabled:no-underline mb-2">
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
                    <FormField label="Nama perusahaan" type="text" value={form.nama_perusahaan} onChange={(e) => update("nama_perusahaan", e.target.value)} placeholder="PT / CV ..." required autoFocus />
                    {fieldErrors.nama_perusahaan && <p className="text-xs text-red-600 -mt-3 mb-3">{fieldErrors.nama_perusahaan}</p>}

                    <FormField label="NPWP" type="text" value={form.npwp} onChange={(e) => update("npwp", e.target.value)} placeholder="15 atau 16 digit NPWP" required />
                    {fieldErrors.npwp && <p className="text-xs text-red-600 -mt-3 mb-3">{fieldErrors.npwp}</p>}

                    <div className="mb-4 text-left">
                      <label className="block text-sm font-medium mb-1.5 text-ink">Upload Foto Bukti NPWP</label>
                      <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, foto_npwp: e.target.files?.[0] || null }))} className="block w-full text-sm text-ink/80 border border-ink/20 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-green file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green/10 file:text-green hover:file:bg-green/20" required />
                      {fieldErrors.foto_npwp && <p className="text-xs text-red-600 mt-1.5">{fieldErrors.foto_npwp}</p>}
                    </div>

                    <div className="mb-4 text-left">
                      <label className="block text-sm font-medium mb-1.5 text-ink">Provinsi</label>
                      <select className={`block w-full text-sm text-ink/80 border ${fieldErrors.provinsi ? 'border-red-500' : 'border-ink/20'} rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-green bg-white`} onChange={handleProvinsiChange} required>
                        <option value="">Pilih Provinsi...</option>
                        {provinces.map((prov) => <option key={prov.id} value={prov.id}>{prov.name}</option>)}
                      </select>
                      {fieldErrors.provinsi && <p className="text-xs text-red-600 mt-1.5">{fieldErrors.provinsi}</p>}
                    </div>

                    <div className="mb-4 text-left">
                      <label className="block text-sm font-medium mb-1.5 text-ink">Kota / Kabupaten</label>
                      <select className={`block w-full text-sm text-ink/80 border ${fieldErrors.kota ? 'border-red-500' : 'border-ink/20'} rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-green bg-white disabled:bg-ink/5 disabled:cursor-not-allowed`} onChange={(e) => update("kota", e.target.options[e.target.selectedIndex].text)} disabled={cities.length === 0} required>
                        <option value="">Pilih Kota/Kabupaten...</option>
                        {cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
                      </select>
                      {fieldErrors.kota && <p className="text-xs text-red-600 mt-1.5">{fieldErrors.kota}</p>}
                    </div>

                    <FormField label="Detail Alamat" type="text" value={form.detail_alamat} onChange={(e) => update("detail_alamat", e.target.value.toUpperCase())} placeholder="Jalan, RT/RW, no. gedung" required />
                    {fieldErrors.detail_alamat && <p className="text-xs text-red-600 -mt-3 mb-3">{fieldErrors.detail_alamat}</p>}

                    <FormField label="Nomor telepon" type="tel" value={form.telepon} onChange={(e) => update("telepon", e.target.value)} placeholder="08123456789" required />
                    {fieldErrors.telepon && <p className="text-xs text-red-600 -mt-3 mb-3">{fieldErrors.telepon}</p>}

                    <TermsCheckbox checked={agreed} onChange={setAgreed} />
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3.5 py-2.5 mb-4">{error}</p>}

            <div className="flex gap-3">
              {step > 0 && <BackButton onClick={goBack} />}
              <SubmitButton type="submit" disabled={status === "loading"}>
                {status === "loading" ? "Memproses..." : step === 0 ? "Kirim Kode" : step === 1 ? "Verifikasi" : step < stepLabels.length - 1 ? "Lanjut" : "Daftar sebagai Industri"}
              </SubmitButton>
            </div>
          </form>
        </>
      )}
    </AuthShell>
  );
}