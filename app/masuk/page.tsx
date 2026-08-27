"use client";



import { useState } from "react";

import Link from "next/link";

import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";

import { FormField } from "@/components/auth/form-field";

import { SubmitButton } from "@/components/auth/submit-button";

import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

import { translateAuthError } from "@/lib/auth-errors";



export default function MasukPage() {

  const router = useRouter();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [status, setStatus] = useState<"idle" | "loading" | "submitted">("idle");

  const [error, setError] = useState<string | null>(null);



  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {

    e.preventDefault();

    setError(null);

    setStatus("loading");



    try {

      const supabase = createSupabaseBrowserClient();

      const { data, error: signInError } = await supabase.auth.signInWithPassword({

        email,

        password,

      });

      if (signInError) throw signInError;



      const userId = data.user.id;



      // Arahkan berdasarkan peran akun: admin -> mitra -> industri -> beranda.

      const { data: adminRow } = await supabase

        .from("admin_profiles")

        .select("user_id")

        .eq("user_id", userId)

        .maybeSingle();



      if (adminRow) {

        setStatus("submitted");

        router.push("/dashboard-admin");

        router.refresh();

        return;

      }



      const { data: mitraRow } = await supabase

        .from("mitra_profiles")

        .select("user_id")

        .eq("user_id", userId)

        .maybeSingle();



      if (mitraRow) {

        setStatus("submitted");

        router.push("/dashboard");

        router.refresh();

        return;

      }



      const { data: industriRow } = await supabase

        .from("industri_profiles")

        .select("user_id")

        .eq("user_id", userId)

        .maybeSingle();



      setStatus("submitted");

      router.push(industriRow ? "/dashboard-industri" : "/");

      router.refresh();

    } catch (err) {

      setStatus("idle");

      setError(translateAuthError(err instanceof Error ? err.message : null));

    }

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

          <p className="text-forest font-medium mb-1">Berhasil masuk.</p>

          <p className="text-ink/55 text-sm">Mengalihkan...</p>

        </div>

      ) : (

        <form onSubmit={handleSubmit}>

          <FormField

            label="Email"

            type="email"

            value={email}

            onChange={(e) => setEmail(e.target.value)}

            placeholder="nama@perusahaan.com"

            required

            autoFocus

          />

          <FormField

            label="Kata sandi"

            type="password"

            value={password}

            onChange={(e) => setPassword(e.target.value)}

            placeholder="••••••••"

            required

          />

          <div className="flex justify-end mb-5">

            <a href="/lupa-sandi" className="text-xs text-ink/50 hover:text-forest transition-colors">

              Lupa kata sandi?

            </a>

          </div>



          {error && (

            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3.5 py-2.5 mb-4">

              {error}

            </p>

          )}



          <SubmitButton type="submit" disabled={status === "loading"}>

            {status === "loading" ? "Memproses..." : "Masuk"}

          </SubmitButton>

        </form>

      )}

    </AuthShell>

  );

}