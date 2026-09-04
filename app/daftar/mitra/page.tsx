"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import dynamic from "next/dynamic";
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

const LocationPickerMap = dynamic(
  () => import("@/components/location-picker-map").then((mod) => mod.LocationPickerMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] w-full bg-ink/5 animate-pulse rounded-xl flex items-center justify-center text-sm text-ink/40">
        Memuat Peta...
      </div>
    ),
  }
);

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
  kecamatan: string;
  kelurahan: string;
  detail_alamat: string;
  telepon: string;
  lat: number | null;
  lng: number | null;
  foto_nik: File | null;
};

type FieldErrors = Partial<
  Record<
    | "nama_mitra"
    | "nik_nib"
    | "provinsi"
    | "kota"
    | "kecamatan"
    | "kelurahan"
    | "detail_alamat"
    | "telepon"
    | "foto_nik",
    string
  >
>;

function formatHumanFriendlyError(err: unknown): string {
  if (!err) return "Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.";

  const message = typeof err === "string" ? err : (err as { message?: string })?.message || "";

  if (message.includes("Payload too large") || message.includes("413") || message.includes("exceeds")) {
    return "Ukuran gambar terlalu besar. Maksimal ukuran berkas adalah 5MB.";
  }
  if (message.includes("mime") || message.includes("not allowed") || message.includes("extension")) {
    return "Format gambar tidak didukung. Harap upload foto berformat JPG, JPEG, atau PNG.";
  }
  if (message.includes("bucket") || message.includes("storage")) {
    return "Gagal mengunggah dokumen. Silakan periksa koneksi internet Anda dan coba lagi.";
  }

  if (message.includes("duplicate key") || message.includes("already exists")) {
    return "Data NIK/NIB, nomor telepon, atau profil mitra ini sudah pernah terdaftar.";
  }
  if (message.includes("different") || message.includes("same password")) {
    return "Kata sandi baru tidak boleh sama dengan kata sandi lama.";
  }
  if (message === "no-session") {
    return "Sesi pendaftaran Anda telah berakhir. Silakan lakukan verifikasi ulang.";
  }

  const translated = translateAuthError(message);
  if (translated !== "Terjadi kesalahan, coba lagi.") {
    return translated;
  }

  return "Gagal memproses pendaftaran. Silakan periksa kembali data Anda dan coba lagi.";
}

