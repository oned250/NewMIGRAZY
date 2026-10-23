# PANDUAN IMPOR DATA CONTOH MOTOR DARI REACT KE WORDPRESS

Panduan praktis memasang 6 data model motor dari sistem React 19 ke database WordPress tanpa perlu mengisi satu per satu secara manual.

---

## OPSI 1: Sekali Klik di Dashboard WP-Admin (Paling Direkomendasikan ⚡)

Fitur tombol impor 1-klik sudah tersedia langsung di dalam antarmuka WordPress Admin:

1. Masuk ke **WP-Admin** WordPress Anda (`/wp-admin`).
2. Di menu navigasi samping, klik **Penyewaan** &rarr; **Pengaturan & Bulk Tarif**.
3. Gulir ke bagian **Kartu 3: Impor Data Motor dari React (1-Klik)**.
4. Anda akan melihat status jumlah motor yang ada saat ini di database.
5. *(Opsional)* Centang **"Perbarui / timpa data jika motor sudah ada sebelumnya"** jika ingin me-reset nilai tarif ke standar.
6. Klik tombol hijau: **`⚡ Impor 6 Model Motor Sekarang (1-Klik)`**.
7. **Selesai!** 6 model motor langsung terbuat otomatis lengkap dengan kategori taksonomi (`Matic`, `Retro`, `Trail`, `Sport`), tarif harian & jam, denda, spesifikasi, dan fasilitas.

---

## OPSI 2: Tanpa Perlu Klik Apapun (Fitur Smart Fallback Otomatis)

Sistem plugin `ryokourent-core` sudah dilengkapi dengan fungsi **Smart Fallback** (`ryokourent_get_all_motors_with_fallback()`):

- Jika database CPT `motor` di WordPress Anda masih kosong (0 motor), sistem publik WordPress:
  - Shortcode Katalog: `[ryokou_katalog]`
  - Shortcode Formulir Booking: `[ryokou_booking_form]`
  - REST API: `/wp-json/ryokourent/v1/motor-models`
- **Secara otomatis sudah menampilkan ke-6 model motor tersebut** tanpa membuat tampilan kosong atau rusak.

---

## OPSI 3: Melalui REST API (cURL / Postman / Fetch)

Jika Anda ingin menjalankan seeding dari terminal atau aplikasi eksternal:

### Menggunakan cURL:
```bash
curl -X POST "https://domain-wordpress-anda.com/wp-json/ryokourent/v1/seed-motors" \
  -H "Content-Type: application/json" \
  -d '{"force": true}'
```

### Response JSON Sukses:
```json
{
  "success": true,
  "message": "6 model motor contoh berhasil disinkronkan ke WordPress.",
  "count": 6
}
```

---

## DAFTAR 6 MODEL MOTOR YANG DIIMPOR

| Nama Model | Kategori | Tarif 1 Hari | ShortRent 12J | ShortRent 6J | ShortRent 3J | Denda/Jam |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Honda Scoopy Prestige** | Retro | Rp 85.000 | Rp 65.000 | Rp 45.000 | Rp 35.000 | Rp 20.000 |
| **Yamaha NMAX 155 Connected** | Matic | Rp 135.000 | Rp 105.000 | Rp 75.000 | Rp 55.000 | Rp 25.000 |
| **Honda CRF 150L Adventure** | Trail | Rp 220.000 | Rp 175.000 | Rp 125.000 | Rp 95.000 | Rp 35.000 |
| **Yamaha Fazzio Hybrid** | Retro | Rp 95.000 | Rp 75.000 | Rp 50.000 | Rp 40.000 | Rp 20.000 |
| **Yamaha R15 V4 Racing** | Sport | Rp 175.000 | Rp 140.000 | Rp 100.000 | Rp 75.000 | Rp 30.000 |
| **Honda BeAT Deluxe** | Matic | Rp 80.000 | Rp 60.000 | Rp 40.000 | Rp 30.000 | Rp 20.000 |
