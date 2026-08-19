import { LegalShell, LegalSection } from "@/components/legal/legal-shell";

export default function SyaratKetentuanPage() {
  return (
    <LegalShell title="Syarat & Ketentuan">
      <LegalSection title="1. Ketentuan Umum">
        Dengan mendaftar sebagai mitra atau industri di LENTERA, Anda setuju
        untuk terikat pada syarat dan ketentuan ini. LENTERA berhak
        memperbarui ketentuan ini sewaktu-waktu, dan perubahan akan
        diberitahukan melalui email terdaftar Anda.
      </LegalSection>
      <LegalSection title="2. Kewajiban Mitra & Industri">
        Mitra dan industri wajib memberikan data pendaftaran yang benar dan
        terkini (nama, NIK/NIB atau NPWP, alamat, dan nomor telepon), serta
        bertanggung jawab atas keakuratan informasi yang disampaikan kepada
        LENTERA.
      </LegalSection>
      <LegalSection title="3. Pemesanan & Penyaluran">
        Permintaan stok ulang atau pemesanan yang diajukan melalui dashboard
        akan diproses sesuai ketersediaan dan jadwal penyaluran LENTERA.
        Harga dan ketersediaan produk dapat berubah sewaktu-waktu.
      </LegalSection>
      <LegalSection title="4. Pembatalan & Pengembalian">
        Pembatalan pesanan hanya dapat dilakukan sebelum proses penyaluran
        dimulai. Kebijakan pengembalian mengikuti ketentuan yang berlaku
        untuk masing-masing jenis produk.
      </LegalSection>
      <LegalSection title="5. Penghentian Akun">
        LENTERA berhak menangguhkan atau menghentikan akun mitra/industri
        yang melanggar ketentuan ini atau menyalahgunakan layanan yang
        disediakan.
      </LegalSection>
    </LegalShell>
  );
}
