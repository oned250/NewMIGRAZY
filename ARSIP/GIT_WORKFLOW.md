# STRUKTUR BRANCH GIT & STANDAR COMMIT: RYOKOURENT

Dokumen ini mengatur alur kerja Git (*Git Flow*), konvensi penamaan branch, dan pedoman *commit message* untuk repositori **Ryokourent**.

---

## 1. Struktur Cabang Utama (Main Branches)
* `main` — Cabang produksi stabil yang siap dipasang di server hosting live.
* `develop` — Cabang integrasi utama tempat seluruh task (`TASK-001` s/d `TASK-034`) digabungkan dan diuji sebelum rilis.

## 2. Cabang Fitur & Perbaikan (Supporting Branches)
* **Feature Branch:** `feature/TASK-XXX-nama-fitur` (contoh: `feature/TASK-033-cpt-lacak-unit`, `feature/TASK-034-denda-shortrent-stepup`)
* **Bugfix / Revision Branch:** `fix/D-XX-deskripsi-singkat` (contoh: `fix/D-26-pool-parkir-global`)

## 3. Standar Conventional Commits
Gunakan format berikut pada setiap commit:
```text
<tipe>(<cakupan>): <ringkasan singkat dalam bahasa Indonesia/Inggris> [TASK-XXX / D-XX]
```
Contoh:
- `feat(lacak-unit): tambah CPT ryokou_lacak dan hapus sekat kuota pool [TASK-033 / D-26]`
- `feat(denda): terapkan step-up 60 menit ShortRent dan denda 12 jam = harian [TASK-034 / D-27]`
- `docs(state): perbarui SESSION_STATE.md, TASKS.md, dan HANDOVER.md pasca TASK-034`
