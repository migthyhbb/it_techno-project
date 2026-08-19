import { LegalShell, LegalSection } from "@/components/legal/legal-shell";

export default function KebijakanPrivasiPage() {
  return (
    <LegalShell title="Kebijakan Privasi">
      <LegalSection title="1. Data yang Kami Kumpulkan">
        Saat mendaftar, kami mengumpulkan data seperti nama mitra/perusahaan,
        NIK/NIB atau NPWP, alamat lengkap, nomor telepon, dan alamat email
        yang Anda berikan melalui formulir pendaftaran.
      </LegalSection>
      <LegalSection title="2. Cara Kami Menggunakan Data">
        Data yang dikumpulkan digunakan untuk mengelola akun Anda, memproses
        permintaan stok/pemesanan, serta berkomunikasi terkait status
        kemitraan dengan LENTERA.
      </LegalSection>
      <LegalSection title="3. Keamanan Data">
        Kami menyimpan data Anda menggunakan penyedia infrastruktur terpercaya
        dengan kontrol akses yang ketat, dan tidak membagikan data pribadi
        Anda ke pihak ketiga tanpa persetujuan, kecuali diwajibkan oleh
        hukum.
      </LegalSection>
      <LegalSection title="4. Hak Anda atas Data">
        Anda berhak meminta akses, koreksi, atau penghapusan data pribadi
        yang kami simpan dengan menghubungi tim LENTERA melalui kontak yang
        tersedia di situs ini.
      </LegalSection>
      <LegalSection title="5. Kontak">
        Untuk pertanyaan seputar kebijakan privasi ini, silakan hubungi tim
        LENTERA melalui halaman kontak pada situs ini.
      </LegalSection>
    </LegalShell>
  );
}
