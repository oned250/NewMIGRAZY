# AI_RULES.md — ATURAN KERJA & KONSTITUSI AI RYOKOURENT

Dokumen ini adalah aturan wajib yang mengikat seluruh sesi AI Engineer, AI Architect, maupun AI Reviewer yang bekerja pada repositori **Ryokourent** (`ryokourent-core` & `generatepress-child`).

---

## 1. Urutan Baca Wajib Sebelum Bertindak
Sebelum menulis atau mengubah satu baris kode pun, AI **WAJIB** membaca dokumen dalam urutan berikut:
1. **`NEW_TASK.md` (PRIORITAS PERTAMA):** Berisi permintaan fitur baru, perubahan aturan, atau koreksi error dari pemilik proyek.
2. **`SESSION_STATE.md`:** Sumber kebenaran status terkini (cabang aktif, fase aktif, task terakhir selesai, task selanjutnya, dan keputusan kunci `D-01..D-28`).
3. **`TASKS.md`:** Spesifikasi task target (tujuan, file yang disentuh, dependensi, kriteria selesai, cara pengujian, risiko).
4. **`AI_RULES.md` & `AI_WORKFLOW.md`:** Konstitusi kerja, alur `NEW_TASK.md`, Human Review Gate, dan Format Laporan 8 Poin.
5. **`BLUEPRINT.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, `DECISIONS.md`:** Aturan bisnis (`D-01..D-28`), struktur, skema CPT (`motor`, `ryokou_unit`, `ryokou_lacak`, `penyewaan`, `ryokou_paket`), dan ADR.
6. **`docs/GIT_WORKFLOW.md`, `docs/CODING_STANDARDS.md`, & `docs/PANDUAN_XAMPP_WIN11_SIMULASI.md`:** Standar Git, standar koding WordPress, dan panduan simulasi XAMPP Windows 11.
7. **`TESTING.md`:** Matriks skenario pengujian (`QA-01..QA-25` & edge cases `F-01..F-21`).

---

## 2. Aturan Pemeriksaan `NEW_TASK.md` vs Langkah Biasa (`D-28`)
1. **Periksa `NEW_TASK.md` pada bagian `## ISI PERMINTAAN AKTIF`:**
   - **Jika tertulis `Tidak ada`:** Langsung lanjutkan ke langkah seperti biasa berdasarkan `SESSION_STATE.md` dan `TASKS.md`.
   - **Jika berisi permintaan baru / perubahan / koreksi error:**
     - Eksekusi permintaan tersebut sebagai prioritas utama.
     - Jika ada perubahan aturan bisnis, catat `D-XX` baru di `DECISIONS.md` **sekaligus perbarui pasal `D-lama` yang terdampak agar tidak kontradiktif**, dan perbarui `DATA_MODEL.md`.
     - Catat sebagai `TASK-0XX` baru di `TASKS.md` dan `SESSION_STATE.md`.
     - Setelah selesai diimplementasikan dan diuji, **kembalikan isi `NEW_TASK.md` menjadi `Tidak ada`**.
2. **Sinkronisasi Dokumen Pasca-Task:**
   Setiap kali sebuah task selesai dan terverifikasi, AI **WAJIB** memperbarui:
   - `NEW_TASK.md` (pastikan kembali bernilai `Tidak ada`)
   - `SESSION_STATE.md`
   - `TASKS.md`
   - `CHANGELOG.md`
   - `docs/HANDOVER.md` (hanya memperbarui blok `TARGET PEKERJAAN`)

---

## 3. Batasan Keras (Hard Constraints)
1. **Privasi UU PDP (`D-21`):** Dilarang menyimpan NIK 16 digit, foto KTP, alamat KTP lengkap, kontak darurat, akun medsos, atau alamat IP di database.
2. **Pool Hanya Sebagai Tempat Parkir (`D-26`):** Jangan membagi kaku kuota armada menjadi armada Pool Malang vs Pool Batu. Ketersediaan dihitung global per tipe motor.
3. **CPT Lacak Unit (`ryokou_lacak` — `D-26`):** Setiap perubahan posisi unit wajib tercatat di CPT `ryokou_lacak` (Parkir di Pool Malang/Batu, Servis di Bengkel mana, atau Disewa oleh siapa).
4. **Aturan Denda ShortRent (`D-27`):** Keterlambatan $\ge 60$ menit pada ShortRent (3, 6, 9 jam) otomatis naik ke kategori jam di atasnya (3j $\to$ 6j $\to$ 9j $\to$ 12j). Untuk paket 12 jam, denda keterlambatan sama dengan denda harian (`_ryokou_denda_harian`).

---

## 4. Format Laporan Wajib (8 Poin)
1. **Task**, 2. **Tujuan**, 3. **File dibuat**, 4. **File diubah**, 5. **Implementasi**, 6. **Pengujian**, 7. **Risiko / TODO**, 8. **Status** (`COMPLETED` hanya setelah pengujian valid).
