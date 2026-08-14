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
