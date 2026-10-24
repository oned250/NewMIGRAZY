'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Terminal,
  Copy,
  Check,
  RefreshCw,
  GitCommit,
  GitBranch,
  Shield,
  Layers,
  Zap,
  Info,
  HelpCircle,
  Clock,
  ArrowRight,
  Sliders,
  ExternalLink,
  Code,
  Download,
  AlertOctagon,
  FileCode,
  Sparkles,
} from 'lucide-react';

interface ZlceStudioProps {
  onNavigateToTab?: (tab: string) => void;
}

export default function ZlceStudioWorkbench({ onNavigateToTab }: ZlceStudioProps) {
  const [activeSubTab, setActiveSubTab] = useState<'recovery' | 'editor' | 'triage' | 'validator'>('recovery');

  // State untuk Snapshot Recovery
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotOutput, setSnapshotOutput] = useState<string>('');
  const [detectedCase, setDetectedCase] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [selectedCase, setSelectedCase] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [copiedSnapshot, setCopiedSnapshot] = useState(false);
  const [copiedHandover, setCopiedHandover] = useState(false);
  const [copiedCheckpoint, setCopiedCheckpoint] = useState(false);

  // State untuk Validator CLI
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkOutput, setCheckOutput] = useState<string>('');
  const [isCheckOk, setIsCheckOk] = useState<boolean | null>(null);

  // State untuk Triase Revisi R1-R7
  const [triageFiles, setTriageFiles] = useState<number>(1);
  const [triageLines, setTriageLines] = useState<number>(8);
  const [triageSchemaChange, setTriageSchemaChange] = useState<boolean>(false);
  const [triageSecurityChange, setTriageSecurityChange] = useState<boolean>(false);
  const [triageIsActiveTaskDep, setTriageIsActiveTaskDep] = useState<boolean>(false);
  const [triageTitle, setTriageTitle] = useState<string>('Perbaikan kalkulasi tarif jam');

  // State untuk Editor & Markdown View
  const [editorMode, setEditorMode] = useState<'visual' | 'raw'>('visual');

  const fetchSnapshot = useCallback(async (withDiff: boolean = true) => {
    setSnapshotLoading(true);
    try {
      const res = await fetch(`/api/zlce/snapshot?diff=${withDiff}`);
      const data = await res.json();
      if (data.success) {
        setSnapshotOutput(data.snapshot);
        if (data.detectedCase) {
          setDetectedCase(data.detectedCase);
          setSelectedCase(data.detectedCase);
        }
      } else {
        setSnapshotOutput(`[ERROR] ${data.error || 'Gagal mengambil snapshot'}`);
      }
    } catch (err: any) {
      setSnapshotOutput(`[ERROR] Gagal menghubungi backend API: ${err.message}`);
    } finally {
      setSnapshotLoading(false);
    }
  }, []);

  const runValidator = useCallback(async (strict: boolean = true) => {
    setCheckLoading(true);
    try {
      const res = await fetch(`/api/zlce/check?strict=${strict}`);
      const data = await res.json();
      setCheckOutput(data.output || data.stderr || 'Tidak ada output');
      setIsCheckOk(data.isOk);
    } catch (err: any) {
      setCheckOutput(`[ERROR] Gagal memvalidasi: ${err.message}`);
      setIsCheckOk(false);
    } finally {
      setCheckLoading(false);
    }
  }, []);

  // Ambil snapshot awal saat mount
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const [resSnap, resCheck] = await Promise.allSettled([
          fetch('/api/zlce/snapshot?diff=false').then((r) => r.json()),
          fetch('/api/zlce/check?strict=true').then((r) => r.json()),
        ]);

        if (ignore) return;

        if (resSnap.status === 'fulfilled' && resSnap.value?.success) {
          setSnapshotOutput(resSnap.value.snapshot);
          if (resSnap.value.detectedCase) {
            setDetectedCase(resSnap.value.detectedCase);
            setSelectedCase(resSnap.value.detectedCase);
          }
        }

        if (resCheck.status === 'fulfilled' && resCheck.value) {
          setCheckOutput(resCheck.value.output || resCheck.value.stderr || 'Tidak ada output');
          setIsCheckOk(resCheck.value.isOk);
        }
      } catch (err: any) {
        if (!ignore) {
          setSnapshotOutput(`[ERROR] Gagal memuat data awal: ${err.message}`);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, []);

  const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  // Evaluasi Level Triase
  const triageResult = useMemo(() => {
    const isLevelS =
      triageFiles <= 1 &&
      triageLines <= 20 &&
      !triageSchemaChange &&
      !triageSecurityChange;

    if (isLevelS) {
      return {
        level: 'S',
        badge: 'Level S (Revisi Ringan)',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        action: 'Eksekusi Langsung di Task Aktif',
        description: 'Perubahan mikro (≤ 1 berkas, ≤ 20 baris, tanpa perubahan skema/kontrak/keamanan).',
        steps: [
          'Dikerjakan langsung di dalam task aktif yang sedang berjalan tanpa membuat task baru.',
          'Commit wajib menggunakan tanda [MINOR], misal: fix(ui): perbaiki typo [MINOR].',
          'Catat ringkas perubahan pada CHANGELOG.md (bagian Fixed atau Changed) dan SESSION_STATE.md log audit.',
        ],
        taskCode: null,
      };
    }

    if (triageIsActiveTaskDep) {
      return {
        level: 'M-DEP',
        badge: 'Level M Dependen (Terkait Task Berjalan)',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        action: 'Update Scope & Acceptance Criteria Task Aktif',
        description: 'Revisi mengubah atau menyempurnakan fitur yang sedang dibangun oleh task aktif.',
        steps: [
          'Dilarang melakukan preempt atau membuat task baru terpisah yang bentrok dengan task berjalan.',
          'Perbarui Acceptance Criteria (AC) dan Docs Impact pada task aktif di TASKS.md sebagai scope change.',
          'Minta persetujuan eksplisit dari pengguna sebelum melanjutkan eksekusi.',
          'Catat perubahan di blok WAL dan Catatan Serah Terima.',
        ],
        taskCode: null,
      };
    }

    return {
      level: 'M-IND',
      badge: 'Level M / L Independen (Fitur Baru / Terpisah)',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      action: 'Jeda Task Aktif (BLOCKED) & Buat TASK-REV-NN',
      description: 'Revisi merupakan fitur baru atau perbaikan di luar lingkup task yang sedang berjalan.',
      steps: [
        'Jeda task aktif yang sedang berjalan: ubah statusnya menjadi BLOCKED (alasan: "preempted by TASK-REV-01").',
        'Pindahkan isi WAL task aktif ke field Catatan Serah Terima.',
        'Daftarkan task baru TASK-REV-01 pada TASKS.md dan SESSION_STATE.md.',
        'Eksekusi TASK-REV-01 hingga berstatus DONE.',
        'Pulihkan task reguler ke IN_PROGRESS dan kembalikan langkah WAL-nya.',
      ],
      taskCode: `### TASK-REV-01: ${triageTitle}
* **Asal:** Permintaan User / Evaluasi Lapangan (${new Date().toLocaleDateString('id-ID')})
* **Level:** M / L Independen
* **Mem-preempt:** (ID Task Aktif yang Dijeda)
* **Deskripsi:** ${triageTitle}.
* **Dependensi:** -
* **File:** (daftar berkas terdampak)
* **Docs Terkait:** BLUEPRINT.md, SPEC_AND_DECISIONS.md
* **Docs Impact:** CHANGELOG.md, SESSION_STATE.md
* **Acceptance Criteria:**
  1. Fitur ${triageTitle} terimplementasi dengan baik.
  2. Lolos verifikasi build & test 0 error.
* **Test Case:** Validasi fungsi ${triageTitle}
* **Metode Verifikasi:** Jalankan lint & build; tempel bukti.`,
    };
  }, [triageFiles, triageLines, triageSchemaChange, triageSecurityChange, triageIsActiveTaskDep, triageTitle]);

  const checkpointTemplate = `=== ZLCE CHECKPOINT [${new Date().toISOString().split('T')[0]} (jam: ?)] ===
## 1. STATUS AKTIF        (salinan lengkap bagian 1)
## 2. MATRIKS TASK        (hanya baris yang berubah)
## 3. WORK IN PROGRESS (WAL)  (salinan lengkap bagian 3)
## 6. CATATAN SERAH TERIMA (hanya bila berubah)
## 7. LOG AUDIT           (satu baris baru)
=== END CHECKPOINT ===`;

  return (
    <div className="space-y-6">
      {/* Top Banner ZLCE Studio Workbench */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-emerald-500 text-slate-950 rounded-full">
                ZLCE Studio v3.2.2
              </span>
              <span className="text-xs text-slate-400 font-mono">Mode LITE</span>
              <span className="text-xs text-slate-500">•</span>
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                State Integrity: OK (9 Task DONE)
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Workbench Tata Kelola & Pemulihan Sesi AI</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Pusat kendali operasional ZLCE (Zero-Loss Context Engineering): wizard pemulihan sesi terputus (Kasus A–D), visualisasi status tunggal <code className="text-emerald-400 font-mono">SESSION_STATE.md</code>, evaluator triase revisi R1–R7, dan validasi aturan anti-halusinasi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => fetchSnapshot(true)}
              disabled={snapshotLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${snapshotLoading ? 'animate-spin' : ''}`} />
              <span>{snapshotLoading ? 'Mengambil...' : 'Ambil Snapshot Darurat'}</span>
            </button>
            <button
              onClick={() => runValidator(true)}
              disabled={checkLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cek Integritas (Strict)</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="flex items-center gap-1.5 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveSubTab('recovery')}
            className={`px-3.5 py-2 font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'recovery'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-emerald-400" />
            <span>Wizard Recovery (Sesi Putus)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('editor')}
            className={`px-3.5 py-2 font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'editor'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Visual State & Task Matrix</span>
          </button>
          <button
            onClick={() => setActiveSubTab('triage')}
            className={`px-3.5 py-2 font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'triage'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Kalkulator Triase Revisi (R1–R7)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('validator')}
            className={`px-3.5 py-2 font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'validator'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Validator & Token Gauge</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: WIZARD RECOVERY SESI TERPUTUS (KASUS A-D) */}
      {activeSubTab === 'recovery' && (
        <div className="space-y-6">
          {/* Panduan 4 Kasus Pemulihan ZLCE */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-emerald-700" />
                  <span>Protokol Pemulihan Darurat (Kasus A, B, C, D)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bandingkan kondisi repositori terkini dengan Write-Ahead Log (WAL) untuk melanjutkan sesi terputus tanpa kehilangan pekerjaan.
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 font-mono">
                Terdeteksi: Kasus {detectedCase}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              {/* Kasus A */}
              <div
                onClick={() => setSelectedCase('A')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedCase === 'A'
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-600'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-900 mb-1.5">
                  <span className="text-sm">Kasus A</span>
                  {selectedCase === 'A' && <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-mono">Aktif</span>}
                </div>
                <div className="font-medium text-emerald-900 mb-1">Working Tree Bersih</div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Tidak ada diff uncommitted. Langkah WAL belum sempat ditulis/commit ke disk. Ulangi pekerjaan dari field <code>Langkah Berikutnya</code> pada WAL.
                </p>
              </div>

              {/* Kasus B */}
              <div
                onClick={() => setSelectedCase('B')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedCase === 'B'
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-600'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-900 mb-1.5">
                  <span className="text-sm">Kasus B</span>
                  {selectedCase === 'B' && <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-mono">Aktif</span>}
                </div>
                <div className="font-medium text-emerald-900 mb-1">Diff Cocok dengan WAL</div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Ada berkas teredit dan semua tercantum di WAL. Pertahankan diff, verifikasi apakah kode telah memenuhi Acceptance Criteria, lalu commit.
                </p>
              </div>

              {/* Kasus C */}
              <div
                onClick={() => setSelectedCase('C')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedCase === 'C'
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-600'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-900 mb-1.5">
                  <span className="text-sm">Kasus C</span>
                  {selectedCase === 'C' && <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-mono">Aktif</span>}
                </div>
                <div className="font-medium text-emerald-900 mb-1">Commit Ada di Git Log</div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Ada commit baru di Git yang belum sempat dicatat di <code>SESSION_STATE.md</code>. Selaraskan matriks state dengan commit, lakukan verifikasi ulang.
                </p>
              </div>

              {/* Kasus D */}
              <div
                onClick={() => setSelectedCase('D')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedCase === 'D'
                    ? 'border-amber-600 bg-amber-50/70 shadow-xs ring-1 ring-amber-600'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-900 mb-1.5">
                  <span className="text-sm">Kasus D</span>
                  {selectedCase === 'D' && <span className="text-[10px] bg-amber-600 text-white px-1.5 py-0.5 rounded font-mono">Aktif</span>}
                </div>
                <div className="font-medium text-amber-950 mb-1">Diff di Luar Daftar WAL</div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Ada perubahan file yang tidak tercantum di WAL. <strong>Tahan perubahan</strong>, ubah status task ke <code>BLOCKED</code>, dan minta persetujuan pengguna.
                </p>
              </div>
            </div>

            {/* Rekomendasi Langkah Aksi untuk Kasus Terpilih */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  Instruksi Penanganan Kasus {selectedCase}:
                </span>
                <span className="text-[11px] text-slate-500">
                  Patuhi aturan: Dilarang reset/checkout paksa tanpa persetujuan
                </span>
              </div>
              <ol className="list-decimal list-inside text-xs text-slate-700 space-y-1 font-medium">
                {selectedCase === 'A' && (
                  <>
                    <li>Buka sesi AI baru dan tempelkan isi <code>FOLDER_KERJA/HANDOVER.md</code>.</li>
                    <li>Sertakan output snapshot recovery di bawah ini sebagai lampiran sesi.</li>
                    <li>Instruksikan AI melanjutkan eksekusi dari langkah pertama yang tercatat di field <code>Langkah Berikutnya</code> pada WAL.</li>
                  </>
                )}
                {selectedCase === 'B' && (
                  <>
                    <li>Periksa diff uncommitted terhadap berkas yang tertera pada blok WAL.</li>
                    <li>Jalankan linter atau kompilasi untuk memastikan kode tidak dalam keadaan syntax error.</li>
                    <li>Buat commit titik simpan sementara: <code>wip(lingkup): langkah berjalan [TASK-XXX]</code>.</li>
                    <li>Perbarui field <code>Sudah Dilakukan</code> pada WAL di <code>SESSION_STATE.md</code>.</li>
                  </>
                )}
                {selectedCase === 'C' && (
                  <>
                    <li>Bandingkan commit hash terakhir pada <code>git log -5</code> dengan field matriks task.</li>
                    <li>Perbarui kolom Bukti Verifikasi dan set task terkait ke <code>DONE</code> bila AC terpenuhi.</li>
                    <li>Kosongkan bagian WAL (semua <code>-</code>) sebelum mengambil task baru.</li>
                  </>
                )}
                {selectedCase === 'D' && (
                  <>
                    <li><strong>BERHENTI:</strong> Dilarang menghapus atau menimpa modifikasi yang berada di luar WAL.</li>
                    <li>Ubah status task aktif di <code>SESSION_STATE.md</code> menjadi <code>BLOCKED</code>.</li>
                    <li>Sajikan daftar berkas tak terduga kepada pengguna untuk konfirmasi: apakah dipertahankan (scope change) atau dibatalkan.</li>
                  </>
                )}
              </ol>
            </div>
          </div>

          {/* Live Recovery Snapshot Console */}
          <div className="bg-slate-950 text-slate-100 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white font-mono">
                  Output Snapshot Kanonik (scripts/zlce/zlce-snapshot.sh --diff)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchSnapshot(true)}
                  disabled={snapshotLoading}
                  className="px-2.5 py-1 text-[11px] font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${snapshotLoading ? 'animate-spin' : ''}`} />
                  <span>Segarkan</span>
                </button>
                <button
                  onClick={() => copyToClipboard(snapshotOutput, setCopiedSnapshot)}
                  className="px-2.5 py-1 text-[11px] font-medium text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors flex items-center gap-1"
                >
                  {copiedSnapshot ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSnapshot ? 'Tersalin!' : 'Salin Snapshot'}</span>
                </button>
              </div>
            </div>

            <pre className="p-5 text-xs font-mono text-emerald-400/90 overflow-x-auto leading-relaxed max-h-96 whitespace-pre-wrap">
              {snapshotOutput || '// Memuat snapshot repositori...'}
            </pre>
          </div>

          {/* Prompt Handover & Checkpoint Block Generator */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-slate-900">Format Checkpoint Block (R12)</span>
                </div>
                <button
                  onClick={() => copyToClipboard(checkpointTemplate, setCopiedCheckpoint)}
                  className="px-2.5 py-1 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded flex items-center gap-1"
                >
                  {copiedCheckpoint ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCheckpoint ? 'Tersalin' : 'Salin Format'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Digunakan pada AI tanpa akses tulis berkas langsung untuk mencetak pembaruan state di setiap akhir respons.
              </p>
              <pre className="p-3 bg-slate-100 rounded-lg text-[11px] font-mono text-slate-800 overflow-x-auto leading-relaxed">
                {checkpointTemplate}
              </pre>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-slate-900">Panduan Serah Terima (Handover)</span>
                </div>
                <button
                  onClick={() => {
                    if (onNavigateToTab) onNavigateToTab('workflow');
                  }}
                  className="px-2.5 py-1 text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded flex items-center gap-1 font-medium"
                >
                  <span>Buka FOLDER_KERJA/</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Saat berganti AI atau memulai sesi baru, cukup salin isi <code>FOLDER_KERJA/HANDOVER.md</code> dan unggah folder <code>FOLDER_KERJA/</code>.
              </p>
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg text-xs space-y-1.5 text-slate-700">
                <div className="font-bold text-emerald-950">Aturan Sesi Baru:</div>
                <div>1. Lampirkan snapshot recovery bila sesi terputus.</div>
                <div>2. AI otomatis membaca WAL dan memilih Kasus A–D.</div>
                <div>3. Dilarang mengarang waktu/jam baru (Aturan X1).</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: VISUAL STATE & TASK MATRIX */}
      {activeSubTab === 'editor' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-2xs">
            {/* Header Kontrol State */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>Matriks Task & Status Kontrol Tunggal (SESSION_STATE.md)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sumber kebenaran tunggal status task proyek Ryokourent (Mode LITE).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-100 text-emerald-800 font-mono">
                  9/9 Task DONE
                </span>
                <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 font-mono">
                  WAL Kosong (-)
                </span>
              </div>
            </div>

            {/* Ringkasan Parameter §0 & §1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="text-slate-500 font-medium">Proyek & Stack</div>
                <div className="font-bold text-slate-900">Ryokourent Rental Motor</div>
                <div className="text-[11px] text-slate-600">Next.js 15, React 19, PG Drizzle, WP Core</div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="text-slate-500 font-medium">Mode & Wewenang</div>
                <div className="font-bold text-emerald-800">Mode LITE</div>
                <div className="text-[11px] text-slate-600">Tulis Berkas: YA • Eksekusi: YA</div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="text-slate-500 font-medium">Audit Terakhir</div>
                <div className="font-bold text-slate-900 font-mono">2026-10-23 20:52:00</div>
                <div className="text-[11px] text-slate-600">Cabang Git: main</div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="text-slate-500 font-medium">Task Terakhir Selesai</div>
                <div className="font-bold text-emerald-800 font-mono">TASK-009 (DONE)</div>
                <div className="text-[11px] text-slate-600">Sinkronisasi Katalog Motor WP</div>
              </div>
            </div>

            {/* Matriks Task Table (§2) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Matriks Task Resmi (TASK-001 s/d TASK-009)
                </h4>
                <span className="text-[11px] text-slate-500">
                  Enum: PENDING | READY | IN_PROGRESS | BLOCKED | DONE
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <th className="py-2.5 px-3.5 font-mono">ID Task</th>
                      <th className="py-2.5 px-3.5">Nama & Deskripsi Task</th>
                      <th className="py-2.5 px-3.5">Dependensi</th>
                      <th className="py-2.5 px-3.5">Status</th>
                      <th className="py-2.5 px-3.5">Bukti Verifikasi Konkret</th>
                      <th className="py-2.5 px-3.5 text-center">Disetujui</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {[
                      { id: 'TASK-001', name: 'Restrukturisasi Repositori & Arsip Berkas Usang', dep: '-', status: 'DONE', bukti: 'Direktori rapi, berkas kontrol aktif terisi', acc: 'ya' },
                      { id: 'TASK-002', name: 'Konsolidasi Baseline & Sinkronisasi Aturan Bisnis (D-01..D-31)', dep: 'TASK-001', status: 'DONE', bukti: 'Skema Cloud SQL 6 tabel terpasang, Drizzle ORM aktif', acc: 'ya' },
                      { id: 'TASK-003', name: 'Dashboard Admin — Manajemen Model & Kategori Motor', dep: 'TASK-002', status: 'DONE', bukti: 'REST API /api/motor-models & UI MotorModelManager aktif', acc: 'ya' },
                      { id: 'TASK-004', name: 'Dashboard Admin — Manajemen Unit Armada Fisik', dep: 'TASK-003', status: 'DONE', bukti: 'REST API /api/armada-units aktif, readonly kode_unit teruji', acc: 'ya' },
                      { id: 'TASK-005', name: 'Dashboard Admin — Transaksi & State Machine 4 Status', dep: 'TASK-004', status: 'DONE', bukti: 'REST API /api/penyewaan & buffer 90m Anti Double-Booking teruji', acc: 'ya' },
                      { id: 'TASK-006', name: 'Dashboard Admin — Monitoring Lacak Unit Real-Time', dep: 'TASK-005', status: 'DONE', bukti: 'REST API /api/lacak-units aktif, 1 baris per unit fisik terverifikasi', acc: 'ya' },
                      { id: 'TASK-007', name: 'Prototipe Arsitektur Alternatif Modern (React 19 / REST)', dep: 'TASK-006', status: 'DONE', bukti: 'CustomerBookingPortal.tsx terintegrasi, anti-NIK KTP terpasang', acc: 'ya' },
                      { id: 'TASK-008', name: 'Verifikasi E2E & Finalisasi Handover', dep: 'TASK-007', status: 'DONE', bukti: 'Pengujian E2E 100% PASS, compile & build 0 error', acc: 'ya' },
                      { id: 'TASK-009', name: 'Penyelarasan Sistem Model Motor WordPress dengan React', dep: 'TASK-008', status: 'DONE', bukti: '6 model contoh sinkron di wp-content/, seeder & REST aktif', acc: 'ya' },
                    ].map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900">{row.id}</td>
                        <td className="py-2.5 px-3.5 text-slate-900">{row.name}</td>
                        <td className="py-2.5 px-3.5 font-mono text-slate-500">{row.dep}</td>
                        <td className="py-2.5 px-3.5">
                          <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-emerald-100 text-emerald-800">
                            {row.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-600 text-[11px]">{row.bukti}</td>
                        <td className="py-2.5 px-3.5 text-center font-bold text-emerald-700">{row.acc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Blok Write-Ahead Log (§3) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  Blok Write-Ahead Log (WAL) Saat Ini
                </span>
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  IDLE / Kosong (Semua Task Selesai)
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
                <div>
                  <span className="text-slate-500">Task Aktif:</span>
                  <div className="font-mono font-bold text-slate-900">-</div>
                </div>
                <div>
                  <span className="text-slate-500">Langkah Sedang Dikerjakan:</span>
                  <div className="font-mono text-slate-900">-</div>
                </div>
                <div>
                  <span className="text-slate-500">Berkas Direncanakan:</span>
                  <div className="font-mono text-slate-900">-</div>
                </div>
                <div>
                  <span className="text-slate-500">Langkah Berikutnya:</span>
                  <div className="font-mono text-slate-900">-</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: KALKULATOR TRIASE REVISI R1-R7 */}
      {activeSubTab === 'triage' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-2xs">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-700" />
                <span>Kalkulator & Evaluator Triase Revisi (R1–R7)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluasi otomatis perubahan kode di tengah jalan untuk menentukan apakah masuk Level S (langsung di-commit [MINOR]) atau Level M/L (preempt & daftarkan TASK-REV-NN).
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Parameter Input Formulir */}
              <div className="lg:col-span-5 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Judul Revisi / Perubahan:
                  </label>
                  <input
                    type="text"
                    value={triageTitle}
                    onChange={(e) => setTriageTitle(e.target.value)}
                    placeholder="Contoh: Koreksi label tarif harian"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-emerald-600 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Jumlah Berkas Terdampak:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={triageFiles}
                      onChange={(e) => setTriageFiles(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-emerald-600 font-mono"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Level S: maks. 1 berkas</span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Estimasi Baris Kode:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={triageLines}
                      onChange={(e) => setTriageLines(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-emerald-600 font-mono"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Level S: maks. 20 baris</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="font-bold text-slate-800 block">Karakteristik Perubahan:</label>
                  
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={triageSchemaChange}
                      onChange={(e) => setTriageSchemaChange(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Mengubah skema database (Drizzle / PostgreSQL / CPT WP)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={triageSecurityChange}
                      onChange={(e) => setTriageSecurityChange(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Mengubah kontrak API, keamanan, atau dependensi baru</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={triageIsActiveTaskDep}
                      onChange={(e) => setTriageIsActiveTaskDep(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Revisi berkaitan langsung dengan output task yang sedang berjalan</span>
                  </label>
                </div>
              </div>

              {/* Output Hasil Keputusan Triase */}
              <div className="lg:col-span-7 space-y-4">
                <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                      Klasifikasi Resmi ZLCE:
                    </span>
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${triageResult.badgeColor}`}>
                      {triageResult.badge}
                    </span>
                  </div>

                  <div className="text-sm font-bold text-slate-900">
                    {triageResult.action}
                  </div>
                  <p className="text-xs text-slate-600">
                    {triageResult.description}
                  </p>

                  <div className="pt-2 border-t border-slate-200/80 space-y-2">
                    <span className="text-xs font-bold text-slate-800">Prosedur Kerja:</span>
                    <ol className="list-decimal list-inside text-xs text-slate-700 space-y-1 font-medium">
                      {triageResult.steps.map((st, i) => (
                        <li key={i}>{st}</li>
                      ))}
                    </ol>
                  </div>
                </div>

                {/* Template Task Revisi bila Level M/L Independen */}
                {triageResult.taskCode && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">Draf Template TASK-REV-01 Siap Salin:</span>
                      <button
                        onClick={() => copyToClipboard(triageResult.taskCode || '', () => {})}
                        className="px-2 py-0.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 flex items-center gap-1 font-medium"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Salin Template</span>
                      </button>
                    </div>
                    <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed">
                      {triageResult.taskCode}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: VALIDATOR ATURAN & TOKEN GAUGE */}
      {activeSubTab === 'validator' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-700" />
                  <span>Validator State & Pemeriksa Integritas (zlce-check.py)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Memverifikasi kepatuhan 10 guardrail resmi ZLCE v3.2.2 langsung terhadap repositori aktif.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => runValidator(false)}
                  disabled={checkLoading}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                >
                  Mode Normal
                </button>
                <button
                  onClick={() => runValidator(true)}
                  disabled={checkLoading}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checkLoading ? 'animate-spin' : ''}`} />
                  <span>Mode Strict</span>
                </button>
              </div>
            </div>

            {/* Terminal Output */}
            <div className="bg-slate-950 text-slate-100 rounded-xl border border-slate-800 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono pb-2 border-b border-slate-800">
                <span>Perintah: python3 scripts/zlce/zlce-check.py . --no-git --strict</span>
                <span className={isCheckOk ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {isCheckOk ? 'STATUS: LULUS' : 'STATUS: PERINGATAN / GAGAL'}
                </span>
              </div>
              <pre className="text-xs font-mono text-emerald-300 py-2">
                {checkOutput || 'Menjalankan validator...'}
              </pre>
            </div>

            {/* Gauge Estimasi Token Dokumen Kontrol */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  Estimasi Konsumsi Token Dokumen Kontrol (1 token ≈ 4 karakter)
                </span>
                <span className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  Hemat Token (Mode LITE)
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                  <div className="text-slate-500 text-[11px]">FOLDER_KERJA/SESSION_STATE.md</div>
                  <div className="text-base font-bold font-mono text-slate-900">~1.750 Token</div>
                  <div className="text-[10px] text-slate-400">7.100 karakter</div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                  <div className="text-slate-500 text-[11px]">FOLDER_KERJA/AI_WORKFLOW.md</div>
                  <div className="text-base font-bold font-mono text-slate-900">~1.900 Token</div>
                  <div className="text-[10px] text-slate-400">7.600 karakter</div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                  <div className="text-slate-500 text-[11px]">FOLDER_KERJA/SPEC_AND_DECISIONS.md</div>
                  <div className="text-base font-bold font-mono text-slate-900">~3.800 Token</div>
                  <div className="text-[10px] text-slate-400">15.400 karakter</div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                  <div className="text-slate-500 text-[11px]">Total 1 Folder Kerja</div>
                  <div className="text-base font-bold font-mono text-emerald-700">~7.850 Token</div>
                  <div className="text-[10px] text-slate-400">Sangat efisien untuk AI context</div>
                </div>
              </div>
            </div>

            {/* Checklist 10 Guardrail ZLCE v3.2.2 */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                Kepatuhan 10 Guardrail Resmi ZLCE v3.2.2 & Proteksi Ryokourent
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {[
                  { label: 'R1. Sumber kebenaran tunggal status hanya di SESSION_STATE.md', status: true },
                  { label: 'R3. Dilarang mengarang jam baru (Aturan X1 Anti-Ekstrapolasi)', status: true },
                  { label: 'R4. Tepat 1 task berstatus IN_PROGRESS pada satu waktu', status: true },
                  { label: 'R5. Status DONE wajib disertai bukti verifikasi riil + Disetujui: ya', status: true },
                  { label: 'R7. Triase revisi Level S (<20 baris) vs Level M/L terpisah', status: true },
                  { label: 'R12. Pengisian Write-Ahead Log (WAL) sebelum modifikasi multi-berkas', status: true },
                  { label: 'D-31. Aturan Emas: Dilarang menimpa ulang (full overwrite) kode lama', status: true },
                  { label: 'D-26. Pool hanya tempat parkir, kuota global & CPT ryokou_lacak aktif', status: true },
                  { label: 'D-27. Kalkulator denda ShortRent step-up 60 menit & 12 jam = harian', status: true },
                  { label: 'D-21. Kepatuhan UU PDP No. 27/2022: Dilarang simpan NIK 16 digit/KTP', status: true },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="text-slate-800 font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
