import { LegalShell, LegalSection } from "@/components/legal/legal-shell";

export default function SyaratKetentuanPage() {
  return (
    <LegalShell title="Syarat & Ketentuan">
      <p className="text-xs text-ink/60 -mt-2 mb-6 italic">
        Terakhir Diperbarui: 2 September 2026
      </p>

      <div className="text-sm text-ink/80 leading-relaxed space-y-4 mb-6">
        <p>
          Selamat datang di <strong>LENTERA</strong>. Syarat dan Ketentuan
          (&quot;Perjanjian&quot;) ini merupakan perjanjian hukum yang sah dan
          mengikat antara Anda (baik sebagai &quot;Industri&quot; maupun
          &quot;Mitra&quot;) dan LENTERA (&quot;Kami&quot;, &quot;Perusahaan&quot;,
          atau &quot;Platform&quot;). Perjanjian ini mengatur akses dan penggunaan
          Anda terhadap situs web LENTERA, layanan pengelolaan limbah, serta
          seluruh transaksi jual-beli yang difasilitasi di dalam sistem Kami.
        </p>
        <p>
          Dengan mendaftar, mengakses, atau menggunakan layanan di website
          LENTERA, Anda menyatakan bahwa Anda telah membaca, memahami, dan
          menyutujui seluruh isi Syarat dan Ketentuan ini tanpa pengecualian.
          Jika Anda tidak menyetujui salah satu, sebagian, atau seluruh isi
          dokumen ini, Anda tidak diperkenankan untuk menggunakan layanan Kami.
        </p>
      </div>

      <LegalSection title="1. Definisi">
        <ul className="list-disc pl-5 space-y-2 text-sm text-ink/80">
          <li>
            <strong>LENTERA:</strong> Adalah platform digital yang bergerak di
            bidang jasa pengelolaan limbah, bertindak sebagai perantara dan
            pengelola yang membeli limbah dari pihak Industri, memprosesnya, dan
            menjual hasil olahan limbah tersebut.
          </li>
          <li>
            <strong>Pengguna:</strong> Adalah setiap individu atau badan hukum
            yang mengakses, mendaftar, dan menggunakan layanan website LENTERA,
            yang terdiri dari Industri dan Mitra.
          </li>
          <li>
            <strong>Industri:</strong> Adalah pihak Pengguna penyedia atau
            penjual bahan limbah (material belum diolah) kepada LENTERA.
          </li>
          <li>
            <strong>Mitra:</strong> Adalah pihak Pengguna yang bertindak sebagai
            pembeli material limbah yang telah diolah oleh LENTERA, di mana Mitra
            juga memiliki hak dan kapasitas untuk menjual kembali produk limbah
            yang telah mereka beli atau kelola lebih lanjut.
          </li>
          <li>
            <strong>Layanan:</strong> Meliputi segala bentuk aktivitas yang
            disediakan oleh LENTERA, termasuk namun tidak terbatas pada
            pembelian, pengelolaan, penjualan limbah, dan penyediaan sistem
            elektronik berbasis web.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Pendaftaran dan Akun Pengguna">
        <ul className="list-disc pl-5 space-y-2 text-sm text-ink/80">
          <li>
            <strong>Kewajiban Pendaftaran:</strong> Penggunaan fitur, layanan,
            maupun segala bentuk aktivitas transaksi di dalam website LENTERA
            mutlak mewajibkan Pengguna untuk melakukan pendaftaran akun terlebih
            dahulu. Pengunjung yang tidak mendaftarkan akun tidak diberikan akses
            untuk melakukan aktivitas apa pun.
          </li>
          <li>
            <strong>Akurasi Data:</strong> Pengguna wajib memberikan informasi yang
            akurat, lengkap, dan terkini pada saat pendaftaran, termasuk
            identitas perusahaan/pribadi dan perizinan yang sah jika diperlukan.
          </li>
          <li>
            <strong>Keamanan Akun:</strong> Pengguna bertanggung jawab penuh atas
            kerahasiaan kata sandi (password) dan seluruh aktivitas yang terjadi
            di bawah akun tersebut. LENTERA dibebaskan dari segala tuntutan yang
            timbul akibat kelalaian Pengguna dalam menjaga keamanan akunnya.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Ketentuan Layanan dan Transaksi">
        <p className="mb-3">
          LENTERA menjalankan model bisnis yang mengintegrasikan jasa pengelolaan
          limbah dan sirkulasi perdagangan berkelanjutan. Transaksi berjalan melalui
          siklus berikut:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-sm text-ink/80">
          <li>
            <strong>Arus Pembelian dari Industri:</strong> LENTERA membeli limbah
            sisa produksi atau material mentah dari pihak Industri untuk kemudian
            diolah oleh sistem atau fasilitas pengelolaan Kami.
          </li>
          <li>
            <strong>Arus Penjualan kepada Mitra:</strong> LENTERA memasarkan dan
            menjual produk limbah yang telah dikelola atau diproses kepada
            Mitra-mitra terdaftar, di mana Mitra dapat memanfaatkannya untuk
            keperluan lanjutan atau menjualnya kembali.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Kebijakan Harga dan Pembayaran">
        <ul className="list-disc pl-5 space-y-2 text-sm text-ink/80">
          <li>
            <strong>Sistem Pembayaran 100% Online:</strong> LENTERA memberlakukan
            sistem transaksi digital penuh (cashless). Kami tidak menerima
            pembayaran tunai (cash).
          </li>
          <li>
            <strong>Metode Pembayaran:</strong> Seluruh transaksi hanya dapat
            dilakukan melalui metode pembayaran daring yang terintegrasi di
            dalam website, meliputi: Transfer Bank (Virtual Account), Kartu
            Kredit, dan dompet digital (E-Wallet).
          </li>
          <li>
            <strong>Pajak dan Biaya Layanan (Khusus Transaksi Penjualan):</strong>{" "}
            Harga produk olahan yang dijual kepada Mitra akan dikenakan biaya
            tambahan sebesar 10% hingga 15% dari harga dasar barang. Biaya ini
            merupakan komponen tak terpisahkan yang sudah mencakup tanggungan
            Pajak, Biaya Pengiriman (Ongkos Kirim), serta Biaya Pemeliharaan
            Sistem (Maintenance Fee).
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Kebijakan Pengiriman dan Risiko Barang">
        <p className="mb-3">
          LENTERA melayani cakupan pengiriman ke seluruh wilayah Republik
          Indonesia. Mengingat fluktuasi logistik dan sifat material limbah,
          Perusahaan tidak memberikan estimasi waktu pengiriman yang spesifik.
          Waktu tiba sangat bergantung pada jarak, lokasi, dan armada ekspedisi.
        </p>
        <p className="mb-2 font-medium text-forest">
          Terkait asuransi dan peralihan risiko selama masa pengiriman barang,
          LENTERA menetapkan batasan tanggung jawab sebagai berikut:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-sm text-ink/80">
          <li>
            <strong>Transaksi dari Industri ke LENTERA:</strong> Apabila terjadi
            kendala selama masa pengiriman limbah dari lokasi Industri menuju
            fasilitas LENTERA yang mengakibatkan barang hilang, rusak, atau
            musnah, pihak Industri dibebaskan dari segala bentuk kerugian. Seluruh
            beban risiko dan kerugian material yang timbul dalam tahap pengiriman ini
            secara penuh diambil alih dan menjadi tanggung jawab LENTERA.
          </li>
          <li>
            <strong>Transaksi dari LENTERA ke Mitra:</strong> Apabila terjadi
            kendala selama masa pengiriman limbah olahan dari LENTERA menuju lokasi
            Mitra yang mengakibatkan barang tersebut hilang atau terbukti tidak
            sampai ke lokasi tujuan, LENTERA akan memberikan kompensasi kepada
            pihak Mitra terkait sesuai dengan prosedur investigasi internal Kami.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Pembatalan Pesanan dan Pengembalian Barang (Return)">
        <p className="mb-3">
          Kami menerapkan aturan purnajual yang ketat guna menjaga kelancaran
          operasional pengelolaan limbah:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-sm text-ink/80">
          <li>
            <strong>Kebijakan Pembatalan (Cancellation):</strong>
            <ul className="list-circle pl-5 mt-1 space-y-1">
              <li>
                Pembatalan pesanan hanya dapat dilakukan apabila status
                transaksi masih berada dalam tahap &quot;Pending&quot; (Menunggu
                Pembayaran atau Belum Diproses).
              </li>
              <li>
                Apabila pesanan telah memasuki status &quot;Proses Pengiriman&quot;
                (barang sudah diserahkan ke armada pengiriman/logistik), maka
                pesanan bersifat final dan tidak dapat dibatalkan dengan alasan
                apa pun.
              </li>
            </ul>
          </li>
          <li>
            <strong>Kebijakan Pengembalian Barang (No Return Policy):</strong>
            <ul className="list-circle pl-5 mt-1 space-y-1">
              <li>
                LENTERA menerapkan kebijakan <strong>TIDAK MENERIMA PENGEMBALIAN BARANG SAMA SEKALI</strong>.
              </li>
              <li>
                Setelah barang hasil olahan diterima dari armada pengiriman,
                transaksi dianggap selesai. Tidak ada klaim pengembalian (retur)
                produk yang diizinkan dengan alasan apa pun. Pengguna diimbau untuk
                memverifikasi pesanan dengan cermat sebelum menyelesaikan pembayaran.
              </li>
            </ul>
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Hak Kekayaan Intelektual">
        <p className="text-sm text-ink/80 leading-relaxed">
          Seluruh konten yang terdapat di dalam website LENTERA, termasuk namun
          tidak terbatas pada desain, teks, grafis, logo, ikon, kode program (source
          code), dan perangkat lunak, adalah hak milik eksklusif LENTERA dan
          dilindungi oleh hukum Hak Cipta dan Kekayaan Intelektual Republik
          Indonesia. Pengguna dilarang keras untuk menyalin, mereproduksi, atau
          mendistribusikan elemen-elemen tersebut tanpa izin tertulis dari LENTERA.
        </p>
      </LegalSection>

      <LegalSection title="8. Batasan Tanggung Jawab">
        <ul className="list-disc pl-5 space-y-2 text-sm text-ink/80">
          <li>
            LENTERA menyediakan platform ini sebagaimana adanya (as is) dan
            sebagaimana tersedia (as available). Kami tidak memberikan jaminan
            bahwa situs web akan selalu beroperasi tanpa gangguan atau bebas dari
            bug dan kendala teknis, meskipun Kami akan terus melakukan upaya terbaik
            untuk menjaga keandalan sistem.
          </li>
          <li>
            LENTERA tidak bertanggung jawab atas kerugian tidak langsung, kerugian
            insidental, atau kerugian konsekuensial (termasuk hilangnya potensi
            keuntungan bisnis) yang dialami Pengguna akibat penggunaan layanan di
            dalam website Kami.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="9. Yurisdiksi dan Hukum yang Berlaku">
        <p className="text-sm text-ink/80 leading-relaxed">
          Syarat dan Ketentuan ini, beserta segala bentuk perjanjian operasional
          yang ada di dalamnya, diatur, ditafsirkan, dan tunduk pada Hukum Negara
          Kesatuan Republik Indonesia, termasuk namun tidak terbatas pada
          perundang-undangan di bidang Informasi dan Transaksi Elektronik. Apabila
          terjadi perselisihan atau sengketa yang timbul dari pelaksanaan layanan,
          para pihak sepakat untuk menyelesaikannya secara musyawarah untuk mufakat
          terlebih dahulu, sebelum menempuh jalur hukum sesuai yurisdiksi pengadilan
          di Indonesia.
        </p>
      </LegalSection>

      <LegalSection title="10. Pembaruan Syarat dan Ketentuan">
        <p className="text-sm text-ink/80 leading-relaxed">
          LENTERA memiliki hak mutlak untuk mengubah, memodifikasi, menambah, atau
          menghapus bagian mana pun dari Syarat dan Ketentuan ini kapan saja tanpa
          pemberitahuan langsung sebelumnya kepada Pengguna. Perubahan tersebut akan
          berlaku secara efektif segera setelah diunggah ke dalam website. Pengguna
          disarankan untuk meninjau halaman ini secara berkala.
        </p>
      </LegalSection>

      <LegalSection title="11. Layanan Pengaduan dan Kontak Kami">
        <p className="text-sm text-ink/80 leading-relaxed mb-2">
          Apabila Anda memiliki pertanyaan, kendala, atau membutuhkan informasi lebih
          lanjut mengenai Syarat dan Ketentuan ini atau layanan LENTERA, Anda dapat
          menghubungi tim Layanan Pelanggan (Customer Service) Kami secara tertulis
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
        <p className="text-xs text-ink/60 mt-1 italic">
          (Layanan operasional komunikasi dan pengaduan saat ini hanya dilayani
          secara eksklusif melalui surat elektronik/email).
        </p>
      </LegalSection>

      <div className="mt-8 pt-6 border-t border-forest/10 text-xs text-ink/60 text-center font-mono uppercase tracking-wider">
        Dengan membuat akun dan menggunakan website LENTERA, Anda menyatakan
        secara sadar bahwa Anda menerima seluruh syarat dan ketentuan ini dan
        bersedia tunduk kepada hukum yang berlaku.
      </div>
    </LegalShell>
  );
}