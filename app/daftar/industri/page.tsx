"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type FormValues = {
  email: string;
  password: string;
  nama_perusahaan: string;
  npwp: string;
  alamat: string;
  telepon: string;
};

export default function DaftarIndustriPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormValues>({
    email: "",
    password: "",
    nama_perusahaan: "",
    npwp: "",
    alamat: "",
    telepon: "",
  });
  const [dokumen, setDokumen] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  function updateField(field: keyof FormValues, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!dokumen) {
      setError("Dokumen NPWP/NIB wajib diunggah.");
      return;
    }

    if (dokumen.size > 5 * 1024 * 1024) {
      setError("Ukuran dokumen maksimal 5MB.");
      return;
    }

    setStatus("loading");

    try {
      const supabase = createSupabaseBrowserClient();
      const extension = dokumen.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `npwp/registration-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("industri_documents")
        .upload(filePath, dokumen, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("industri_documents")
        .getPublicUrl(filePath);
      const response = await fetch("/api/daftar/industri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, dokumen_url: publicUrlData.publicUrl }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Pendaftaran gagal.");
      router.push("/masuk?registered=industri");
    } catch (submitError: unknown) {
      setStatus("idle");
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Pendaftaran gagal. Silakan coba lagi."
      );
    }
  }

  return (
    <AuthShell
      eyebrow="Pendaftaran industri"
      title="Daftar sebagai Industri"
      subtitle="Bergabung sebagai pemasok limbah industri di LENTERA."
      footer={
        <p className="text-sm text-ink/60">
          Sudah punya akun?{" "}
          <Link href="/masuk" className="text-green font-medium hover:underline">
            Masuk
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit}>
        <FormField
          label="Email"
          type="email"
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          placeholder="nama@perusahaan.com"
          required
        />
        <FormField
          label="Kata sandi"
          type="password"
          value={form.password}
          onChange={(event) => updateField("password", event.target.value)}
          placeholder="Minimal 8 karakter"
          minLength={8}
          required
        />
        <FormField
          label="Nama perusahaan"
          value={form.nama_perusahaan}
          onChange={(event) => updateField("nama_perusahaan", event.target.value)}
          placeholder="PT Nama Perusahaan"
          required
        />
        <FormField
          label="NPWP"
          value={form.npwp}
          onChange={(event) => updateField("npwp", event.target.value)}
          placeholder="Nomor NPWP perusahaan"
          required
        />
        <FormField
          label="Nomor telepon"
          type="tel"
          value={form.telepon}
          onChange={(event) => updateField("telepon", event.target.value)}
          placeholder="08123456789"
          required
        />
        <label className="block mb-4">
          <span className="block text-sm font-medium text-forest mb-1.5">
            Alamat perusahaan
          </span>
          <textarea
            value={form.alamat}
            onChange={(event) => updateField("alamat", event.target.value)}
            placeholder="Alamat lengkap perusahaan"
            className="w-full rounded-xl border border-forest/15 bg-cream/50 px-4 py-3 text-sm text-ink placeholder:text-ink/35 outline-none transition-colors focus:border-green focus:bg-paper min-h-24 resize-y"
            required
          />
        </label>
        <label className="block mb-5">
          <span className="block text-sm font-medium text-forest mb-1.5">
            Dokumen NPWP / NIB
          </span>
          <input
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            onChange={(event) => setDokumen(event.target.files?.[0] || null)}
            className="block w-full text-sm text-ink/80 border border-ink/20 rounded-md p-2 bg-white"
            required
          />
          <span className="block text-xs text-ink/50 mt-1">
            Format JPG, JPEG, atau PNG. Maksimal 5MB.
          </span>
        </label>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3.5 py-2.5 mb-4">
            {error}
          </p>
        )}
        <SubmitButton
          type="submit"
          disabled={status === "loading"}
          isSubmitting={status === "loading"}
        >
          {status === "loading" ? "Mendaftarkan..." : "Daftar sebagai Industri"}
        </SubmitButton>
      </form>
    </AuthShell>
  );
}