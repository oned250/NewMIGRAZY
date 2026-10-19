# DATA MODEL RYOKOURENT (VERSI 2 — REVISI D-26 & D-27)

**Status:** Aktif  
**Basis:** Keputusan `D-01..D-27` dan Konsistensi Penamaan `otorent`

---

## 1. Ikhtisar Penamaan CPT & Tabel

Untuk meminimalkan risiko refaktor dan mempertahankan stabilitas kode `otorent`, penamaan CPT dan meta tetap memakai prefix `ryokourent_` / `_ryokou_*` dengan tambahan CPT `ryokou_lacak` (D-26):

| Entitas | Nama CPT | Deskripsi |
| :--- | :--- | :--- |
| **Katalog Jenis Motor** | `motor` | Master tipe/model motor (Vario, Beat, NMax, dll), spesifikasi, tarif harian & ShortRent. |
| **Unit Fisik** | `ryokou_unit` | Master unit riil di garasi: `kode_unit`, plat nomor, warna, status servis, lokasi parkir pool. |
| **Lacak Unit (Baru D-26)** | `ryokou_lacak` | Pelacakan posisi real-time unit fisik: parkir di Pool mana, servis di Bengkel mana, atau disewa oleh siapa. |
| **Penyewaan / Booking** | `penyewaan` | Transaksi sewa 4 status (`Booking`, `Approve Booking`, `Disewa`, `Selesai`). |
| **Paket Dinamis** | `ryokou_paket` | Paket ShortRent & musiman (informasi katalog untuk chat WA). |

---

## 2. Skema CPT `motor` (Katalog Master Jenis)

Post Type: `motor` (Public, Hierarchical: false)  
Taxonomy: `kategori_motor` (Matic, Sport, Trail, Retro)

### Meta Fields:
- `_ryokou_harga_harian` (integer): Tarif sewa 1 hari (24 jam) dalam Rupiah [Tarif Utama Publik].
- `_ryokou_harga_1minggu` (integer, opsional): Tarif sewa 1 minggu (7 hari).
- `_ryokou_harga_2minggu` (integer, opsional): Tarif sewa 2 minggu (14 hari).
- `_ryokou_harga_12jam` (integer, opsional): Tarif ShortRent 12 jam.
- `_ryokou_harga_9jam` (integer, opsional): Tarif ShortRent 9 jam.
- `_ryokou_harga_6jam` (integer, opsional): Tarif ShortRent 6 jam.
- `_ryokou_harga_3jam` (integer, opsional): Tarif ShortRent 3 jam.
- `_ryokou_denda_harian` (integer, opsional): Tarif denda keterlambatan per jam untuk **Kategori Harian** dan **ShortRent 12 Jam** (default: Rp 20.000/jam, sesuai D-27).
- `_ryokou_denda_jam` (integer, opsional): Catatan/cadangan denda jam (untuk ShortRent 3/6/9 jam berlaku sistem **step-up ke kategori jam di atasnya** saat terlambat $\ge 60$ menit sesuai D-27).
- `_ryokou_harga_mingguan_text` (string, default: "Rp [Tanya Admin]"): Teks tampilan harga mingguan publik.
- `_ryokou_harga_bulanan_text` (string, default: "Rp [Tanya Admin]"): Teks tampilan harga bulanan publik.
- `_ryokou_fasilitas` (array serialized): Helm SNI, jas hujan, holder HP, dll.
- `_ryokou_spesifikasi` (array serialized): CC mesin, tahun rilis, kapasitas tangki.

---

## 3. Skema CPT `ryokou_unit` (Unit Fisik Lapangan)

Post Type: `ryokou_unit` (Private/Admin Only, Hierarchical: false)

### Meta Fields:
- `_ryokou_kode_unit` (string, **UNIK & READONLY setelah dibuat**): Format penamaan internal pemilik (misal `B122` = Beat unit pertama beli tahun 2022).
- `_ryokou_parent_motor_id` (integer): ID CPT `motor` yang menjadi jenis induk unit ini.
- `_ryokou_pool_lokasi` (string): Lokasi parkir pool saat unit sedang tidak disewa/servis (`malang` atau `batu`). Pool hanya sebagai tempat parkir fisik, bukan pemisah kuota armada (D-26).
- `_ryokou_nomor_plat` (string): Nomor polisi riil (misal `N 1234 ABC`). Private, tidak tampil di REST publik.
- `_ryokou_warna` (string): Warna fisik motor (Hitam, Merah, Putih).
- `_ryokou_status_servis` (string: `aktif` | `servis`): Flag status servis operasional unit.
- `_ryokou_nama_bengkel` (string): Nama bengkel tempat servis jika unit sedang servis (D-26).
- `_ryokou_km_terakhir` (integer): Catatan kilometer odometer saat ganti oli/servis terakhir.
- `_ryokou_tgl_servis_terakhir` (string `YYYY-MM-DD`): Tanggal riil servis terakhir dilakukan.
- `_ryokou_catatan_unit` (string): Catatan teknis staf (kondisi ban, riwayat tukar unit).

