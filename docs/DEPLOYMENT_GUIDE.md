# PANDUAN DEPLOYMENT PRODUKSI RYOKOURENT (VERSI 2.1)

**Status:** Panduan Utama Deployment Server (Selaras `D-01..D-28`)  
**Platform:** WordPress LTS (PHP 8.1/8.2, MySQL 5.7+ / MariaDB 10.4+, Nginx/Apache)

---

## 1. Persiapan Server & Lingkungan
1. **Persyaratan Sistem:**
   - PHP 8.1 atau 8.2 dengan ekstensi `mysqli`, `curl`, `json`, `mbstring`, `date`.
   - MySQL 5.7+ / MariaDB 10.4+ (mendukung fungsi kunci atomik `GET_LOCK` dan `RELEASE_LOCK`).
   - Sertifikat SSL aktif (HTTPS wajib).
2. **Zona Waktu WordPress (`D-24`):**
   - Masuk ke **Pengaturan > Umum**, atur **Zona Waktu** ke `Asia/Jakarta` (UTC+7).

---

## 2. Instalasi Plugin & Child Theme
1. Unggah folder `wp-content/plugins/ryokourent-core` dan aktifkan plugin **Ryokourent Core**.
   - Otomatis mendaftarkan CPT `motor`, `ryokou_unit`, `ryokou_lacak` (`Lacak Unit`), `penyewaan`, `ryokou_paket`, custom post status, dan role `ryokou_operator`.
2. Pastikan tema induk `generatepress` terpasang, lalu unggah dan aktifkan `wp-content/themes/generatepress-child`.

---

## 3. Konfigurasi Real Cron Job Server (`D-14`)
Tambahkan `define( 'DISABLE_WP_CRON', true );` di `wp-config.php` dan pasang cron job Linux setiap 15 menit:
```bash
*/15 * * * * wget -q -O - https://domain-anda.com/wp-cron.php?doing_wp_cron >/dev/null 2>&1
```
