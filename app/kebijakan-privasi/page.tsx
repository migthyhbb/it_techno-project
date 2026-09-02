import { LegalShell, LegalSection } from "@/components/legal/legal-shell";

export default function KebijakanPrivasiPage() {
  return (
    <LegalShell title="Kebijakan Privasi">
      <p className="text-xs text-ink/60 -mt-2 mb-6 italic">
        Terakhir Diperbarui: 2 September 2026
      </p>

      <div className="text-sm text-ink/80 leading-relaxed space-y-4 mb-6">
        <p>
          Selamat datang di <strong>LENTERA</strong>. LENTERA (&quot;Kami&quot;,
          &quot;Perusahaan&quot;, atau &quot;Platform&quot;) berkomitmen penuh untuk
          melindungi privasi dan keamanan Data Pribadi milik Pengguna (terdiri
          dari &quot;Industri&quot; dan &quot;Mitra&quot;). Kebijakan Privasi ini
          menjelaskan bagaimana Kami mengumpulkan, menggunakan, menyimpan,
          memproses, membagikan, dan melindungi Data Pribadi yang Anda berikan saat
          mendaftar serta menggunakan situs web dan layanan pengelolaan limbah Kami.
        </p>
        <p>
          Dengan mendaftarkan akun, mengakses, atau menggunakan layanan LENTERA,
          Anda menyatakan bahwa Anda telah membaca, memahami, dan menyetujui seluruh
          ketentuan dalam Kebijakan Privasi ini. Jika Anda tidak menyetujui bagian
          mana pun dari kebijakan ini, Anda tidak diperkenankan untuk menggunakan
          layanan Kami.
        </p>
      </div>

      <LegalSection title="1. Data Pribadi yang Kami Kumpulkan">
        <p className="mb-3">
          Guna memfasilitasi transaksi jual-beli dan pengelolaan limbah yang aman,
          sah, serta tepat sasaran, Kami mengumpulkan data yang Anda berikan secara
          langsung saat pembuatan akun dan proses verifikasi, meliputi:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-sm text-ink/80">
          <li>
            <strong>Informasi Akun Utama:</strong> Alamat Email aktif dan Kata Sandi
            (Password) yang terenkripsi.
          </li>
          <li>
            <strong>Informasi Identitas & Legalitas:</strong> Nama resmi Mitra atau
            Nama Industri (Perusahaan/Badan Usaha/Perorangan), NIK/NIB untuk
            Pengguna berkategori Mitra, NPWP untuk Pengguna berkategori Industri,
            serta salinan digital/foto dokumen legalitas resmi (Foto NIK/NIB atau Foto
            NPWP).
          </li>
          <li>
            <strong>Informasi Alamat & Lokasi Pengiriman/Penjemputan:</strong>{" "}
            Provinsi, Kota/Kabupaten, Kecamatan, Kelurahan/Desa, dan Detail Alamat
            lengkap (nama jalan, nomor bangunan, blok, serta petunjuk lokasi).
          </li>
          <li>
            <strong>Informasi Kontak Operasional:</strong> Nomor telepon / WhatsApp
            aktif yang dapat dihubungi.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Tujuan Pengumpulan dan Pemrosesan Data">
        <p className="mb-3">
          LENTERA menjunjung tinggi prinsip transparansi dan pembatasan tujuan
          pemrosesan data. Kami hanya mengumpulkan dan menggunakan Data Pribadi Anda
          secara eksklusif untuk tujuan-tujuan berikut:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-sm text-ink/80">
          <li>
            <strong>Verifikasi Akun dan Legalitas:</strong> Memastikan keabsahan
            identitas Pengguna serta validitas badan usaha/perorangan yang menjadi
            Industri maupun Mitra.
          </li>
          <li>
            <strong>Pelaksanaan Transaksi Jual-Beli:</strong> Memproses transaksi
            pembelian limbah dari Industri, pengelolaan limbah, serta penjualan
            produk olahan kepada Mitra.
          </li>
          <li>
            <strong>Komunikasi Operasional:</strong> Menghubungi Pengguna terkait
            konfirmasi pesanan, jadwal penjemputan/pengiriman, kendala teknis, atau
            klarifikasi data transaksi.
          </li>
          <li>
            <strong>Akurasi Alamat dan Logistik:</strong> Memastikan bahwa lokasi
            penjemputan limbah (dari Industri) dan lokasi pengiriman produk olahan (ke
            Mitra) tepat dan terhindar dari kekeliruan rute.
          </li>
        </ul>
        <p className="mt-3 text-xs italic text-ink/70">
          * Kami tidak menjual, menyewakan, atau memperdagangkan Data Pribadi Anda
          kepada pihak luar untuk tujuan pemasaran, promosi, maupun periklanan pihak
          ketiga.
        </p>
      </LegalSection>

      <LegalSection title="3. Pengungkapan dan Pembagian Data Kepada Pihak Ketiga">
        <p className="mb-3">
          Untuk menjalankan proses penjemputan dan pengiriman material limbah, Kami
          membagikan Data Pribadi Anda secara terbatas dan terukur:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-sm text-ink/80">
          <li>
            <strong>Penerima Data:</strong> Data dibagikan kepada armada pengiriman
            (fleet) internal LENTERA maupun mitra penyedia jasa logistik/ekspedisi
            yang bekerja sama secara resmi dengan Perusahaan.
          </li>
          <li>
            <strong>Cakupan Data yang Dibagikan:</strong> Terbatas pada Detail
            Alamat Lengkap dan Nomor Telepon Kontak.
          </li>
          <li>
            <strong>Tujuan Pembagian Data:</strong> Dilakukan semata-mata untuk
            memungkinkan petugas lapangan atau pengemudi armada (driver) memverifikasi
            lokasi fisik dan melakukan komunikasi langsung dengan pihak pengirim
            (Industri) atau penerima (Mitra) demi kelancaran operasional pengiriman.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Penggunaan Cookies dan Teknologi Pelacakan">
        <ul className="list-disc pl-5 space-y-2 text-sm text-ink/80">
          <li>
            <strong>Fungsi Cookies:</strong> Cookies pada platform Kami hanya
            berfungsi untuk mengingat dan mempertahankan role atau peran Pengguna
            (apakah masuk sebagai akun &quot;Mitra&quot; atau &quot;Industri&quot;)
            selama sesi navigasi berlangsung.
          </li>
          <li>
            <strong>Tidak Ada Pelacakan Pihak Ketiga:</strong> Kami tidak
            menggunakan cookies untuk melacak aktivitas penjelajahan Anda di luar
            situs web LENTERA, dan tidak mengintegrasikan jaringan periklanan pihak
            ketiga (third-party ad trackers).
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Keabsahan Data, Kelayakan Hukum, dan Batasan Usia">
        <ul className="list-disc pl-5 space-y-2 text-sm text-ink/80">
          <li>
            <strong>Legalitas Subjek Data:</strong> Pengguna yang mendaftar wajib
            memiliki kapasitas hukum yang sah (memiliki NIK/KTP, NPWP, atau NIB yang
            valid).
          </li>
          <li>
            <strong>Perwakilan Perusahaan:</strong> Apabila pembuatan akun dilakukan
            oleh perwakilan atau staf perusahaan, data dan dokumen legalitas yang
            diunggah wajib menggunakan data sah dari perusahaan/badan usaha yang
            diwakili secara resmi.
          </li>
          <li>
            <strong>Keakuratan Data:</strong> Pengguna bertanggung jawab penuh atas
            kebenaran, keakuratan, dan keabsahan data yang diunggah. Kelalaian dalam
            memberikan alamat atau kontak yang benar yang mengakibatkan kegagalan
            pengiriman berada di luar tanggung jawab LENTERA.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Keamanan dan Penyimpanan Data">
        <ul className="list-disc pl-5 space-y-2 text-sm text-ink/80">
          <li>
            <strong>Perlindungan Data:</strong> LENTERA menerapkan langkah-langkah
            teknis dan organisasional yang wajar untuk melindungi Data Pribadi Anda
            dari akses tidak sah, pengubahan, pengungkapan, atau pemusnahan yang tidak
            sah. Kata sandi Anda disimpan menggunakan metode enkripsi yang aman.
          </li>
          <li>
            <strong>Retensi Data:</strong> Data Pribadi Anda akan disimpan selama
            akun Anda aktif di dalam sistem LENTERA atau sejauh yang diperlukan
            untuk memenuhi kewajiban hukum dan pencatatan riwayat transaksi Perusahaan.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Hak Pengguna atas Data Pribadi (Penghapusan Akun)">
        <p className="mb-3">
          LENTERA menghormati hak-hak Pengguna atas Data Pribadi mereka sesuai dengan
          perundang-undangan yang berlaku:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-sm text-ink/80">
          <li>
            <strong>Pengubahan Data:</strong> Pengguna dapat memperbarui atau
            mengoreksi informasi profil dan kontak secara mandiri melalui pengaturan
            akun di situs web LENTERA.
          </li>
          <li>
            <strong>Penghapusan Akun & Data Pribadi:</strong> Pengguna memiliki hak
            penuh untuk menghapus akun pribadi mereka kapan saja secara mandiri
            melalui menu yang tersedia di sistem LENTERA.
          </li>
          <li>
            <strong>Dampak Penghapusan Akun:</strong> Setelah akun berhasil
            dihapus, akses ke platform akan dihentikan dan Data Pribadi Pengguna
            akan dihapus atau dianonimkan dari database aktif Kami, kecuali data
            riwayat transaksi yang wajib disimpan oleh Perusahaan sesuai kewajiban
            pembukuan dan peraturan hukum yang berlaku.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Perubahan Kebijakan Privasi">
        <p className="text-sm text-ink/80 leading-relaxed">
          LENTERA berhak untuk memperbarui atau mengubah Kebijakan Privasi ini
          sewaktu-waktu guna menyesuaikan dengan perkembangan layanan, teknologi,
          atau peraturan perundang-undangan di Indonesia. Setiap perubahan akan
          berlaku efektif sejak tanggal pembaruan diunggah ke situs web. Pengguna
          dianjurkan untuk memeriksa halaman ini secara berkala.
        </p>
      </LegalSection>

      <LegalSection title="9. Hubungi Kami">
        <p className="text-sm text-ink/80 leading-relaxed mb-2">
          Jika Anda memiliki pertanyaan, kendala, atau ingin menyampaikan aduan
          terkait pemrosesan Data Pribadi Anda di LENTERA, Anda dapat menghubungi kami
          melalui:
        </p>
        <p className="text-sm font-semibold text-forest">
          • Email Resmi:{" "}
          <a
            href="mailto:lentera1.idn@gmail.com"
            className="text-green hover:underline"
          >
            lentera1.idn@gmail.com
          </a>
        </p>
      </LegalSection>

      <div className="mt-8 pt-6 border-t border-forest/10 text-xs text-ink/60 text-center font-mono uppercase tracking-wider">
        Dengan mendaftarkan akun dan menggunakan layanan LENTERA, Anda
        menyatakan telah membaca, memahami, dan menyetujui seluruh isi Kebijakan
        Privasi ini.
      </div>
    </LegalShell>
  );
}