### Status Post Unit Fisik:
- `publish` (Aktif beroperasi)
- `ryokou_servis` (Unit sedang masuk bengkel / perawatan)

---

## 4. Skema CPT `ryokou_lacak` (Lacak Unit — Baru sesuai D-26)

Post Type: `ryokou_lacak` (Private/Admin Only, Menu: di bawah Katalog Motor & Penyewaan)  
Tujuan: Melacak posisi real-time dan riwayat pergerakan setiap unit fisik tanpa membagi armada menjadi kuota Pool Malang vs Pool Batu.

### Meta Fields:
- `_ryokou_lacak_unit_id` (integer, wajib): ID CPT `ryokou_unit` yang dilacak.
- `_ryokou_lacak_kode_unit` (string): Snapshot `kode_unit` (contoh `B122`).
- `_ryokou_lacak_motor_id` (integer): ID CPT `motor` induk.
- `_ryokou_lacak_status_posisi` (string: `parkir` | `servis` | `disewa`):
  1. `parkir` — Unit sedang terparkir dan siap jalan.
  2. `servis` — Unit sedang berada di bengkel untuk perawatan/perbaikan.
  3. `disewa` — Unit sedang dibawa oleh penyewa aktif.
- `_ryokou_lacak_pool_parkir` (string: `malang` | `batu` | `-`): Menunjukkan unit berada di tempat parkir Pool mana (`Pool Malang` atau `Pool Batu`) saat status `parkir` (atau pool asal terakhir).
- `_ryokou_lacak_nama_bengkel` (string): Nama & lokasi bengkel tempat unit diservis jika status `servis` (contoh: "AHASS Soekarno Hatta Malang").
- `_ryokou_lacak_kontak_bengkel` (string): Nomor telepon/WA mekanik atau bengkel.
- `_ryokou_lacak_estimasi_selesai_servis` (string `YYYY-MM-DD HH:MM`): Estimasi kapan unit selesai dari bengkel.
- `_ryokou_lacak_booking_id` (integer): ID CPT `penyewaan` aktif jika status `disewa`.
- `_ryokou_lacak_no_booking` (string): Nomor booking aktif (contoh `RYK-20261011-001`).
- `_ryokou_lacak_nama_penyewa` (string): Nama penyewa yang sedang memegang unit jika status `disewa`.
- `_ryokou_lacak_tenggat_kembali` (string `YYYY-MM-DD HH:MM`): Jadwal/tenggat pengembalian unit dari penyewa.
- `_ryokou_lacak_catatan` (string): Catatan posisi/kondisi lapangan.
- `_ryokou_lacak_updated_at` (integer): Timestamp UTC pembaruan posisi terakhir.
- `_ryokou_lacak_updated_by` (string): Nama staf/operator yang terakhir memperbarui posisi.

---

## 5. Skema CPT `penyewaan` (Transaksi Sewa & Booking)

Post Type: `penyewaan` (Private/Admin Only, Autosave & Revisions Disabled)

### Status Booking (Post Status):
1. `ryokou_booking` (Label UI: "Booking" - pemesanan baru dari web, belum mengunci unit)
2. `ryokou_approved` (Label UI: "Approve Booking" - unit dialokasikan, stok terkunci)
3. `ryokou_disewa` (Label UI: "Disewa" - serah terima fisik dilakukan, otomatis mengupdate CPT `ryokou_lacak` ke posisi `disewa`)
4. `ryokou_selesai` (Label UI: "Selesai" - dikembalikan ke pool parkir, otomatis mengupdate CPT `ryokou_lacak` ke posisi `parkir`)

