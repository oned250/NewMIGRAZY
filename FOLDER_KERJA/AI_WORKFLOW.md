# TATA KELOLA AI, ALUR KERJA & STANDAR TEKNIS: RYOKOURENT RENTAL MOTOR (ZLCE v3.2.2)

Satu-satunya definisi aturan kerja operasional, enum status, triase revisi, proteksi kode eksisting, dan protokol pemulihan darurat untuk proyek Ryokourent.

---

## 1. KONVENSI TEKNIS

1. **Bahasa Dokumentasi:** Teknis murni, ringkas, bullet/tabel, tanpa narasi berlebih.
2. **Format Waktu:** ISO 8601 dengan zona (misal `2026-10-24 10:30:00 WIB` atau `2026-10-24 jam: ?` bila jam eksplisit tidak ada di sumber).
3. **Konvensi Penamaan:**
   - Direktori dan berkas: `kebab-case` (misal `booking-columns.php`, `LiveUnitTrackingDashboard.tsx`).
   - Kelas: `PascalCase`; Fungsi/Metode: `camelCase` (atau `snake_case` ber-prefix `ryokourent_` untuk fungsi native WordPress).
   - Variabel: konsisten satu gaya; Konstanta: `UPPER_SNAKE_CASE`.

---

## 2. ENUM STATUS TUNGGAL (STATUS MATRIX)

`PENDING | READY | IN_PROGRESS | BLOCKED | DONE`

| Status | Arti & Syarat |
| :--- | :--- |
| `PENDING` | Dependensi task sebelumnya belum `DONE`. |
| `READY` | Seluruh dependensi telah `DONE`, task siap dikerjakan. |
| `IN_PROGRESS` | Sedang dikerjakan (**maksimal 1 task aktif** pada satu waktu). |
| `BLOCKED` | Terhenti sementara (alasan wajib dicatat di `SESSION_STATE.md`). |
| `DONE` | Seluruh Acceptance Criteria terpenuhi + kolom Bukti Verifikasi terisi konkret + `Disetujui: ya`. |

Nilai status di luar 5 enum di atas dilarang di semua berkas kontrol.

---

## 3. GUARDRAIL AI & ATURAN EMAS PROTEKSI KODE

1. **Aturan Emas Proteksi Kode Eksisting (`D-31` — WAJIB DIPATUHI):**
   - **DILARANG KERAS** menimpa ulang seluruh isi berkas (*full file overwrite*) yang menyebabkan fungsi, tampilan, variabel, atau alur yang sudah berjalan baik sebelumnya menjadi hilang atau rusak.
   - Gunakan prinsip **Surgical Edit (Edit Terfokus / Tambah Saja)**: hanya sentuh baris atau blok spesifik yang diminta.
   - Jika penambahan fitur terpaksa mengubah logika yang sudah ada sebelumnya, **BERHENTI DULU, JANGAN UBAH KODE**, jelaskan bagian yang terdampak, dan minta persetujuan user terlebih dahulu.
2. **Single Task Execution (R4):** Tepat 1 task berstatus `IN_PROGRESS` pada satu waktu.
3. **Read-Before-Write:** Wajib membaca modul dan berkas terkait sebelum memodifikasi kode.
4. **Anti-Halusinasi & Asumsi Terbuka (R3):** Informasi di luar berkas kontrol = tidak diketahui. Catat sebagai `ASM-xx` / `Q-xx` di `SESSION_STATE.md` §4 dan tanyakan ke pengguna. Dilarang mengarang output perintah, isi berkas, atau hasil test.
5. **Preservasi Jam Sumber (Aturan X1 / R3b):** Jam audit dan checkpoint HANYA boleh mengambil string waktu persis dari pesan pengguna atau sistem. Tanpa sumber waktu baru, WAJIB menulis tanggal saja dan `'jam: ?'`. DILARANG mengekstrapolasi/mengarang jam sintetis (seperti menambah +5 atau +10 menit).
6. **Kerahasiaan Data & Kunci:** Kredensial dan rahasia hanya via `.env`; dilarang menaruh API key atau kredensial produksi di repositori terbuka.

---

## 4. PEMBACAAN BERTINGKAT (TIERED CONTEXT)

