# CHANGELOG MIGRASI RYOKOURENT V2

Semua catatan perubahan formal selama siklus migrasi kode v1 (`otorent`) ke standar v2 (`D-01..D-28`).

---

## [Update D-28 / TASK-035] - 2026-10-11
### Added
- **Audit Menyeluruh 19 Dokumen Markdown & Alur Kerja Fase Uji Manual / Penyesuaian (`D-28`):**
  - Memverifikasi konsistensi seluruh 19 berkas Markdown di root dan `/docs` (termasuk melengkapi `docs/ADMIN_GUIDE.md` dan `docs/DEPLOYMENT_GUIDE.md`).
  - Menetapkan **Alur Kerja 4 Jalur (`D-28`)** di `AI_WORKFLOW.md`, `AI_RULES.md`, dan `docs/HANDOVER.md` untuk mengakomodasi tahap **Uji Manual (UAT), Update Penyesuaian Aturan, dan Permintaan Fitur Baru (Change Request)**:
    1. **Jalur 1 (Temuan Uji Manual / Bugfix UAT):** Eksekusi perbaikan langsung pada kode & penambahan skenario regresi `TESTING.md`.
    2. **Jalur 2 (Update Penyesuaian Aturan):** Pencatatan `D-XX` baru sekaligus revisi pasal `D-lama` agar tidak kontradiktif, diikuti pembaruan `DATA_MODEL.md` dan kode plugin.
    3. **Jalur 3 (Permintaan Fitur Baru / CR):** Pemeriksaan UU PDP, penambahan skema CPT/meta, registrasi `TASK-0XX`, implementasi kode, dan pembaruan panduan simulasi XAMPP.
    4. **Jalur 4 (Default `Tidak ada`):** Verifikasi regresi & pemeliharaan kesiapan produksi.

---

## [Update D-26 & D-27] - 2026-10-11
### Added
- **CPT Baru `ryokou_lacak` (Lacak Unit) — D-26:**
  - Mendaftarkan Custom Post Type `ryokou_lacak` di `includes/post-types.php` untuk melacak posisi setiap unit fisik motor secara real-time.
  - Menyediakan 3 status posisi unit:
    1. **Parkir di Pool (`parkir`):** Mencatat unit sedang terparkir di `Pool Malang` atau `Pool Batu`.
    2. **Servis di Bengkel (`servis`):** Mencatat nama bengkel, nomor kontak mekanik/bengkel, jenis pengerjaan, dan estimasi selesai servis.
    3. **Sedang Disewa (`disewa`):** Mencatat nama penyewa aktif, nomor booking (`RYK-...`), titik pengantaran, dan jadwal/tenggat kembali.
  - Sinkronisasi otomatis antara aksi operasional (`Serah Terima` $\to$ posisi `disewa`, `Selesai` $\to$ posisi `parkir`, `Tukar Unit` $\to$ tukar status unit lama & baru, `Status Servis` $\to$ posisi `servis`).
  - Tabel admin khusus di `admin/lacak-columns.php` dengan filter cepat (Semua Unit, Parkir Pool Malang, Parkir Pool Batu, Sedang Servis di Bengkel, Sedang Disewa).

### Changed
- **Pool Hanya Sebagai Tempat Parkir (Tanpa Partisi Kuota Armada) — D-26:**
  - Mengubah mesin ketersediaan di `includes/availability.php` agar tidak membagi kaku armada menjadi kuota Pool Malang dan Pool Batu.
  - Stok bebas dihitung dari total armada global per tipe motor. Saat admin melakukan **Approve**, semua unit bebas dari tipe motor tersebut ditampilkan lengkap dengan penanda posisi parkir saat ini (`Parkir: Pool Malang` / `Parkir: Pool Batu`).
- **Aturan Denda ShortRent Step-Up 60 Menit & 12 Jam = Denda Harian — D-27:**
  - Memperbarui fungsi kalkulasi denda keterlambatan (`ryokourent_calculate_overtime_penalty`) di `includes/booking.php`, kolom alert admin `admin/booking-columns.php`, dan generator pesan WhatsApp `includes/whatsapp.php`:
    - Untuk ShortRent **3 Jam, 6 Jam, 9 Jam**: Keterlambatan $\ge 60$ menit otomatis masuk ke kategori jam di atasnya:
      - Sewa **3 Jam** terlambat $\ge 60$ menit $\to$ masuk kategori **6 Jam** (denda = selisih tarif 6 jam dikurangi 3 jam).
      - Sewa **6 Jam** terlambat $\ge 60$ menit $\to$ masuk kategori **9 Jam** (denda = selisih tarif 9 jam dikurangi 6 jam).
      - Sewa **9 Jam** terlambat $\ge 60$ menit $\to$ masuk kategori **12 Jam** (denda = selisih tarif 12 jam dikurangi 9 jam).
    - Untuk ShortRent **12 Jam**: Denda keterlambatan yang dikenakan **sama dengan denda harian** (`_ryokou_denda_harian`, default Rp 20.000/jam).
  - Menambahkan kotak informasi `#ryokou_denda_shortrent_note` di `public/forms.php` yang tampil otomatis saat pelanggan memilih kategori Jam (ShortRent).

---

## [Update D-18] - 2026-10-11
### Added
- Pembaruan skema tarif menjadi 2 kategori utama + paket:
  - **Kategori Harian:** 1 Hari (24 Jam) [Tarif Utama Publik], 1 Minggu (7 Hari), 2 Minggu (14 Hari).
  - **Kategori Jam (ShortRent):** 12 Jam, 9 Jam, 6 Jam, 3 Jam.
  - **Kategori Paket:** Paket promosi dan ShortRent dinamis dari CPT `ryokou_paket`.
- Komponen dropdown cascading interaktif di kartu katalog (`public/templates.php`) dan halaman detail unit motor (`single-motor.php`).

---

## [Fase 0 s/d Fase 7] - 2026-10-10
### Added
- Fondasi dokumentasi (`DECISIONS.md`, `DATA_MODEL.md`, `ARCHITECTURE.md`, `TESTING.md`).
- Pendaftaran CPT `motor`, `ryokou_unit`, `penyewaan`, `ryokou_paket`, taksonomi `kategori_motor`, RBAC `ryokou_operator`, dan sanitasi anti-NIK 16 digit (UU PDP).
- Mesin ketersediaan stok bebas dengan jeda antar-sewa 90 menit, kunci atomik MySQL `GET_LOCK`, state machine 4 status, dan auto-purge 48 jam.
- Form publik anti-bot, integrasi WhatsApp API UTF-8, dan tema anak `generatepress-child`.
