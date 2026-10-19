# PANDUAN LENGKAP SIMULASI XAMPP WINDOWS 11 — RYOKOURENT V2 (REVISI D-26 & D-27)
**Tujuan:** Pengujian Sistem, Validasi Logika Rental (`D-01..D-27`), Simulasi CPT Lacak Unit (`ryokou_lacak`), & Pelatihan Staf Operator di Lingkungan Lokal (Offline/Localhost)  
**Sistem Operasi:** Windows 11 (64-bit)  
**Stack:** XAMPP (Apache 2.4, PHP 8.1 / 8.2, MariaDB 10.4+, WordPress LTS)

---

## DAFTAR ISI
1. [Instalasi XAMPP di Windows 11](#1-instalasi-xampp-di-windows-11)
2. [Konfigurasi & Optimasi PHP (`php.ini`)](#2-konfigurasi--optimasi-php-phpini)
3. [Konfigurasi Apache & Virtual Host (`ryokourent.local`)](#3-konfigurasi-apache--virtual-host)
4. [Pembuatan Database MySQL / MariaDB](#4-pembuatan-database)
5. [Pemasangan WordPress, Plugin & Child Theme](#5-pemasangan-wordpress--komponen-ryokourent)
6. [Konfigurasi Awal WordPress (Wajib WIB)](#6-konfigurasi-awal-wordpress)
7. [Simulasi Pelatihan Operator (Skenario Lapangan Terupdate D-26 & D-27)](#7-simulasi-pelatihan-operator)
8. [Tips Troubleshooting Windows 11](#8-tips-troubleshooting-windows-11)

---

## 1. Instalasi XAMPP di Windows 11

1. **Unduh XAMPP:**
   - Kunjungi situs resmi: `https://www.apachefriends.org/download.html`.
   - Pilih versi **XAMPP for Windows dengan PHP 8.1 atau 8.2**.
2. **Pemasangan (Penting untuk Windows 11):**
   - Jalankan installer `.exe` sebagai Administrator (`Run as administrator`).
   - Jika muncul peringatan *User Account Control (UAC)*, klik **OK**.
   - **LOKASI INSTALASI:** Pasang di **`C:\xampp`** (Jangan dipasang di `C:\Program Files` untuk menghindari masalah izin akses folder/write permission Windows).
   - Centang komponen wajib: **Apache**, **MySQL**, **PHP**, **phpMyAdmin**.
3. **Uji Coba Awal:**
   - Buka **XAMPP Control Panel**.
   - Klik tombol **Start** pada Apache dan MySQL. Pastikan kedua modul berubah warna menjadi hijau.

---

## 2. Konfigurasi & Optimasi PHP (`php.ini`)

Buka file konfigurasi PHP melalui XAMPP Control Panel:  
Klik tombol **Config** di baris **Apache** &rarr; pilih **PHP (php.ini)**  
*(atau buka langsung file `C:\xampp\php\php.ini` menggunakan Notepad / VS Code)*.

Cari baris-baris berikut dan sesuaikan nilainya:

### A. Wajib Zona Waktu WIB (Asia/Jakarta — `D-24`)
Cari `date.timezone` (sekitar baris 900), ubah menjadi:
```ini
date.timezone = Asia/Jakarta
```
> *Penting:* Menjamin jam operasional 07.00–23.00 WIB, jeda antar-sewa 90 menit, aturan keterlambatan 60 menit ShortRent (`D-27`), dan pencatatan riwayat posisi `CPT Lacak Unit` (`D-26`) berjalan presisi dalam Waktu Indonesia Barat.

### B. Alokasi Memori & Eksekusi Cepat
```ini
memory_limit = 256M
max_execution_time = 120
max_input_time = 120
post_max_size = 64M
upload_max_filesize = 64M
max_input_vars = 3000
```

### C. Ekstensi PHP Wajib
Pastikan baris berikut **tidak diawali titik koma (`;`)**:
```ini
extension=curl
extension=fileinfo
extension=gd
extension=mbstring
extension=mysqli
extension=openssl
extension=pdo_mysql
```

### D. Optimasi OPcache untuk Kecepatan Localhost
Tambahkan atau pastikan di bagian paling bawah `php.ini`:
```ini
[opcache]
zend_extension=opcache
opcache.enable=1
opcache.enable_cli=1
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=10000
opcache.revalidate_freq=2
```

> **Simpan file `php.ini`**, lalu di XAMPP Control Panel klik **Stop** kemudian **Start** pada Apache agar konfigurasi baru aktif.

---

## 3. Konfigurasi Apache & Virtual Host

Agar simulasi pelatihan menyerupai alamat website asli (misal `http://ryokourent.local`), buat Virtual Host lokal.

### Langkah 3.1: Aktifkan Virtual Host di Apache
Buka file `C:\xampp\apache\conf\httpd.conf`:
1. Cari baris `#LoadModule rewrite_module modules/mod_rewrite.so`, hilangkan tanda `#` agar menjadi:
   ```apache
   LoadModule rewrite_module modules/mod_rewrite.so
   ```
2. Cari baris `#Include conf/extra/httpd-vhosts.conf`, hilangkan tanda `#` agar menjadi:
   ```apache
   Include conf/extra/httpd-vhosts.conf
   ```
3. Simpan file `httpd.conf`.

### Langkah 3.2: Daftarkan Virtual Host Ryokourent
Buka file `C:\xampp\apache\conf\extra\httpd-vhosts.conf` dan tambahkan di baris paling bawah:

```apache
# Default Localhost
<VirtualHost *:80>
    DocumentRoot "C:/xampp/htdocs"
    ServerName localhost
</VirtualHost>

# Virtual Host Ryokourent Simulation
<VirtualHost *:80>
    DocumentRoot "C:/xampp/htdocs/ryokourent"
    ServerName ryokourent.local
    <Directory "C:/xampp/htdocs/ryokourent">
        Options Indexes FollowSymLinks MultiViews
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### Langkah 3.3: Daftarkan Domain Lokal di File Hosts Windows 11
1. Buka Start Menu, ketik **Notepad**.
2. Klik kanan pada Notepad &rarr; pilih **Run as administrator**.
3. Di Notepad, buka file: `C:\Windows\System32\drivers\etc\hosts` *(ubah filter dari Text Documents ke All Files `*.*`)*.
4. Tambahkan baris ini di baris paling akhir:
   ```text
   127.0.0.1    ryokourent.local
   ```
5. Simpan file (`Ctrl + S`).
6. Restart modul Apache di XAMPP Control Panel (**Stop** lalu **Start**).

---

## 4. Pembuatan Database

1. Buka browser dan buka alamat: `http://localhost/phpmyadmin`.
2. Klik tab **Databases / Basis Data**.
3. Masukkan nama database: **`ryokourent_db`**.
4. Pilih Collation: **`utf8mb4_unicode_ci`**.
5. Klik tombol **Create / Buat**.

---

## 5. Pemasangan WordPress & Komponen Ryokourent

### Langkah 5.1: Ekstrak WordPress
1. Unduh WordPress terbaru dari `https://wordpress.org/latest.zip`.
2. Ekstrak isi file zip ke dalam folder: **`C:\xampp\htdocs\ryokourent`**.

### Langkah 5.2: Pasang Plugin & Tema Ryokourent
Salin berkas proyek Ryokourent ke folder instalasi lokal:

1. **Plugin Core:**
   Salin folder `ryokourent-core` ke:
   ```text
   C:\xampp\htdocs\ryokourent\wp-content\plugins\ryokourent-core
   ```
2. **Tema:**
   - Pasang tema induk GeneratePress di `C:\xampp\htdocs\ryokourent\wp-content\themes\generatepress`.
   - Salin folder child theme `generatepress-child` ke:
     ```text
     C:\xampp\htdocs\ryokourent\wp-content\themes\generatepress-child
     ```

### Langkah 5.3: Jalankan Web Installer WordPress
1. Buka browser dan akses: `http://ryokourent.local/`.
2. Isi koneksi database (`ryokourent_db`, user `root`, password kosong, host `localhost`).
3. Isi judul situs `Ryokourent Rental Motor Malang & Batu` dan buat akun Administrator.

---

## 6. Konfigurasi Awal WordPress

### A. Pengaturan Waktu & Permalinks
1. Buka **Pengaturan > Umum (Settings > General)**:
   - **Zona Waktu (Timezone):** Wajib pilih **`Asia/Jakarta`** (UTC+7).
   - Format Waktu: `H:i`.
2. Buka **Pengaturan > Permalinks**:
   - Pilih **Nama Tulisan (Post name)** `/sample-post/` lalu klik **Simpan Perubahan**.

### B. Aktivasi Tema & Plugin
1. Aktifkan tema **GeneratePress Child - Ryokourent**.
2. Aktifkan plugin **Ryokourent Core** (otomatis mendaftarkan CPT `motor`, `ryokou_unit`, `ryokou_lacak`, `penyewaan`, `ryokou_paket`, dan role `ryokou_operator`).

### C. Buat Akun Operator untuk Pelatihan (`D-02`, `D-22`)
1. Buka **Pengguna > Tambah Pengguna Baru**.
2. Buat akun `operator1` dengan role **Ryokou Operator**.

---

## 7. Simulasi Pelatihan Operator (Skenario Lapangan Terupdate `D-26` & `D-27`)

### Skenario 1: Input Master Motor (2 Kategori Tarif `D-18`) & Unit Fisik (`D-12`)
1. **Buat Master Motor:**
   - Buka **Katalog Motor > Tambah Jenis Motor**.
   - Judul: `Honda Beat CBS 2022`.
   - Tarif Harian (1 Hari / 24 Jam): `80000` (Tampil utama di katalog).
   - Tarif ShortRent: 3 Jam = `35000`, 6 Jam = `50000`, 9 Jam = `65000`, 12 Jam = `70000`.
   - Denda Harian per Jam (`_ryokou_denda_harian`): `20000`.
   - Klik **Terbitkan**.
2. **Buat Unit Fisik & Cek Sinkronisasi Awal `Lacak Unit` (`D-26`):**
   - Buka **Katalog Motor > Unit Fisik > Tambah Unit Fisik**.
   - Kode Unit: `B122`, Jenis Induk: `Honda Beat CBS 2022`, Lokasi Parkir Awal: `Pool Malang`, Plat: `N 4521 AB`.
   - Buat unit kedua `B222` dengan Lokasi Parkir Awal: `Pool Batu`.
   - *Verifikasi:* Buka menu **Lacak Unit (Posisi)** &rarr; terlihat `B122` berstatus **Parkir di Pool (Pool Malang)** dan `B222` berstatus **Parkir di Pool (Pool Batu)**.

---

### Skenario 2: Simulasi Stok Global Tanpa Partisi Kuota Pool (`D-26`) & Stok Biner (`D-05`)
1. Buka halaman depan website `http://ryokourent.local/`.
2. Pilih motor `Honda Beat CBS 2022` dan pilih titik pengambilan `Parkir Pool Malang`.
3. Karena Pool hanya berfungsi sebagai tempat parkir fisik (`D-26`), seluruh unit aktif (`B122` dan `B222`) dihitung sebagai stok global yang tersedia.
4. Indikator ketersediaan hanya menampilkan status biner tegas: **`Tersedia` (Hijau)** atau **`Habis` (Merah)** tanpa membocorkan jumlah unit (`D-05`).
5. Pilih kategori **ShortRent / Paket Jam** &rarr; durasi **3 Jam**.
   - *Perhatikan:* Muncul kotak informasi otomatis mengenai aturan keterlambatan ShortRent (`#ryokou_denda_shortrent_note`).
6. Isi nama `Dian Pratama`, jenis ID `KTM`, lalu klik **Lanjutkan Pemesanan via WhatsApp**.

---

### Skenario 3: Alur Operator — Approve, Serah Terima, & Sinkronisasi Otomatis `CPT Lacak Unit` (`D-26`)
1. Login sebagai `operator1`, buka menu **Penyewaan**.
2. Klik **Approve** pada booking `Dian Pratama`:
   - Dropdown menampilkan seluruh unit bebas beserta posisi parkirnya saat ini:
     - `B122 (Hitam) — Parkir: Pool Malang`
     - `B222 (Merah) — Parkir: Pool Batu`
   - Pilih `B122` lalu klik **Setujui & Kunci Unit**.
3. Saat pelanggan menerima motor, klik **Serah Terima**:
   - Status pesanan berubah menjadi **`Disewa`**.
   - Buka menu **Lacak Unit (Posisi)** (`CPT ryokou_lacak`):
     - Posisi unit `B122` otomatis berubah menjadi **🛵 Sedang Disewa** pada kolom *Jika Posisi Sewa: Disewa Siapa* tercatat **Dian Pratama (`RYK-...`)** beserta tenggat kembalinya!

---

### Skenario 4: Simulasi Unit Masuk Bengkel di `CPT Lacak Unit` (`D-26`)
1. Buka menu **Lacak Unit (Posisi)**.
2. Pada unit `B222`, ubah posisi menjadi **Servis di Bengkel**:
   - Nama Bengkel: `AHASS Soekarno Hatta Malang`
   - Kontak Mekanik/Bengkel: `0812-3344-5566 (Pak Hendra)`
   - Estimasi Selesai: `Besok 16:00 WIB`
3. Simpan perubahan &rarr; Tabel **Lacak Unit** langsung menampilkan di bengkel mana unit `B222` berada, dan unit tersebut otomatis dikecualikan dari stok bebas.

---

### Skenario 5: Simulasi Denda ShortRent Step-Up 60 Menit & 12 Jam = Harian (`D-27`)
1. **Uji Sewa 3 Jam Terlambat 60 Menit:**
   - Pada pesanan ShortRent **3 Jam** (Tarif Rp 35.000), simulasikan pengembalian terlambat **60 menit** (total pakai 4 jam).
   - Sesuai **`D-27`**, keterlambatan 60 menit otomatis masuk ke **kategori jam di atasnya** yaitu **6 Jam** (Tarif Rp 50.000).
   - Kolom **Status Overtime & Denda (`D-27`)** di admin menampilkan:
     `🔺 Terlambat 60 menit (>= 60 mnt): Sewa 3 Jam masuk kategori 6 Jam (Selisih Tarif Rp 15.000) — Total Denda: Rp 15.000`.
2. **Uji Sewa 12 Jam Terlambat 60 Menit:**
   - Pada pesanan ShortRent **12 Jam**, simulasikan keterlambatan **60 menit** (1 jam).
   - Sesuai **`D-27`**, denda yang dikenakan pada paket 12 jam **sama dengan denda harian** (`Rp 20.000/jam`).
   - Kolom admin menampilkan:
     `⚠️ ShortRent 12 Jam Terlambat 60 menit (1 jam) — Denda = Denda Harian (Rp 20.000/jam): Total Denda Rp 20.000`.
3. **Selesai Sewa & Kembali Parkir di Pool:**
   - Klik tombol **Selesai** dan pilih pool tempat motor diparkir kembali (misal `Pool Malang`).
   - Status di **Lacak Unit (`ryokou_lacak`)** otomatis kembali menjadi **🅿️ Parkir di Pool (Pool Malang)**.

---

## 8. Tips Troubleshooting Windows 11

| Kendala | Penyebab Umum | Solusi Cepat |
| :--- | :--- | :--- |
| **Apache error / Port 80 bentrok** | Dipakai oleh IIS Windows / World Wide Web Publishing Service | Buka `services.msc`, cari **World Wide Web Publishing Service**, klik **Stop** dan ubah Startup type ke **Disabled**. |
| **Domain `ryokourent.local` tidak bisa dibuka** | Belum terdaftar di file `hosts` Windows | Edit `C:\Windows\System32\drivers\etc\hosts` sebagai Administrator, tambahkan `127.0.0.1 ryokourent.local`. |
| **Zona waktu tidak sesuai (WIB)** | `php.ini` atau WordPress belum diset ke `Asia/Jakarta` | Pastikan `date.timezone = Asia/Jakarta` di `php.ini` dan di WP **Pengaturan > Umum** diset ke `Asia/Jakarta`. |
