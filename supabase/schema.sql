-- Jalankan di Supabase SQL editor kalau memilih Supabase sebagai sumber data
-- leaderboard. Nama tabel & kolom ini yang dipakai lib/get-leaderboard.ts —
-- kalau mau nama lain, sesuaikan juga query di file itu.

create table if not exists leaderboard_entries (
  rank integer primary key,
  name text not null,
  initials text not null,
  industry text not null,
  volume text not null,
  logo_type text not null default 'generic', -- steel | textile | chemical | paper | palm | electronics | food | automotive | pharma | energy | generic
  logo_url text, -- url logo perusahaan (opsional). Kosong = pakai ikon logo_type
  accent text not null default 'green', -- gold | forest | clay | green
  updated_at timestamptz not null default now()
);

-- Contoh policy read-only untuk anon key (sesuaikan sesuai kebutuhan keamanan)
alter table leaderboard_entries enable row level security;
create policy "Public read access" on leaderboard_entries
  for select using (true);


-- ============================================================
-- Profil Mitra & Industri — dibuat saat orang mendaftar lewat
-- /daftar/mitra atau /daftar/industri. user_id merujuk ke akun
-- Supabase Auth (auth.users) yang dibuat lewat supabase.auth.signUp().
-- ============================================================

create table if not exists mitra_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nama_mitra text not null,
  nik_nib text not null,
  alamat text not null,
  telepon text not null,
  created_at timestamptz not null default now()
);

create table if not exists industri_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nama_perusahaan text not null,
  npwp text not null,
  alamat text not null,
  telepon text not null,
  created_at timestamptz not null default now()
);

alter table mitra_profiles enable row level security;
alter table industri_profiles enable row level security;

-- Tiap user cuma boleh insert & baca baris miliknya sendiri.
create policy "Mitra bisa insert profil sendiri" on mitra_profiles
  for insert with check (auth.uid() = user_id);
create policy "Mitra bisa baca profil sendiri" on mitra_profiles
  for select using (auth.uid() = user_id);

create policy "Industri bisa insert profil sendiri" on industri_profiles
  for insert with check (auth.uid() = user_id);
create policy "Industri bisa baca profil sendiri" on industri_profiles
  for select using (auth.uid() = user_id);
