# PANDUAN PENGGUNAAN FITUR WIZARD RECOVERY ZLCE v3.2.2
## Ryokourent Rental Motor Management System

Panduan praktis langkah demi langkah menggunakan **Wizard Recovery** di Ryokourent V2 Console untuk memulihkan sesi AI yang terputus, berpindah model AI, atau membuat checkpoint aman langsung dari browser (termasuk browser tab Android).

---

## 1. PENDAHULUAN: MENGAPA FITUR INI DIBUTUHKAN?

Saat mengembangkan proyek dengan metodologi **Zero-Loss Context Engineering (ZLCE)** melalui AI di browser (ChatGPT, Claude, Cursor, Windsurf, atau Gemini), sesi kerja sering terputus karena:
1. **Tab browser Android tertutup / me-reload otomatis** akibat manajemen RAM sistem operasi saat membuka aplikasi lain.
2. **Koneksi seluler fluktuatif** yang memutus teks output AI di tengah penulisan kode.
3. **Batas kuota token / konteks chat habis**, mengharuskan Anda membuka tab percakapan baru.

**Wizard Recovery** menyelesaikan masalah ini dengan mengotomatiskan pembacaan status Git dan Write-Ahead Log (WAL), lalu menghasilkan **Bundel Handover All-in-One siap tempel** dalam 4 langkah mudah.

---

## 2. CARA MENGAKSES WIZARD DI CONSOLE

Fitur ini dapat diakses langsung dari antarmuka web Ryokourent:

### A. Melalui Layar HP / Tab Android:
- **Tombol Cepat Header:** Lihat sudut kanan atas layar, tekan tombol hijau: **`⚡ Wizard Recovery`**.
- **Tab Navigasi Mobile:** Di bilah menu tab yang bisa digeser (*scrollable*), pilih tab nomor 1: **`Wizard Recovery ZLCE`**.
- **Banner Bantuan di Tab FOLDER_KERJA:** Di tab *Alur Kerja MD*, tekan tombol **`Buka Wizard Recovery`** pada kartu atas.

### B. Melalui Desktop / Laptop:
- Klik menu **`Wizard Recovery ZLCE`** pada bilah navigasi utama atau tombol **`Wizard Recovery`** di pojok kanan atas.

---

## 3. TUTORIAL 4 LANGKAH PENGGUNAAN WIZARD

```
[1. Opsi] ──▶ [2. Eksekusi] ──▶ [3. Diagnostik Kasus A–D] ──▶ [4. Ekspor & Handover]
```

### Langkah 1: Pilih Skenario & Konfigurasi Opsi
1. **Pilih Skenario yang Sesuai:**
   - **Sesi AI Terputus Tiba-tiba (Recovery):** *Paling sering digunakan.* Pilih ini jika sesi AI terpotong atau tab browser baru saja tertutup/me-reload.
   - **Pindah Model / Sesi AI Baru (Handover):** Pilih ini jika Anda ingin berganti sesi chat atau berganti AI secara terencana.
   - **Checkpoint Titik-Simpan Rutin (WIP Safe):** Pilih ini untuk mengambil foto status sebelum mencoba fitur baru.
   - **Audit Integritas Repositori Mandiri:** Memeriksa keselarasan berkas tanpa membuat perubahan.
2. **Centang Parameter Diagnostik (Disarankan Default):**
   - ✅ **Sertakan Git Diff Penuh (`--diff`):** Sangat penting agar baris kode yang belum di-commit ikut terbaca.
   - ✅ **Simpan ke Berkas Arsip (`docs/archive/`):** Menyimpan salinan `.txt` fisik dengan timestamp otomatis di server.
   - ✅ **Catat ke Log Audit `SESSION_STATE.md`:** Menambahkan catatan peristiwa resmi di bagian `## 7. LOG AUDIT`.
3. *(Opsional)* Tuliskan catatan singkat di kolom **Catatan Kustom**.
4. Klik **`Lanjut ke Konfirmasi & Eksekusi →`**.

---

### Langkah 2: Konfirmasi & Jalankan Eksekusi
1. Periksa ringkasan konfigurasi yang tampil di layar.
2. Klik tombol utama: **`⚡ Eksekusi & Buat Snapshot Sekarang`**.
3. Sistem backend server akan menjalankan skrip kanonikal:
   ```bash
   bash scripts/zlce/zlce-snapshot.sh --diff
   ```
4. Tunggu 1–3 detik hingga indikator proses selesai. Anda akan otomatis dialihkan ke Langkah 3.

