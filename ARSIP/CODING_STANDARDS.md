# ATURAN DAN STANDAR KODING (CODING STANDARDS): RYOKOURENT

Dokumen ini memuat standar teknis yang wajib dipatuhi oleh seluruh pengembang (Manusia maupun AI Engineer) dalam repositori **Ryokourent**.

---

## 1. Standar Kode PHP & WordPress (`ryokourent-core`)
1. **Prefix Wajib:** Semua fungsi global, hook, custom post status, dan opsi menggunakan prefix `ryokourent_` (atau `_ryokou_` untuk post meta keys) guna mencegah bentrok namespace.
2. **Keamanan Input & Output:**
   - Wajib memvalidasi nonce (`check_ajax_referer` / `wp_verify_nonce`) dan kapabilitas (`current_user_can`) sebelum memproses mutasi data.
   - Gunakan `ryokourent_sanitize_text_no_nik()` pada seluruh input teks bebas untuk memastikan tidak ada nomor NIK 16 digit yang tersimpan ke database (`D-21` / UU PDP).
   - Gunakan `esc_html()`, `esc_attr()`, `esc_url()`, dan `wp_kses_post()` saat merender output ke HTML.
3. **Zona Waktu:** Seluruh konversi string tanggal wajib menggunakan objek `new DateTimeZone( 'Asia/Jakarta' )` (`D-24`).
4. **Internasionalisasi (i18n):** Seluruh teks antarmuka wajib menggunakan fungsi terjemahan (`__()`, `_e()`, `esc_html__()`, `esc_html_e()`) dengan text domain `'ryokourent'` (`D-25`).

---

## 2. Standar Ketersediaan Armada & Lacak Unit (`D-26`)
1. **Larangan Partisi Kuota Pool:** Jangan menambahkan filter `_ryokou_pool_lokasi` saat menghitung stok bebas di `ryokourent_get_available_units()`. Pool Malang dan Pool Batu murni merupakan atribut lokasi parkir fisik.
2. **Sinkronisasi CPT `ryokou_lacak`:** Setiap aksi yang mengubah posisi fisik unit (`Serah Terima` $\to$ `disewa`, `Selesai` $\to$ `parkir`, `Tukar Unit`, maupun perubahan status `Servis`) wajib memanggil `ryokourent_sync_unit_tracking()`.

---

## 3. Standar Kalkulasi Tarif & Denda (`D-16`, `D-18`, `D-27`)
1. **ShortRent Step-Up 60 Menit (`D-27`):** Keterlambatan $\ge 60$ menit pada paket `3_jam`, `6_jam`, dan `9_jam` wajib menaikkan tagihan ke jenjang jam di atasnya (`3_jam` $\to$ `6_jam` $\to$ `9_jam` $\to$ `12_jam`).
2. **ShortRent 12 Jam = Denda Harian (`D-27`):** Keterlambatan pada paket `12_jam` wajib menggunakan tarif `_ryokou_denda_harian` per jam (bukan tarif denda terpisah).
