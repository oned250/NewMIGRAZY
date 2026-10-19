# PANDUAN ADMINISTRATOR SISTEM RYOKOURENT

**Versi:** 2.1.0 (Selaras Keputusan `D-01..D-28`)  
**Peran Pengguna:** `administrator`

---

## 1. Konfigurasi Sistem & Pengaturan WhatsApp (`D-09`, `D-23`)

1. **Pengaturan Nomor WhatsApp:**
   - Masuk ke menu **Katalog Motor > Pengaturan & WA**.
   - Masukkan nomor WhatsApp bisnis admin dalam format internasional diawali `62` (contoh: `6281234567890`).
   - Setiap perubahan nomor WA otomatis mencatat nama staf dan waktu perubahan WIB di audit log sistem (`D-23`).

2. **Jeda Antar-Sewa (*Turnaround Buffer* — `D-17`):**
   - Nilai default: `90` menit (`5400` detik).
   - Menentukan jeda aman pembersihan/inspeksi motor antara jadwal sewa yang selesai dengan sewa berikutnya pada unit fisik yang sama.

3. **Penyesuaian Harga Massal (*Bulk Pricing* — `D-09`, `D-22`):**
   - Mengizinkan penyesuaian harga seluruh katalog motor naik/turun dengan persentase `-50%` s/d `+200%` dan pembulatan otomatis ke kelipatan Rp 1.000 terdekat.

---

## 2. Pengelolaan Unit Fisik (`ryokou_unit`) & Pelacakan Posisi (`ryokou_lacak` — `D-26`)

1. **Master Unit Fisik (`Katalog Motor > Unit Fisik`):**
   - Masukkan kode unit internal (misal `B122` untuk Beat unit 1 tahun 2022). Setelah disimpan, `kode_unit` dikunci *readonly* permanen (`D-12`).
   - Pool Malang dan Pool Batu hanya berfungsi sebagai tempat parkir fisik, bukan pembagi kuota armada (`D-26`).
2. **Menu Lacak Unit (`Lacak Unit (Posisi)` — `CPT ryokou_lacak`):**
   - Digunakan untuk memantau posisi real-time seluruh unit armada:
     - **Parkir di Pool:** Berada di `Pool Malang` atau `Pool Batu`.
     - **Servis di Bengkel:** Berada di bengkel mana, nomor kontak mekanik, dan estimasi selesai.
     - **Sedang Disewa:** Disewa oleh siapa, nomor booking (`RYK-...`), dan jadwal kembali.

---

## 3. Tugas Terjadwal (WP-Cron 48 Jam — `D-14`)

- Hook: `ryokourent_cron_purge_unapproved` (`twicedaily`) + *Lazy Purge* saat tabel admin dibuka.
- Menghapus otomatis pemesanan berstatus `Booking` yang tidak di-approve dalam waktu $> 48$ jam.