export default function DaftarMitraPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<FormState>({
    email: "",
    otp: "",
    password: "",
    nama_mitra: "",
    nik_nib: "",
    provinsi: "",
    kota: "",
    kecamatan: "",
    kelurahan: "",
    detail_alamat: "",
    telepon: "",
    lat: null,
    lng: null,
    foto_nik: null,
  });

  const [status, setStatus] = useState<"idle" | "loading" | "submitted">("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [agreed, setAgreed] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [provinces, setProvinces] = useState<{ id: string; name: string }[]>([]);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [districts, setDistricts] = useState<{ id: string; name: string }[]>([]);
  const [villages, setVillages] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const checkExistingSession = async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: adminProfile } = await supabase
          .from("admin_profiles")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (adminProfile) {
          await supabase.auth.signOut();
          return;
        }

        const { data: blacklisted } = await supabase
          .from("blacklists")
          .select("alasan")
          .eq("user_id", user.id)
          .maybeSingle();

        const { data: profile } = await supabase
          .from("mitra_profiles")
          .select("id, status_akun, alasan_ban")
          .eq("user_id", user.id)
          .maybeSingle();

        if (blacklisted || profile?.status_akun === "banned") {
          const alasan = blacklisted?.alasan || profile?.alasan_ban || "Pelanggaran ketentuan layanan.";
          alert(`Akun Anda telah diblokir/di-ban!\nAlasan: ${alasan}`);
          await supabase.auth.signOut();
          window.location.href = "/masuk";
          return;
        }

        if (profile) {
          window.location.href = "/dashboard";
          return;
        }

        setForm((prev) => ({ ...prev, email: user.email || "" }));
        setStep(3);
      }
    };

    checkExistingSession();
  }, [router]);

  useEffect(() => {
    fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json")
      .then((res) => res.json())
      .then((data) => setProvinces(Array.isArray(data) ? data : []))
      .catch(() => console.error("Gagal memuat data provinsi"));
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const handleProvinsiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provId = e.target.value;
    const provName = e.target.options[e.target.selectedIndex]?.text || "";

    update("provinsi", provId ? provName : "");
    update("kota", "");
    update("kecamatan", "");
    update("kelurahan", "");
    setCities([]);
    setDistricts([]);
    setVillages([]);

    if (provId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provId}.json`)
        .then((res) => {
          if (!res.ok) throw new Error("Gagal mengambil data kota");
          return res.json();
        })
        .then((data) => setCities(Array.isArray(data) ? data : []))
        .catch(() => {
          console.error("Gagal memuat data kota");
          setCities([]);
        });
    }
  };

  const handleKotaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regencyId = e.target.value;
    const regencyName = e.target.options[e.target.selectedIndex]?.text || "";

    update("kota", regencyId ? regencyName : "");
    update("kecamatan", "");
    update("kelurahan", "");
    setDistricts([]);
    setVillages([]);

    if (regencyId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${regencyId}.json`)
        .then((res) => {
          if (!res.ok) throw new Error("Gagal mengambil data kecamatan");
          return res.json();
        })
        .then((data) => setDistricts(Array.isArray(data) ? data : []))
        .catch(() => {
          console.error("Gagal memuat data kecamatan");
          setDistricts([]);
        });
    }
  };

  const handleKecamatanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtId = e.target.value;
    const districtName = e.target.options[e.target.selectedIndex]?.text || "";

    update("kecamatan", districtId ? districtName : "");
    update("kelurahan", "");
    setVillages([]);

    if (districtId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${districtId}.json`)
        .then((res) => {
          if (!res.ok) throw new Error("Gagal mengambil data kelurahan");
          return res.json();
        })
        .then((data) => setVillages(Array.isArray(data) ? data : []))
        .catch(() => {
          console.error("Gagal memuat data kelurahan");
          setVillages([]);
        });
    }
  };

  const handleLocationSelect = (loc: {
    lat: number;
    lng: number;
    alamat: string;
    kelurahan: string;
    kecamatan: string;
    kota_kabupaten: string;
    provinsi: string;
  }) => {
    setForm((prev) => ({
      ...prev,
      lat: Number(loc.lat),
      lng: Number(loc.lng),
      detail_alamat: loc.alamat ? loc.alamat.toUpperCase() : prev.detail_alamat,
      provinsi: loc.provinsi || prev.provinsi,
      kota: loc.kota_kabupaten || prev.kota,
      kecamatan: loc.kecamatan || prev.kecamatan,
      kelurahan: loc.kelurahan || prev.kelurahan,
    }));
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
      setError(formatHumanFriendlyError(err));
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
        setError(formatHumanFriendlyError(err));
      }
      return;
    }

    if (step === 1) {
      if (form.otp.length !== 6) {
        setError("Masukkan 6 digit kode verifikasi yang benar.");
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
        setError("Kode verifikasi salah atau sudah kedaluwarsa. Silakan minta kode baru.");
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

        if (
          updateError &&
          !updateError.message.toLowerCase().includes("different") &&
          !updateError.message.toLowerCase().includes("same")
        ) {
          throw updateError;
        }

        setStatus("idle");
        goNext();
      } catch (err) {
        setStatus("idle");
        setError(formatHumanFriendlyError(err));
      }
      return;
    }

    // Step 3 Validation
    const errors: FieldErrors = {};
    if (!form.nama_mitra.trim()) errors.nama_mitra = "Nama mitra wajib diisi.";
    if (!isValidNikNib(form.nik_nib)) errors.nik_nib = validationMessages.nikNib;

    if (!form.foto_nik) {
      errors.foto_nik = "Foto NIK/NPWP wajib diupload.";
    } else if (form.foto_nik.size > 5 * 1024 * 1024) {
      errors.foto_nik = "Ukuran gambar terlalu besar. Maksimal 5MB.";
    }

    if (!form.provinsi) errors.provinsi = "Provinsi wajib dipilih.";
    if (!form.kota) errors.kota = "Kota/Kabupaten wajib dipilih.";
    if (!form.kecamatan) errors.kecamatan = "Kecamatan wajib dipilih.";
    if (!form.kelurahan) errors.kelurahan = "Kelurahan wajib dipilih.";
    if (!form.detail_alamat.trim()) errors.detail_alamat = "Detail alamat wajib diisi.";

    const alamatLengkap = `${form.detail_alamat}, Kel. ${form.kelurahan}, Kec. ${form.kecamatan}, ${form.kota}, ${form.provinsi}`;
    if (form.provinsi && form.kota && form.detail_alamat && !isValidAddress(alamatLengkap)) {
      errors.detail_alamat = validationMessages.address;
    }

    if (!isValidPhone(form.telepon)) errors.telepon = validationMessages.phone;

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (!agreed) {
      setError("Anda harus menyetujui Syarat & Ketentuan dan Kebijakan Privasi LENTERA.");
      return;
    }

    setStatus("loading");
    try {
      const supabase = createSupabaseBrowserClient();

      await supabase.auth.refreshSession();

      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        if (form.email && form.password) {
          const { data: reloginData, error: reloginErr } = await supabase.auth.signInWithPassword({
            email: form.email,
            password: form.password,
          });

          if (reloginErr || !reloginData.user) {
            throw new Error("no-session");
          }
        } else {
          throw new Error("no-session");
        }
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("no-session");

      const { data: blacklisted } = await supabase
        .from("blacklists")
        .select("nik_nib, telepon, alasan")
        .or(`nik_nib.eq.${form.nik_nib},telepon.eq.${form.telepon},user_id.eq.${user.id}`)
        .maybeSingle();

      if (blacklisted) {
        const reason = blacklisted.alasan || "Terdaftar dalam daftar hitam penangguhan akun.";

        await supabase.from("blacklists").upsert({
          user_id: user.id,
          email: user.email,
          nik_nib: form.nik_nib,
          telepon: form.telepon,
          alasan: `Pendaftaran ditolak otomatis: ${reason}`
        });

        setStatus("idle");
        setError(`Pendaftaran ditolak: NIK/NIB (${form.nik_nib}) atau Nomor Telepon (${form.telepon}) Anda terdaftar dalam daftar hitam penangguhan akun. Alasan: ${reason}`);
        await supabase.auth.signOut();
        return;
      }

      const { data: bannedProfile } = await supabase
        .from("mitra_profiles")
        .select("nik_nib, telepon, alasan_ban")
        .eq("status_akun", "banned")
        .or(`nik_nib.eq.${form.nik_nib},telepon.eq.${form.telepon}`)
        .maybeSingle();

      if (bannedProfile) {
        const reason = bannedProfile.alasan_ban || "Pelanggaran ketentuan layanan.";

        await supabase.from("blacklists").upsert({
          user_id: user.id,
          email: user.email,
          nik_nib: form.nik_nib,
          telepon: form.telepon,
          alasan: `Pendaftaran ditolak otomatis: ${reason}`
        });

        setStatus("idle");
        setError(`Pendaftaran ditolak: NIK/NIB atau Nomor Telepon ini terhubung dengan akun mitra yang telah di-ban! Alasan: ${reason}`);
        await supabase.auth.signOut();
        return;
      }

      let fotoUrl = "";
      if (form.foto_nik) {
        if (!["image/jpeg", "image/png", "image/jpg"].includes(form.foto_nik.type)) {
          setStatus("idle");
          setError("Format gambar tidak didukung. Harap upload foto JPG/PNG.");
          return;
        }

        const fileExt = form.foto_nik.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("mitra_documents")
          .upload(`nik/${fileName}`, form.foto_nik);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("mitra_documents")
          .getPublicUrl(`nik/${fileName}`);

        fotoUrl = publicUrlData.publicUrl;
      }

      const { error: profileError } = await supabase.from("mitra_profiles").upsert(
        {
          user_id: user.id,
          nama_mitra: form.nama_mitra,
          nik_nib: form.nik_nib,
          provinsi: form.provinsi,
          kota_kabupaten: form.kota,
          kecamatan: form.kecamatan,
          kelurahan: form.kelurahan,
          alamat: alamatLengkap,
          telepon: form.telepon,
          lat: form.lat !== null ? Number(form.lat) : null,
          lng: form.lng !== null ? Number(form.lng) : null,
          foto_nik_url: fotoUrl,
          status_akun: "aktif",
        },
        { onConflict: "user_id" }
      );

      if (profileError) throw profileError;

      await supabase.auth.refreshSession();
      setStatus("submitted");
      
      // Menggunakan hard redirect agar cookie ter-sync utuh melewati Middleware Next.js
      window.location.href = "/dashboard";
    } catch (err: any) {
      setStatus("idle");
      if (err?.message === "no-session") {
        setError("Sesi pendaftaran Anda telah berakhir. Mengembalikan ke verifikasi email...");
        setTimeout(() => {
          setStep(0);
        }, 1500);
      } else {
        setError(formatHumanFriendlyError(err));
      }
    }
  }

  const searchQuery = `${form.kelurahan} ${form.kecamatan} ${form.kota} ${form.provinsi}`.trim();

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
          <p className="text-forest font-medium mb-1">Pendaftaran mitra berhasil!</p>
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
                      Kode dikirim ke <span className="text-forest font-medium">{form.email}</span> ·{" "}
                      <button type="button" onClick={goBack} className="text-green hover:underline">
                        ganti
                      </button>
                    </p>
                    <OtpField value={form.otp} onChange={(v) => update("otp", v)} />
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendCooldown > 0 || status === "loading"}
                      className="text-xs text-green hover:underline disabled:text-ink/35 mb-2"
                    >
                      {resendCooldown > 0
                        ? `Kirim ulang kode (${resendCooldown}s)`
                        : "Kirim ulang kode"}
                    </button>
                  </>
                )}

                {step === 2 && (
                  <>
                    <FormField
                      label="Kata sandi"
                      type="password"
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                      placeholder="••••••••"
                      required
                      autoFocus
                    />
                    <PasswordRequirements value={form.password} />
                  </>
                )}

                {step === 3 && (
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
                    {fieldErrors.nama_mitra && (
                      <p className="text-xs text-red-600 -mt-3 mb-3">{fieldErrors.nama_mitra}</p>
                    )}

                    <FormField
                      label="NIK / NIB"
                      type="text"
                      value={form.nik_nib}
                      onChange={(e) => update("nik_nib", e.target.value)}
                      placeholder="16 digit NIK atau 13 digit NIB"
                      required
                    />
                    {fieldErrors.nik_nib && (
                      <p className="text-xs text-red-600 -mt-3 mb-3">{fieldErrors.nik_nib}</p>
                    )}

                    <div className="mb-4 text-left">
                      <label className="block text-sm font-medium mb-1.5 text-ink">
                        Upload Foto NIK / NPWP
                      </label>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={(e) =>
                          setForm((f) => ({ ...f, foto_nik: e.target.files?.[0] || null }))
                        }
                        className="block w-full text-sm text-ink/80 border border-ink/20 rounded-md p-2 bg-white"
                        required
                      />
                      <p className="text-[11px] text-ink/50 mt-1">Maksimal ukuran berkas: 5MB (JPG, JPEG, PNG)</p>
                      {fieldErrors.foto_nik && (
                        <p className="text-xs text-red-600 mt-1.5">{fieldErrors.foto_nik}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div className="text-left">
                        <label className="block text-sm font-medium mb-1.5 text-ink">Provinsi</label>
                        <select
                          className={`block w-full text-sm text-ink/80 border ${
                            fieldErrors.provinsi ? "border-red-500" : "border-ink/20"
                          } rounded-md p-2.5 bg-white`}
                          onChange={handleProvinsiChange}
                          required
                        >
                          <option value="">Pilih Provinsi...</option>
                          {provinces.map((prov) => (
                            <option key={prov.id} value={prov.id}>
                              {prov.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="text-left">
                        <label className="block text-sm font-medium mb-1.5 text-ink">
                          Kota / Kabupaten
                        </label>
                        <select
                          className={`block w-full text-sm text-ink/80 border ${
                            fieldErrors.kota ? "border-red-500" : "border-ink/20"
                          } rounded-md p-2.5 bg-white disabled:bg-ink/5`}
                          onChange={handleKotaChange}
                          disabled={cities.length === 0}
                          required
                        >
                          <option value="">Pilih Kota/Kabupaten...</option>
                          {cities.map((city) => (
                            <option key={city.id} value={city.id}>
                              {city.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="text-left">
                        <label className="block text-sm font-medium mb-1.5 text-ink">Kecamatan</label>
                        <select
                          className={`block w-full text-sm text-ink/80 border ${
                            fieldErrors.kecamatan ? "border-red-500" : "border-ink/20"
                          } rounded-md p-2.5 bg-white disabled:bg-ink/5`}
                          onChange={handleKecamatanChange}
                          disabled={districts.length === 0}
                          required
                        >
                          <option value="">Pilih Kecamatan...</option>
                          {districts.map((dist) => (
                            <option key={dist.id} value={dist.id}>
                              {dist.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="text-left">
                        <label className="block text-sm font-medium mb-1.5 text-ink">
                          Kelurahan / Desa
                        </label>
                        <select
                          className={`block w-full text-sm text-ink/80 border ${
                            fieldErrors.kelurahan ? "border-red-500" : "border-ink/20"
                          } rounded-md p-2.5 bg-white disabled:bg-ink/5`}
                          onChange={(e) =>
                            update("kelurahan", e.target.options[e.target.selectedIndex]?.text || "")
                          }
                          disabled={villages.length === 0}
                          required
                        >
                          <option value="">Pilih Kelurahan...</option>
                          {villages.map((vill) => (
                            <option key={vill.id} value={vill.id}>
                              {vill.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mb-4 text-left">
                      <label className="block text-sm font-medium mb-1.5 text-ink">
                        Pilih Titik Lokasi Usaha/Bangunan
                      </label>
                      <LocationPickerMap
                        searchQuery={searchQuery}
                        onLocationSelect={handleLocationSelect}
                      />
                    </div>

                    <FormField
                      label="Detail Alamat"
                      type="text"
                      value={form.detail_alamat}
                      onChange={(e) => update("detail_alamat", e.target.value.toUpperCase())}
                      placeholder="Jalan, RT/RW, no. rumah, patokan"
                      required
                    />
                    {fieldErrors.detail_alamat && (
                      <p className="text-xs text-red-600 -mt-3 mb-3">
                        {fieldErrors.detail_alamat}
                      </p>
                    )}

                    <FormField
                      label="Nomor telepon"
                      type="tel"
                      value={form.telepon}
                      onChange={(e) => update("telepon", e.target.value)}
                      placeholder="081200000000"
                      required
                    />
                    {fieldErrors.telepon && (
                      <p className="text-xs text-red-600 -mt-3 mb-3">{fieldErrors.telepon}</p>
                    )}

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
              <SubmitButton
                type="submit"
                disabled={status === "loading"}
                isSubmitting={status === "loading"}
              >
                {status === "loading"
                  ? "Memproses..."
                  : step === 0
                  ? "Kirim Kode"
                  : step === 1
                  ? "Verifikasi"
                  : step < stepLabels.length - 1
                  ? "Lanjut"
                  : "Daftar sebagai Mitra"}
              </SubmitButton>
            </div>
          </form>
        </>
      )}
    </AuthShell>
  );
}