| Tier | Berkas yang Dibaca | Kapan Dibaca |
| :--- | :--- | :--- |
| **Tier 0** | `FOLDER_KERJA/SESSION_STATE.md`, `FOLDER_KERJA/NEW_TASK.md`, dan entri task aktif di `TASKS.md` | Setiap awal sesi kerja AI |
| **Tier 1** | Berkas pada field `Docs Terkait` task aktif + kode sumber yang akan disentuh | Sebelum mengeksekusi task |
| **Tier 2** | `SPEC_AND_DECISIONS.md`, `BLUEPRINT.md`, dan berkas pendukung lainnya | Hanya jika diperlukan klarifikasi aturan bisnis |

---

## 5. ATURAN VERIFIKASI (VERIFICATION GATES)

1. **Kriteria DONE Sah:**
   - Semua Acceptance Criteria (AC) pada `TASKS.md` terverifikasi terpenuhi.
   - Kolom *Bukti Verifikasi* di matriks `SESSION_STATE.md` terisi output log/perintah nyata.
   - Kolom *Disetujui* bernilai `ya`.
2. **Persetujuan Eksplisit:** Kata persetujuan dari pengguna harus eksplisit menyebut task atau status `DONE`. Frasa ambigu ("lanjut", "oke") bukan persetujuan `DONE`.
3. **Sinkronisasi Dokumen (R6):** Dokumen yang tercantum pada `Docs Impact` wajib diperbarui di dalam task yang sama sebelum ditandai `DONE`.
4. **Validasi State Integritas:** Jalankan `python3 scripts/zlce/zlce-check.py` setelah pembaruan state dan sebelum menandai `DONE`. Hasil verifikasi wajib **0 ERROR**.

---

## 6. TRIASE REVISI (INTERRUPT PROTOCOL)

| Tingkat | Kriteria | Prosedur Penanganan |
| :--- | :--- | :--- |
| **Level S** | $\le 1$ berkas, $\le 20$ baris, tanpa perubahan skema DB, kontrak API, keamanan, atau AC | Eksekusi langsung di task aktif; buat commit `[MINOR]`; catat di `CHANGELOG.md` bagian Fixed/Changed. |
| **Level M / L** | Perubahan $> 20$ baris, melibatkan multi-berkas, skema database, atau alur bisnis baru | Periksa ketergantungan (prosedur di bawah). |

**Cek Ketergantungan Revisi:**
- **Revisi Dependen (Mengubah Task yang Sedang Berjalan):**
  Perbarui AC dan `Docs Impact` task aktif sebagai *scope change*, minta persetujuan pengguna, dan catat di WAL serta CHANGELOG.
- **Revisi Independen (Fitur Baru / Permintaan Terpisah):**
  1. Jeda task aktif: ubah statusnya menjadi `BLOCKED` (alasan: "preempted by TASK-REV-NN").
  2. Pindahkan isi WAL task aktif ke `Catatan Serah Terima`.
  3. Daftarkan `TASK-REV-NN` di `TASKS.md` dan `SESSION_STATE.md`.
  4. Eksekusi `TASK-REV-NN` sampai `DONE`.
  5. Pulihkan task reguler ke `IN_PROGRESS` dan kembalikan WAL-nya.

---

## 7. KONVENSI GIT & COMMIT

Format Conventional Commits:
```text
<tipe>(<lingkup>): <deskripsi ringkas> [TASK-XXX | TASK-REV-NN | MINOR]
```
Contoh:
- `feat(lacak): tambahkan filter instan posisi armada [TASK-006]`
- `fix(denda): koreksi kalkulator step-up denda 12 jam [TASK-REV-01]`
- `fix(ui): perbaiki typo label tarif harian [MINOR]`
- `wip(api): implementasi endpoint ketersediaan unit [TASK-005]` (titik simpan multi-langkah)

---

## 8. CHECKPOINT & WRITE-AHEAD LOG (WAL)

1. **Pengisian WAL (Sebelum Eksekusi):**
   Sebelum memulai langkah modifikasi multi-berkas, isi `SESSION_STATE.md` bagian 3: Task, Langkah Sedang Dikerjakan, Berkas Direncanakan/Disentuh, Langkah Berikutnya (persis), dan Perintah Verifikasi.
2. **Pembaruan WAL (Setelah Langkah Selesai):**
   Perbarui field `Sudah Dilakukan` dan `Langkah Berikutnya`. Kosongkan WAL (semua `-`) saat task telah `DONE`.
