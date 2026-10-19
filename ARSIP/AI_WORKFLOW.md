# AI WORKFLOW & GOVERNANCE: RYOKOURENT

Dokumen ini mengatur pembagian peran kerja, alur pemeriksaan **`NEW_TASK.md`**, alur tinjauan kode (*code review*), standar git branching, dan batasan operasional dalam pengembangan proyek Ryokourent (`D-01..D-28`).

---

## 1. Alur Kerja Utama Berbasis `NEW_TASK.md` (`D-28`)

Agar alur kerja sangat jelas dan `docs/HANDOVER.md` tidak perlu diedit manual oleh pemilik setiap kali ada temuan uji manual, perubahan aturan, atau koreksi error, seluruh input baru dipusatkan di satu berkas khusus: **`NEW_TASK.md`**.

```
               [ Mulai Sesi: Salin Prompt dari docs/HANDOVER.md ]
                                       │
                                       ▼
                        [ 1. Baca Berkas NEW_TASK.md ]
                                       │
                  ┌────────────────────┴────────────────────┐
                  ▼                                         ▼
     [ JIKA BERISI PERMINTAAN BARU /            [ JIKA TERTULIS "Tidak ada" ]
       PERUBAHAN / KOREKSI ERROR ]                          │
                  │                                         ▼
                  ▼                            • Lanjutkan ke langkah seperti
     • Klasifikasikan:                           biasa: baca SESSION_STATE.md
       a) Koreksi Error / Bugfix UAT             & kerjakan Task berikutnya
       b) Perubahan Aturan Bisnis (D-XX)         dari TASKS.md
       c) Permintaan Fitur Baru (TASK-0XX)                  │
     • Jika ubah aturan/skema: update                       │
       DECISIONS.md (sinkronkan D-lama)                     │
       & DATA_MODEL.md                                      │
     • Catat TASK-0XX baru di TASKS.md                      │
     • Implementasi kode & uji                              │
     • Reset isi NEW_TASK.md -> "Tidak ada"                 │
                  │                                         │
                  └────────────────────┬────────────────────┘
                                       ▼
          [ Update SESSION_STATE.md, TASKS.md, CHANGELOG.md, & HANDOVER.md ]
                                       │
                                       ▼
                        [ Keluarkan FORMAT LAPORAN (8 POIN) ]
```

---

## 2. Pembagian Peran AI & Pengembang

| Peran | Tanggung Jawab Utama | Dokumen Pegangan |
| :--- | :--- | :--- |
| **1. AI Architect & Analyst** | Membaca `NEW_TASK.md`, merumuskan keputusan bisnis (`DECISIONS.md`), memperbarui skema (`DATA_MODEL.md`), dan mendaftarkan task ke `TASKS.md`. | `NEW_TASK.md`, `DECISIONS.md`, `DATA_MODEL.md`, `ARCHITECTURE.md` |
| **2. AI Engineer (Implementer)** | Menulis atau memperbaiki kode plugin `ryokourent-core` dan child theme `generatepress-child` sesuai `NEW_TASK.md` atau task aktif di `SESSION_STATE.md`. | `NEW_TASK.md`, `TASKS.md`, `AI_RULES.md`, `docs/CODING_STANDARDS.md` |
| **3. AI Reviewer & QA Engineer** | Memverifikasi hasil kerja terhadap `TESTING.md` (`QA-01..QA-25`), mengembalikan `NEW_TASK.md` ke `Tidak ada`, dan memperbarui `SESSION_STATE.md` serta `docs/HANDOVER.md`. | `TESTING.md`, `NEW_TASK.md`, `SESSION_STATE.md`, `docs/HANDOVER.md` |

---

## 3. Human Review Gate (Gerbang Persetujuan Manusia)

AI wajib berhenti dan meminta persetujuan pemilik terlebih dahulu apabila pekerjaan di luar instruksi eksplisit `NEW_TASK.md` menyentuh:
1. Perubahan struktur Custom Post Type (`motor`, `ryokou_unit`, `ryokou_lacak`, `penyewaan`, `ryokou_paket`) atau post status.
2. Perubahan rumus tarif atau denda keterlambatan.
3. Penyimpanan data identitas pelanggan yang berisiko melanggar **UU PDP No. 27/2022 (`D-21`)**.
