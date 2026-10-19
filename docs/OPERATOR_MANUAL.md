# PANDUAN OPERASIONAL STAF RENTAL (OPERATOR MANUAL) RYOKOURENT

**Versi:** 2.1.0 (Selaras Keputusan `D-01..D-27`)  
**Peran Pengguna:** `ryokou_operator`

---

## 1. Ikhtisar Alur Kerja Operator

Siklus pesanan mengikuti State Machine 4 status resmi:

$$\text{Booking} \longrightarrow \text{Approve Booking} \longrightarrow \text{Disewa} \longrightarrow \text{Selesai}$$

1. **Booking Baru Masuk:**
   - Pelanggan mengirim formulir dari website dan mengirimkan pesan WhatsApp ke Admin.
   - Pesanan otomatis berstatus `Booking` di menu **Penyewaan > Semua Pesanan**.
   - Stok belum terkunci. Jika dalam 48 jam tidak disetujui, pesanan akan terhapus otomatis oleh sistem (D-14).

2. **Langkah 1: Menyetujui Pesanan (Approve Booking):**
   - Buka menu **Penyewaan > Semua Pesanan**.
   - Klik tombol **Approve** pada baris pesanan.
   - Sistem menampilkan modal popup seluruh unit fisik yang **bebas** dari tipe motor tersebut beserta lokasi parkirnya saat ini (`Parkir: Pool Malang` atau `Parkir: Pool Batu`). Armada tidak dibagi kaku per pool karena Pool hanya berfungsi sebagai tempat parkir (D-26).
   - Pilih unit fisik yang diinginkan, lalu klik **Setujui & Kunci Unit**.

3. **Langkah 2: Serah Terima Unit (Disewa):**
   - Saat pelanggan menerima kunci motor, klik tombol **Serah Terima**.
   - Sistem mencatat waktu serah terima riil (`_disewa_at = sekarang`), memulai argo sewa, dan otomatis memperbarui menu **Lacak Unit (`ryokou_lacak`)** menjadi status **Sedang Disewa** atas nama pelanggan tersebut.

4. **Langkah 3: Pengembalian Motor (Selesai):**
   - Saat pelanggan mengembalikan motor, periksa kondisi fisik motor dan kelengkapan.
   - Klik tombol **Selesai** dan konfirmasi lokasi parkir pool tempat motor disimpan (`Pool Malang` atau `Pool Batu`).
   - Unit fisik motor otomatis bebas kembali dan status di **Lacak Unit (`ryokou_lacak`)** kembali menjadi **Parkir di Pool**.

---

## 2. Pelacakan Posisi Unit Real-Time (`CPT Lacak Unit` — D-26)

Menu **Lacak Unit** (`ryokou_lacak`) digunakan untuk memantau posisi setiap unit motor di lapangan tanpa membagi kuota armada:
1. **Posisi Parkir (`Parkir di Pool`):** Menampilkan unit sedang terparkir di **Pool Malang** atau **Pool Batu**. Jika unit dipindahkan antar-pool untuk kebutuhan antar-jemput, cukup ubah lokasi pool parkirnya.
2. **Posisi Servis (`Servis di Bengkel`):** Menampilkan unit sedang diservis di **bengkel mana** (contoh: *AHASS Soekarno Hatta Malang*), nomor kontak mekanik/bengkel, rincian perbaikan/ganti oli, serta estimasi tanggal/jam selesai.
3. **Posisi Sewa (`Sedang Disewa`):** Menampilkan unit sedang dibawa oleh **siapa** (nama penyewa), nomor booking (`RYK-...`), titik pengantaran, dan tenggat waktu kembali.

---

## 3. Aturan Denda Keterlambatan Harian & ShortRent (D-16 & D-27)

### A. Kategori Sewa Jam / ShortRent (3 Jam, 6 Jam, 9 Jam, 12 Jam) — Aturan D-27
1. **Keterlambatan 60 Menit Masuk Kategori Jam Atasnya (3 Jam, 6 Jam, 9 Jam):**
   - Apabila penyewa paket ShortRent terlambat **60 menit** (atau lebih), maka tagihan sewa otomatis masuk ke **kategori jam di atasnya**:
     - **Sewa 3 Jam** terlambat $\ge 60$ menit $\longrightarrow$ masuk kategori **6 Jam** (Denda = selisih harga paket **6 Jam** dikurangi **3 Jam**).
     - **Sewa 6 Jam** terlambat $\ge 60$ menit $\longrightarrow$ masuk kategori **9 Jam** (Denda = selisih harga paket **9 Jam** dikurangi **6 Jam**).
     - **Sewa 9 Jam** terlambat $\ge 60$ menit $\longrightarrow$ masuk kategori **12 Jam** (Denda = selisih harga paket **12 Jam** dikurangi **9 Jam**).
   - Jika keterlambatan melewati durasi kategori baru ditambah 60 menit lagi, maka otomatis naik lagi ke jenjang berikutnya.
2. **Denda di Paket 12 Jam Sama Dengan Denda Harian:**
   - Untuk penyewa paket **12 Jam** (atau paket ShortRent yang sudah naik ke kategori 12 Jam dan masih terlambat), denda keterlambatan yang dikenakan **sama dengan denda harian** (`_ryokou_denda_harian`, default Rp 20.000/jam).

### B. Kategori Sewa Harian (1 Hari, 1 Minggu, 2 Minggu)
- Toleransi pengembalian 90 menit.
- Melewati batas toleransi dikenakan tarif **Denda Harian** per jam (`_ryokou_denda_harian`, default Rp 20.000/jam atau sesuai pengaturan tipe motor).