3. **Format Checkpoint Block (AI Tanpa Akses Tulis Langsung):**
   Jika AI beroperasi di lingkungan tanpa akses tulis disk langsung, cetak blok checkpoint berikut di akhir respons:
   ```text
   === ZLCE CHECKPOINT [YYYY-MM-DD (HH:MM TZ | jam: ?)] ===
   ## 1. STATUS AKTIF        (salinan lengkap bagian 1)
   ## 2. MATRIKS TASK        (hanya baris yang berubah)
   ## 3. WORK IN PROGRESS (WAL)  (salinan lengkap bagian 3)
   ## 6. CATATAN SERAH TERIMA (hanya bila berubah)
   ## 7. LOG AUDIT           (satu baris baru)
   === END CHECKPOINT ===
   ```

---

## 9. PROTOKOL PEMULIHAN SESI TERPUTUS (RECOVERY)

Dipicu jika sesi AI terputus, atau jika WAL di `SESSION_STATE.md` masih berisi task aktif saat sesi baru dibuka:

1. **Jalankan Snapshot:** Jalankan `bash scripts/zlce/zlce-snapshot.sh --diff` di terminal dan lampirkan hasilnya ke AI sesi baru.
2. **Klasifikasi Kasus Pemulihan:**
   - **Kasus A (Working Tree Bersih):** Langkah WAL belum sempat ditulis/tersimpan ke disk $\to$ ulangi pekerjaan dari field `Langkah Berikutnya` pada WAL.
   - **Kasus B (Diff Uncommitted Sesuai WAL):** Ada berkas yang teredit dan semuanya tercantum pada `Berkas Direncanakan/Disentuh` $\to$ pertahankan perubahan, evaluasi kelengkapan terhadap AC, lanjutkan. Dilarang `git reset` tanpa persetujuan pengguna.
   - **Kasus C (Ada Commit Baru di Luar State):** Commit sudah dibuat di Git tetapi belum tercermin di `SESSION_STATE.md` $\to$ sinkronkan tabel matriks `SESSION_STATE.md` dengan commit terbaru, lalu lakukan verifikasi ulang.
   - **Kasus D (Perubahan Berkas di Luar Daftar WAL):** Ditemukan modifikasi pada berkas yang tidak terdaftar di WAL $\to$ **TAHAN PERUBAHAN**, set task ke `BLOCKED`, laporkan kepada pengguna, dan minta konfirmasi.
3. **Bukti Verifikasi Baru:** Status `DONE` pada sesi recovery HANYA boleh diberikan berdasarkan bukti verifikasi yang baru dijalankan di sesi tersebut.

---

## 10. SPESIFIKASI PROYEK RYOKOURENT (MODE LITE)

1. **Sistem 1 Folder Kerja (`FOLDER_KERJA/`):**
   Pengguna hanya perlu mengunggah 1 folder kerja ini ke sesi AI baru:
   - `HANDOVER.md`: Prompt paten verbatim untuk jembatan antar-AI.
   - `NEW_TASK.md`: Tempat input tugas baru atau temuan uji manual (default: `Tidak ada`).
   - `SESSION_STATE.md`: Matriks status tunggal, WAL, dan log audit.
   - `SPEC_AND_DECISIONS.md`: Aturan bisnis `D-01` s/d `D-31` & skema 5 CPT.
   - `AI_WORKFLOW.md`: Berkas tata kelola dan aturan main operasional ini.
2. **Aturan Bisnis Inti Ryokourent:**
   - **D-26 Pool Tempat Parkir & CPT Lacak Unit:** Pool Malang/Batu hanya tempat parkir fisik (kuota global). Posisi real-time dilacak pada CPT `ryokou_lacak` (tepat 1 baris aktif per unit fisik).
   - **D-27 Denda ShortRent Step-Up 60 Menit:** Terlambat $\ge 60$ menit otomatis naik ke kategori jam di atasnya (3 Jam $\to$ 6 Jam $\to$ 9 Jam $\to$ 12 Jam). Untuk sewa 12 Jam, keterlambatan dikenakan denda harian (`_ryokou_denda_harian`).
   - **D-21 Kepatuhan UU PDP No. 27/2022:** DILARANG KERAS menyimpan NIK KTP 16 digit, foto KTP, alamat lengkap KTP, atau IP address pelanggan di database.
