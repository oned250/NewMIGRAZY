# PRODUCTION & SECURITY CHECKLIST RYOKOURENT V2

**Status:** Checklist Go-Live Produksi (Termasuk D-26 & D-27)  
**Target:** Ryokourent Rental Motor (Malang Raya & Kota Wisata Batu)

---

## 1. Verifikasi Aturan Bisnis & Arsitektur (D-01 .. D-27)

- [x] **State Machine 4 Status:** Booking -> Approve Booking -> Disewa -> Selesai berjalan tanpa bypass manual.
- [x] **Pool Hanya Sebagai Tempat Parkir (D-26):** Armada tidak dibagi kaku menjadi kuota Pool Malang vs Pool Batu; ketersediaan stok dihitung global dari seluruh unit aktif per jenis motor.
- [x] **CPT Lacak Unit (`ryokou_lacak`) (D-26):** Melacak secara akurat apakah unit sedang parkir di Pool mana (`Pool Malang` / `Pool Batu`), sedang servis di Bengkel mana (nama bengkel, kontak, estimasi selesai), atau sedang disewa oleh siapa (nama penyewa, no booking, tenggat kembali).
- [x] **Aturan Denda ShortRent Step-Up 60 Menit (D-27):** Keterlambatan $\ge 60$ menit pada ShortRent otomatis menaikkan tagihan ke kategori jam di atasnya (3 jam $\to$ 6 jam, 6 jam $\to$ 9 jam, 9 jam $\to$ 12 jam).
- [x] **Denda ShortRent 12 Jam = Denda Harian (D-27):** Keterlambatan pada paket 12 jam dikenakan tarif denda yang sama dengan denda harian (`_ryokou_denda_harian`).
- [x] **Jeda Antar-Sewa:** Buffer 90 menit aktif di kedua sisi rentang jadwal pada unit fisik yang sama.
- [x] **Overtime Awareness:** Unit yang sedang disewa dan melewati jadwal kembali otomatis memiliki akhir efektif $\max(\text{tenggat}, \text{sekarang})$ sehingga tidak tampak bebas.
- [x] **Tukar Unit Berkala:** Aksi resmi tukar unit untuk sewa jangka panjang aktif dengan pencatatan riwayat KM, alasan, dan pembaruan otomatis CPT `ryokou_lacak`.
- [x] **Pembersihan 48 Jam:** Cron rekursif & Lazy Purge aktif menghapus booking menggantung > 48 jam.

---

## 2. Keamanan & Kepatuhan Privasi (UU PDP / Hardening)

- [x] **Minimasi Data Pribadi di Database:** Tidak ada nomor KTP/foto KTP, alamat KTP, kontak darurat, medsos, atau IP pengunjung tersimpan di DB.
- [x] **Filter Anti-16 Digit NIK:** Regex validator di server menolak submit jika kolom teks mengandung pola 16 digit angka.
- [x] **Anti-Bot & Anti-Spam:** Honeypot, signed time token (min 4 detik), dan dual rate limit aktif.
- [x] **Audit Log WhatsApp:** Pergantian nomor WhatsApp admin mencatat user pembuat dan waktu WIB.
- [x] **RBAC Operator:** Role `ryokou_operator` dapat mengelola booking dan Lacak Unit tanpa izin hapus unit fisik, hapus master motor, atau kelola user login.
