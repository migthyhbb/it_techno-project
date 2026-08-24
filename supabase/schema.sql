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
  nik_nib text not null check (nik_nib ~ '^[0-9]{13}$' or nik_nib ~ '^[0-9]{16}$'),
  alamat text not null check (length(trim(alamat)) >= 15),
  telepon text not null check (telepon ~ '^(\+62|62|0)8[1-9][0-9]{6,10}$'),
  email text,
  created_at timestamptz not null default now()
);

create table if not exists industri_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nama_perusahaan text not null,
  npwp text not null check (npwp ~ '^[0-9]{15}$' or npwp ~ '^[0-9]{16}$'),
  alamat text not null check (length(trim(alamat)) >= 15),
  telepon text not null check (telepon ~ '^(\+62|62|0)8[1-9][0-9]{6,10}$'),
  email text,
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

-- ============================================================
-- Admin — TIDAK ada form pendaftaran publik untuk ini. Bikin manual:
-- 1. Supabase Dashboard -> Authentication -> Users -> Add user (isi
--    email + password admin-nya, centang "Auto Confirm User").
-- 2. Copy UUID user itu, lalu jalankan:
--    insert into admin_profiles (user_id, nama) values ('<uuid>', 'Nama Admin');
-- Setelah itu akun tsb otomatis diarahkan ke /admin saat login di /masuk.
-- ============================================================

create table if not exists admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nama text not null,
  created_at timestamptz not null default now()
);

alter table admin_profiles enable row level security;

create policy "Admin bisa baca profil sendiri" on admin_profiles
  for select using (auth.uid() = user_id);

-- Admin bisa baca SEMUA baris mitra_profiles & industri_profiles (bukan
-- cuma miliknya sendiri) — dipakai halaman /admin untuk menampilkan daftar
-- lengkap mitra & industri yang terdaftar.
create policy "Admin bisa baca semua profil mitra" on mitra_profiles
  for select using (
    exists (select 1 from admin_profiles where admin_profiles.user_id = auth.uid())
  );
create policy "Admin bisa baca semua profil industri" on industri_profiles
  for select using (
    exists (select 1 from admin_profiles where admin_profiles.user_id = auth.uid())
  );

-- ============================================================
-- Kalau tabel mitra_profiles/industri_profiles SUDAH pernah kamu buat
-- sebelum kolom/constraint di atas ditambahkan, create table if not
-- exists di atas tidak akan menambahkannya. Jalankan ini secara
-- terpisah supaya tabel yang sudah ada ikut ter-update:
-- ============================================================
-- alter table mitra_profiles add column if not exists email text;
-- alter table industri_profiles add column if not exists email text;
-- alter table mitra_profiles add constraint mitra_nik_nib_format
--   check (nik_nib ~ '^[0-9]{13}$' or nik_nib ~ '^[0-9]{16}$');
-- alter table mitra_profiles add constraint mitra_alamat_length
--   check (length(trim(alamat)) >= 15);
-- alter table mitra_profiles add constraint mitra_telepon_format
--   check (telepon ~ '^(\+62|62|0)8[1-9][0-9]{6,10}$');
-- alter table industri_profiles add constraint industri_npwp_format
--   check (npwp ~ '^[0-9]{15}$' or npwp ~ '^[0-9]{16}$');
-- alter table industri_profiles add constraint industri_alamat_length
--   check (length(trim(alamat)) >= 15);
-- alter table industri_profiles add constraint industri_telepon_format
--   check (telepon ~ '^(\+62|62|0)8[1-9][0-9]{6,10}$');
-- alter table industri_profiles add constraint industri_alamat_length
--   check (length(trim(alamat)) >= 15);
-- alter table industri_profiles add constraint industri_telepon_format
--   check (telepon ~ '^(\+62|62|0)8[1-9][0-9]{6,10}$');

-- ============================================================
-- Pengiriman Limbah — dipakai dashboard industri (/dashboard/industri).
-- LENTERA punya armada sendiri: limbah dijemput dari lokasi industri lalu
-- diantar ke pabrik pengelolah. status di bawah merepresentasikan tahapan
-- itu. Industri cuma bisa membuat & melihat pengajuannya sendiri — update
-- status (dijemput/dalam perjalanan/dst) nantinya dilakukan dari sisi
-- admin/operasional armada, bukan oleh industri sendiri.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists waste_shipments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  jenis_limbah text not null,
  perkiraan_berat numeric not null check (perkiraan_berat > 0),
  alamat_penjemputan text not null check (length(trim(alamat_penjemputan)) >= 10),
  catatan text,
  status text not null default 'menunggu_konfirmasi' check (
    status in (
      'menunggu_konfirmasi',
      'dijadwalkan',
      'dijemput',
      'dalam_perjalanan',
      'tiba_di_fasilitas',
      'selesai',
      'dibatalkan'
    )
  ),
  tanggal_penjemputan timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table waste_shipments enable row level security;

create policy "Industri bisa insert pengiriman sendiri" on waste_shipments
  for insert with check (auth.uid() = user_id);
create policy "Industri bisa baca pengiriman sendiri" on waste_shipments
  for select using (auth.uid() = user_id);

-- Admin bisa baca & update semua baris (dipakai nanti untuk kelola status
-- armada dari dashboard admin — belum dibuat, tapi policy-nya disiapkan
-- dari sekarang supaya tidak perlu migrasi ulang nanti).
create policy "Admin bisa baca semua pengiriman" on waste_shipments
  for select using (
    exists (select 1 from admin_profiles where admin_profiles.user_id = auth.uid())
  );
create policy "Admin bisa update semua pengiriman" on waste_shipments
  for update using (
    exists (select 1 from admin_profiles where admin_profiles.user_id = auth.uid())
  );
