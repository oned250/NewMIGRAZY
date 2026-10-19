# CHECKLIST SEBELUM PRODUCTION (PRE-PRODUCTION CHECKLIST)

Sebelum situs **Ryokourent** dinyatakan siap diluncurkan (*Go-Live*) untuk publik, tim teknis dan operasional **WAJIB** menyelesaikan dan menandatangani seluruh butir pemeriksaan di bawah ini (`D-01` s/d `D-27`).

---

## 1. Verifikasi Logika Bisnis & Armada (`D-01` .. `D-27`)
- [x] **State Machine 4 Status (`D-04`):** Transisi `Booking` → `Approve Booking` → `Disewa` → `Selesai` berjalan tertib dengan validasi nonce dan kunci atomik MySQL `GET_LOCK`.
- [x] **Pool Hanya Sebagai Tempat Parkir (`D-26`):** Armada tidak dibagi kaku menjadi kuota Pool Malang dan Pool Batu; ketersediaan stok dihitung global dari seluruh unit fisik aktif per tipe motor.
- [x] **CPT Lacak Unit (`ryokou_lacak` — `D-26`):** Menu **Lacak Unit** menampilkan secara akurat:
  - Unit yang sedang parkir berada di Pool mana (`Pool Malang` / `Pool Batu`),
  - Unit yang sedang servis berada di Bengkel mana (nama bengkel, kontak mekanik, estimasi selesai),
  - Unit yang sedang dalam posisi sewa dibawa oleh siapa (nama penyewa, nomor booking, jadwal kembali).
- [x] **Aturan Denda ShortRent Step-Up 60 Menit (`D-27`):** Keterlambatan $\ge 60$ menit pada sewa ShortRent (3, 6, 9 jam) otomatis masuk ke kategori jam di atasnya (contoh: sewa 3 jam masuk kategori 6 jam; 6 jam $\to$ 9 jam; 9 jam $\to$ 12 jam).
- [x] **Aturan Denda ShortRent 12 Jam = Harian (`D-27`):** Keterlambatan pada paket ShortRent 12 jam otomatis dikenakan tarif denda yang sama dengan denda harian (`_ryokou_denda_harian`).
- [x] **2 Kategori Tarif & Cascading Dropdown (`D-18`):** Harga 1 Hari tampil sebagai harga utama, diikuti dropdown bertingkat untuk Harian (1 hari, 1 minggu, 2 minggu), Jam/ShortRent (12, 9, 6, 3 jam), dan Paket Promo.
- [x] **Indikator Stok Biner (`D-05`):** Hanya menampilkan status `Tersedia` atau `Habis` tanpa membocorkan jumlah unit riil; tombol booking tetap aktif saat `Habis`.

---

## 2. Verifikasi Keamanan & Privasi Data (UU PDP No. 27/2022)
- [x] **Zero PII Berlebih di Database (`D-21`):** Tidak ada penyimpanan foto KTP, nomor NIK 16 digit, alamat KTP lengkap, kontak darurat, akun medsos, maupun alamat IP pengunjung.
- [x] **Filter Anti-16 Digit NIK (`D-10`, `D-21`):** Input teks yang mengandung pola 16 digit angka ditolak di client-side dan disanitasi di server-side.
- [x] **Anti-Bot & Rate Limit (`D-10`):** Honeypot, signed time token (minimal 4 detik pengisian), dan dual rate limit (5/10m per IP + 50/jam global) aktif.
- [x] **RBAC `ryokou_operator` & Audit WA (`D-22`, `D-23`):** Operator tidak dapat menghapus unit/model atau mengelola user login; setiap pergantian nomor WhatsApp Admin tercatat nama pengubah dan waktu WIB.