### Meta Fields Tersimpan:
- `_ryokou_no_booking` (string, unik): Format `RYK-YYYYMMDD-XXX` (pencacah atomik WIB).
- `_ryokou_nama` (string, disanitasi): Nama lengkap penyewa (disimpan permanen untuk pelanggan rutin).
- `_ryokou_tanda_pelanggan` (string): Tag / penanda pelanggan setia (contoh: "Dian Malang").
- `_ryokou_jenis_id_pendukung` (string pilihan tetap): `KTM`, `SIM_C`, `SIM_A`, `PASPOR`, `NPWP`, `ID_KARYAWAN`, `LAINNYA`.
- `_ryokou_alamat_pengantaran` (string): Lokasi titik antar / ambil.
- `_ryokou_alamat_penjemputan` (string): Lokasi titik jemput / parkir kembali.
- `_ryokou_pool` (string: `malang` | `batu`): Preferensi titik parkir/pengambilan (`Pool Malang` atau `Pool Batu`). Tidak membatasi stok armada.
- `_ryokou_motor_id` (integer): ID CPT `motor` (jenis motor yang dipesan).
- `_ryokou_snapshot_nama_motor` (string): Snapshot nama tipe motor saat booking disetujui.
- `_ryokou_unit_id` (integer, null jika masih `Booking`): ID CPT `ryokou_unit` yang dialokasikan.
- `_ryokou_snapshot_kode_unit` (string): Snapshot `kode_unit` fisik saat disetujui.
- `_ryokou_jam_tanggal_mulai` (string `YYYY-MM-DD HH:MM`): Jadwal rencana mulai (WIB).
- `_ryokou_jam_tanggal_selesai` (string `YYYY-MM-DD HH:MM`): Jadwal rencana selesai (WIB).
- `_ryokou_start_epoch` (integer): Timestamp UTC unix epoch rencana mulai.
- `_ryokou_end_epoch` (integer): Timestamp UTC unix epoch rencana selesai.
- `_ryokou_disewa_at` (integer/timestamp): Waktu riil penyerahan kunci (WIB).
- `_ryokou_selesai_at` (integer/timestamp): Waktu riil pengembalian unit fisik.
- `_ryokou_riwayat_tukar_unit` (array serialized): Log tukar unit (waktu, unit lama, unit baru, alasan, km).
- `_ryokou_durasi_hari` (integer): Durasi sewa dalam hari.
- `_ryokou_kategori_tarif` (string: `harian` | `jam` | `paket` | `kustom`): Kategori paket/durasi terpilih.
- `_ryokou_pilihan_durasi` (string): Kunci durasi (`1_hari`, `1_minggu`, `2_minggu`, `12_jam`, `9_jam`, `6_jam`, `3_jam`, atau ID paket).
- `_ryokou_label_durasi` (string): Label durasi terformat.
- `_ryokou_total_harga_estimasi` (integer): Estimasi total tarif sewa sesuai paket/durasi terpilih.
- `_ryokou_created_at` (integer): Timestamp UTC pembuatan booking.

---

## 6. Definisi & Rumus Ketersediaan Stok Bebas (Global Tanpa Partisi Pool — D-26) & Aturan Denda ShortRent (D-27)

### 6.1 Rumus Ketersediaan Stok Bebas Global
Karena Pool Malang dan Pool Batu hanya berfungsi sebagai tempat parkir fisik (bukan pembagi kuota armada), stok bebas jenis motor $J$ untuk rentang waktu $[T_{mulai}, T_{selesai}]$ dihitung dari **seluruh unit fisik aktif jenis $J$ ($U_J$)**:

$$\text{Stok Tersedia}(J) = \left| \{ u \in U_{J} \mid u \text{ tidak servis} \land \forall b \in B_u, \text{TidakAdaBentrok}(b, T_{mulai}, T_{selesai}) \} \right|$$

Di mana:
1. $U_{J}$ adalah seluruh unit fisik tipe $J$ di garasi (baik yang sedang parkir di Pool Malang maupun Pool Batu).
2. Saat admin menekan **Approve**, dropdown menampilkan seluruh unit bebas beserta label lokasi parkirnya saat ini (misal: `B122 — Parkir: Pool Malang`, `B222 — Parkir: Pool Batu`) agar staf mudah memilih unit terdekat.
3. Jeda antar-sewa 90 menit ($Jeda = 5400$ detik) dihitung pada kedua sisi rentang jadwal:
   $$(T_{mulai} - Jeda < T_{akhir\_efektif}(b)) \land (T_{selesai} + Jeda > T_{mulai}(b))$$
4. Untuk status `Disewa`, akhir efektif adalah $T_{akhir\_efektif} = \max(\text{Tenggat Terjadwal}, \text{Waktu Sekarang})$.

### 6.2 Rumus Denda ShortRent (D-27)
Untuk penyewaan kategori `jam` (ShortRent):
1. **Durasi 3 Jam, 6 Jam, 9 Jam (Step-Up 60 Menit):**
   - Jika keterlambatan $\Delta t \ge 60\text{ menit}$, maka paket sewa otomatis naik ke kategori jam di atasnya:
     - **3 Jam** + terlambat $\ge 60$ menit $\longrightarrow$ masuk kategori **6 Jam** ($\text{Denda} = \text{Tarif}_{6\text{jam}} - \text{Tarif}_{3\text{jam}}$).
     - **6 Jam** + terlambat $\ge 60$ menit $\longrightarrow$ masuk kategori **9 Jam** ($\text{Denda} = \text{Tarif}_{9\text{jam}} - \text{Tarif}_{6\text{jam}}$).
     - **9 Jam** + terlambat $\ge 60$ menit $\longrightarrow$ masuk kategori **12 Jam** ($\text{Denda} = \text{Tarif}_{12\text{jam}} - \text{Tarif}_{9\text{jam}}$).
   - Apabila keterlambatan terus berlanjut melewati batas durasi kategori baru + 60 menit berikutnya, maka naik lagi ke jenjang di atasnya secara berurutan ($3\text{j} \to 6\text{j} \to 9\text{j} \to 12\text{j}$).
2. **Durasi 12 Jam (Sama dengan Denda Harian):**
   - Untuk sewa **12 Jam** (atau sewa ShortRent yang sudah naik ke 12 Jam dan masih terlambat), denda keterlambatan yang dikenakan **sama dengan denda harian** (`_ryokou_denda_harian`, default Rp 20.000/jam).