---

### Langkah 3: Baca Hasil Diagnostik & Rekomendasi Kasus
Sistem secara otomatis menganalisis status repositori dan mencocokkannya dengan Write-Ahead Log (WAL) di `SESSION_STATE.md`:

| Kasus Terdeteksi | Arti Kondisi di Repositori | Langkah Wajib yang Ditampilkan Sistem |
| :---: | :--- | :--- |
| **KASUS A** | **Working Tree Bersih** (tidak ada file uncommitted). | Langkah WAL belum sempat ditulis ke disk. Instruksikan AI baru melanjutkan dari field `Langkah Berikutnya` pada WAL. |
| **KASUS B** | **Diff Cocok dengan WAL** (ada berkas teredit sesuai rencana). | Pertahankan perubahan kode, uji Acceptance Criteria, buat commit `wip()`, lalu tandai `DONE`. Dilarang `git reset`! |
| **KASUS C** | **Commit Ada di Git Log** (ada commit baru yang belum tercatat). | Sinkronkan tabel matriks task di `SESSION_STATE.md` dengan commit terbaru, lalu lakukan verifikasi ulang. |
| **KASUS D** | **Diff di Luar Daftar WAL** (ada perubahan file tak terduga). | **BERHENTI!** Jangan hapus perubahan. Ubah status task menjadi `BLOCKED` dan minta konfirmasi user sebelum bertindak. |

- Jika opsi arsip dicentang, path penyimpanan fisik akan ditampilkan (contoh: `docs/archive/snapshot-2026-10-24T05-04-19.txt`).
- Klik **`Lanjut ke Bundel Handover & Ekspor →`**.

---

### Langkah 4: Salin Bundel Serah Terima (Handover)
Di langkah terakhir, tersedia 3 opsi tombol aksi:

1. **📋 Tombol "Salin Bundel Handover All-in-One" (Paling Direkomendasikan ⚡):**
   - Menggabungkan **Prompt Handover Paten**, **Output Snapshot Diagnostik**, dan **Isi Status State Aktif** dalam satu kesatuan teks.
   - Klik tombol ini &rarr; Teks otomatis masuk ke clipboard HP Anda.
2. **💾 Tombol "Unduh Berkas Snapshot (.txt)":**
   - Mengunduh teks snapshot mentah sebagai file ke folder Download perangkat Anda.
3. **📄 Tombol "Salin Snapshot Mentah":**
   - Hanya menyalin keluaran terminal skrip snapshot tanpa pembungkus template prompt.

---

## 4. CARA MENEMPELKAN BUNDEL KE SESI AI BARU

Setelah menyalin **Bundel All-in-One** dari Langkah 4:
1. Buka tab baru di browser Anda (masuk ke ChatGPT, Claude, Cursor, dsb).
2. Di kotak pesan, lakukan **Paste / Tempel** teks bundel tersebut.
3. Tekan **Kirim / Send**.
4. AI sesi baru akan langsung merespons dengan format standar ZLCE:
   > *"Saya mendeteksi mode RECOVERY Kasus [A/B/C/D]. Status task terakhir Anda adalah [...]. Saya akan melanjutkan eksekusi dari langkah WAL berikutnya tanpa mengulang pekerjaan dari awal."*

---

## 5. TIPS PENGGUNAAN KHUSUS BROWSER TAB ANDROID (HP / TABLET)

1. **Pola 1-Sentuh:** Di HP, hindari mengunggah file `.zip` berulang kali. Cukup gunakan tombol **Salin Bundel All-in-One** &rarr; **Tempel**.
2. **Kunci Tab Browser:** Pada menu Recent Apps Android, tekan lama jendela browser dan pilih **Lock / Keep Open** agar tab tidak ditutup paksa oleh Android saat Anda membuka aplikasi lain.
3. **Mode Split Screen:** Buka tab Ryokourent Console di separuh layar atas dan tab AI Chat di separuh layar bawah untuk memudahkan pemantauan langsung.

---

## 6. LOKASI ARSIP SNAPSHOT DI SERVER

Setiap snapshot yang disimpan melalui opsi arsip dapat ditemukan di direktori:
```text
[project-root]/
└── docs/
    └── archive/
        ├── snapshot-2026-10-24T04-59-10.txt
        └── snapshot-2026-10-24T05-04-19.txt
```
Berkas-berkas ini dapat diaudit kapan saja untuk melihat riwayat checkpoint historis proyek Ryokourent.
