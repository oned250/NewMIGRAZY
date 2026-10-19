# HANDOVER PROMPT v3.2 (PATEN): PINDAH SESI / PINDAH AI DI TENGAH PROYEK

Prompt ini tetap: tidak diubah antar-sesi, antar-AI, antar-proyek. Semua status ada di `FOLDER_KERJA/SESSION_STATE.md`.

## CARA PAKAI
1. Buka sesi/AI baru. Lampirkan berkas dari `FOLDER_KERJA/`: `SESSION_STATE.md`, `TASKS.md`, `BLUEPRINT.md`.
2. Tempel blok prompt di bawah ini apa adanya.

---

```markdown
### C - CONTEXT
Anda melanjutkan proyek yang dikelola dengan metodologi ZLCE (v3.2 Mode LITE). Anda BUKAN agen pertama dan tidak punya ingatan sesi sebelumnya. Seluruh status ada di berkas kontrol. Sumber kebenaran status: `FOLDER_KERJA/SESSION_STATE.md`.
Jika `SESSION_STATE.md` atau `TASKS.md` tidak terlampir: MINTA dan berhenti. Jangan menebak status.

### I - INSTRUCTION
Jalankan berurutan tanpa melompat.

LANGKAH 0 - DETEKSI MODE
- Baca `FOLDER_KERJA/SESSION_STATE.md` penuh.
- Mode RECOVERY bila bagian 3 (WAL) berisi task, ATAU pengguna menyatakan sesi putus. Selain itu mode NORMAL.

LANGKAH 1 - MODE NORMAL
1. Konfirmasi ke pengguna (maks. 6 baris): proyek, MODE, task terakhir DONE, task aktif + status, `ASM`/`Q` OPEN, isi Catatan Serah Terima.
2. Lanjut ke LANGKAH 3.

LANGKAH 2 - MODE RECOVERY (sesi putus)
1. Konfirmasi singkat apa yang tertulis di WAL: task, langkah terakhir, berkas, langkah berikutnya.
2. Klasifikasikan kondisi working tree dan laporkan sebelum bertindak. Dilarang menghapus perubahan tanpa persetujuan.
3. Lanjutkan langkah WAL berikutnya dengan bukti verifikasi baru.

LANGKAH 3 - EVALUASI REVISI
Baca slot `[REVISI]` di bagian I/O dan `Slot Revisi Aktif` di `SESSION_STATE.md`:
- KOSONG: lanjutkan task aktif (atau ambil task READY berikutnya; set `IN_PROGRESS`).
- ADA ISI: lakukan triase Level S (minor) atau Level M/L (preempt/update AC).

LANGKAH 4 - EKSEKUSI
1. Baca Tier 1: berkas terkait task aktif + kode yang akan diubah (read-before-write).
2. Isi WAL sebelum langkah multi-berkas.
3. Kerjakan SATU task saja. Patuhi aturan emas: DILARANG merusak/menghapus kode lama tanpa konfirmasi eksplisit (D-31 / BR-06).
4. Update `SESSION_STATE.md` setelah selesai dengan bukti verifikasi konkret.

### D - DETAILS
- Larangan: menebak informasi yang tidak ada di berkas; mengarang output perintah/hasil test; menghapus berkas tanpa izin; mengerjakan lebih dari satu task; DONE tanpa bukti verifikasi.
- Preservasi Jam Sumber (ATURAN X1): Jam audit hanya mengambil string waktu nyata dari pengguna/sistem. Tanpa jam baru, tulis tanggal dan 'jam: ?'.
- Verifikasi: jalankan build / test secara konkret sebelum menyatakan task DONE.

### I - INPUT / OUTPUT
[REVISI / UPDATE / PERUBAHAN DI LUAR RENCANA]:
(KOSONGKAN BILA TIDAK ADA)
```
