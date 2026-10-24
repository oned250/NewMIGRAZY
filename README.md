# Ryokourent — Rental Sepeda Motor Malang Raya & Kota Wisata Batu

Sistem manajemen rental sepeda motor WordPress Native (`ryokourent-core` + `generatepress-child`) dengan pelacakan posisi unit *real-time* (`CPT Lacak Unit` — `D-26`), kalkulator denda ShortRent Step-Up 60 Menit (`D-27`), dan tata kelola **Sistem 1 Folder Kerja (`D-29`)**.

---

## Struktur 3 Folder Markdown (`D-29`)

1. **`FOLDER_KERJA/` — WAJIB DI-UPLOAD DI SETIAP SESI AI (1 Folder Saja!)**
   - `FOLDER_KERJA/HANDOVER.md` — Prompt Jembatan Antar-AI permanen (siap salin).
   - `FOLDER_KERJA/NEW_TASK.md` — Tempat Anda menulis task baru / temuan uji manual / perubahan aturan (default: `Tidak ada`).
   - `FOLDER_KERJA/SESSION_STATE.md` — Status sesi terakhir & checklist checkpoint `[x]` / `[ ]` untuk sambung kerja bila terputus.
   - `FOLDER_KERJA/SPEC_AND_DECISIONS.md` — Acuan tunggal keputusan bisnis (`D-01..D-31`) & skema 5 CPT.
   - `FOLDER_KERJA/AI_WORKFLOW.md` — Tata kelola operasional agen, aturan R1–R12, triase revisi R7, dan proteksi kode `D-31`.

2. **`docs/` — KHUSUS TUTORIAL & PANDUAN (Tidak Perlu Di-upload / Dibaca Rutin)**
   - `docs/PANDUAN_WIZARD_RECOVERY_ZLCE.md` — Tutorial pemakaian Fitur Wizard Recovery ZLCE untuk memulihkan sesi AI terputus di HP/Android & desktop.
   - `docs/PANDUAN_IMPORT_DATA_MOTOR_DARI_REACT.md` — Panduan impor 6 model motor contoh ke WordPress (1-klik / Smart Fallback).
   - `docs/PANDUAN_XAMPP_WIN11_SIMULASI.md` — Tutorial instalasi XAMPP Windows 11 & simulasi pelatihan operator.
   - `docs/OPERATOR_MANUAL.md` — Panduan operasional harian staf operator.
   - `docs/ADMIN_GUIDE.md` — Panduan administrator/pemilik.
   - `docs/DEPLOYMENT_GUIDE.md` — Panduan deployment ke server produksi.

3. **`ARSIP/` — KUMPULAN SEMUA MD LAMA (Diarsipkan Permanen)**
   - Menyimpan 15 berkas MD tata kelola lama (`AI_RULES.md`, `AI_WORKFLOW.md`, `BLUEPRINT.md`, `TASKS.md`, `TESTING.md`, `DECISIONS.md`, dll.) yang sudah dilebur ke dalam `FOLDER_KERJA/`.
