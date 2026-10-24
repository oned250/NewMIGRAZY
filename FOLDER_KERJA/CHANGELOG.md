# LOG PERUBAHAN: RYOKOURENT RENTAL MOTOR

Semua perubahan penting pada proyek Ryokourent dicatat di berkas ini.
Format pencatatan mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.0.0/) dan mematuhi [Semantic Versioning](https://semver.org/).
Perubahan Level S (`[MINOR]`) dan task revisi (`TASK-REV-NN`) wajib tercatat di sini.

---

## [Unreleased]

### Added
- Penambahan skrip pemulihan darurat `scripts/zlce/zlce-snapshot.sh` dan wrapper `scripts/zlce-snapshot.sh` untuk otomasi snapshot sesi terputus (Kasus A–D).
- Penempatan tata kelola agen aktif `FOLDER_KERJA/AI_WORKFLOW.md` (menggabungkan aturan R1–R12 ZLCE kit dengan aturan proteksi kode `D-31`).
- Penambahan wrapper CLI `scripts/zlce-check.py` dan `scripts/zlce-collect.py`.
- Penyesuaian `scripts/zlce/zlce-check.py` agar otomatis mendeteksi berkas kontrol di `FOLDER_KERJA/` tanpa error path.

### Fixed
- Penyelarasan rujukan aturan `D-31` pada `FOLDER_KERJA/SPEC_AND_DECISIONS.md` agar merujuk ke `FOLDER_KERJA/AI_WORKFLOW.md`.
- Pembaruan daftar berkas 1 Folder Kerja di `README.md`.

---

## [2.1.0] - 2026-10-23

### Added
- [TASK-009] Penyelarasan sistem katalog motor WordPress dengan Model (003) React (6 model: Honda Scoopy, Yamaha NMAX, Honda CRF, Yamaha Fazzio, Yamaha R15, Honda BeAT).
- [TASK-007] Portal pemesanan mandiri publik modern berbasis React 19 / REST (`CustomerBookingPortal.tsx`).
- [TASK-006] Dashboard monitoring lacak unit real-time (`LiveUnitTrackingDashboard.tsx`).
- [TASK-005] Dashboard transaksi booking dan state machine 4 status (`BookingStateMachineManager.tsx`).
- [TASK-004] Dashboard unit armada fisik (`ArmadaUnitManager.tsx`).
- [TASK-003] Dashboard model dan katalog tarif multi-tier (`MotorModelManager.tsx`).
- [TASK-002] Skema PostgreSQL Cloud SQL 6 tabel dan konektor Drizzle ORM.
- [TASK-001] Restrukturisasi repositori ke Sistem 1 Folder Kerja (`FOLDER_KERJA/`).

### Changed
- [MINOR] Penyesuaian Kartu UI 3 "Impor Data Motor dari React (1-Klik)" pada halaman Pengaturan Operasional WP-Admin (`booking-columns.php`).
- [MINOR] Penambahan CPT `ryokou_lacak` (Lacak Unit) untuk pelacakan posisi real-time tanpa membagi kaku kuota pool (`D-26`).
- [MINOR] Kalkulator denda ShortRent step-up 60 menit dan denda harian untuk durasi 12 jam (`D-27`).
